import mongoose from 'mongoose';
import { ChitGroupRepository } from '../repositories/ChitGroupRepository.js';
import ChitGroup, {
    IChitGroup,
    ChitGroupStatus,
    CommissionType,
    LateFeeType,
    AuctionStrategy,
    IFinancialConfig
} from '../models/ChitGroup.js';
import Membership, { IMembership, MembershipStatus } from '../../../models/Membership.js';
import User, { UserRole } from '../../user/models/User.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logAction } from '../../../utils/auditLogger.js';
import { sendChitGroupCreatedEmail } from '../../../utils/email.js';
import { ICreateChitGroupInput } from '../interfaces/IChitGroup.js';

export class ChitGroupService {
    private repo: ChitGroupRepository;

    constructor() {
        this.repo = new ChitGroupRepository();
    }

    /**
     * Checks if financial activity exists for a group.
     */
    public async hasFinancialActivity(groupId: string): Promise<boolean> {
        return await this.repo.hasFinancialActivity(groupId);
    }

    /**
     * Creates a new ChitGroup.
     */
    public async createChitGroup(organizerId: string, data: ICreateChitGroupInput) {
        if (data.monthlyContribution && data.monthlyContribution <= 0) {
            throw new AppError('Monthly contribution must be greater than 0.', 400);
        }

        if (data.totalMembers && (data.totalMembers < 2 || data.totalMembers > 50)) {
            throw new AppError('Total members must be between 2 and 50.', 400);
        }

        if (data.startDate && new Date(data.startDate) <= new Date()) {
            throw new AppError('Start date must be in the future.', 400);
        }

        const commissionVal = data.financialConfig?.commission?.value ?? data.commissionPercent ?? 2;
        const commissionType = data.financialConfig?.commission?.type ?? CommissionType.PERCENTAGE;

        const finalFinancialConfig: IFinancialConfig = {
            version: 1,
            commission: {
                value: commissionVal,
                type: commissionType
            },
            lateFee: {
                value: data.financialConfig?.lateFee?.value ?? 0,
                type: data.financialConfig?.lateFee?.type ?? LateFeeType.FIXED
            },
            gracePeriodDays: data.financialConfig?.gracePeriodDays ?? 3,
            auctionStrategy: data.financialConfig?.auctionStrategy ?? AuctionStrategy.LOWEST_BID,
            allowPartialInstallment: data.financialConfig?.allowPartialInstallment ?? false,
            allowPrepayment: data.financialConfig?.allowPrepayment ?? true,
            allowPenaltyWaiver: data.financialConfig?.allowPenaltyWaiver ?? true,
            currency: data.financialConfig?.currency ?? 'INR'
        };

        const group = new ChitGroup({
            name: data.name,
            totalMembers: data.totalMembers,
            monthlyContribution: data.monthlyContribution,
            commissionPercent: commissionVal,
            startDate: data.startDate,
            auctionType: data.auctionType,
            financialConfig: finalFinancialConfig,
            description: data.description,
            organizerId: new mongoose.Types.ObjectId(organizerId),
            durationMonths: data.totalMembers,
            status: ChitGroupStatus.FORMING,
            currentMemberCount: 0
        } as any);

        await this.repo.saveGroup(group);

        await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_GROUP_CREATED', {
            newValue: { name: group.name, id: (group._id as any).toString(), financialConfig: group.financialConfig }
        });

        // Send confirmation email to organizer
        User.findById(organizerId).then((user) => {
            if (user) {
                sendChitGroupCreatedEmail(
                    user.email,
                    user.name,
                    group.name,
                    group.monthlyContribution,
                    group.totalMembers,
                    new Date(group.startDate).toDateString()
                );
            }
        });

        return group;
    }

    /**
     * Updates an existing ChitGroup.
     */
    public async updateChitGroup(
        actorId: string,
        actorRole: UserRole,
        groupId: string,
        updateData: any,
        ipAddress?: string
    ) {
        const group = await this.repo.findById(groupId);
        if (!group) throw new AppError('Group not found.', 404);

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to update this group.', 403);
        }

        const previousValue = group.toObject();

        if (updateData.financialConfig) {
            const activityExists = await this.repo.hasFinancialActivity(groupId);
            if (activityExists) {
                const currentFC = group.financialConfig;
                const newFC = updateData.financialConfig;

                const isCriticalChanged =
                    (newFC.commission && (newFC.commission.value !== currentFC.commission.value || newFC.commission.type !== currentFC.commission.type)) ||
                    (newFC.auctionStrategy && newFC.auctionStrategy !== currentFC.auctionStrategy) ||
                    (newFC.currency && newFC.currency !== currentFC.currency);

                if (isCriticalChanged && actorRole !== UserRole.ADMIN) {
                    throw new AppError(
                        'Critical financial settings (commission, strategy, currency) are locked because financial activity has started for this group. Only Admins can modify them.',
                        403,
                        'FINANCIAL_CONFIG_LOCKED'
                    );
                }
            }

            group.financialConfig = {
                ...group.financialConfig,
                ...updateData.financialConfig,
                commission: {
                    ...group.financialConfig.commission,
                    ...(updateData.financialConfig.commission || {})
                },
                lateFee: {
                    ...group.financialConfig.lateFee,
                    ...(updateData.financialConfig.lateFee || {})
                }
            };
            group.commissionPercent = group.financialConfig.commission.value;
        }

        if (updateData.name) group.name = updateData.name;
        if (updateData.description !== undefined) group.description = updateData.description;

        await this.repo.saveGroup(group);

        const actionName = actorRole === UserRole.ADMIN && (await this.repo.hasFinancialActivity(groupId))
            ? 'FINANCIAL_CONFIG_ADMIN_OVERRIDE'
            : 'FINANCIAL_CONFIG_UPDATED';

        await logAction(actorId, actorRole, actionName, {
            previousValue,
            newValue: group.toObject(),
            ...(ipAddress ? { ipAddress } : {})
        });

        return group;
    }

    /**
     * User requests to join a forming chit group.
     */
    public async requestJoin(userId: string, chitGroupId: string) {
        const group = await this.repo.findById(chitGroupId);
        if (!group) throw new AppError('Group not found.', 404);
        if (group.status !== ChitGroupStatus.FORMING) {
            throw new AppError('Joining is only allowed during the FORMING phase.', 400);
        }

        const existingMembership = await this.repo.findMembershipByUserAndGroup(userId, chitGroupId);
        if (existingMembership) {
            throw new AppError('You have already requested or joined this group.', 400);
        }

        const approvedCount = await this.repo.countApprovedMembers(chitGroupId);

        if (approvedCount >= group.totalMembers) {
            throw new AppError('Chit Group is full.', 400);
        }

        const membership = await this.repo.createMembership({
            chitGroupId: new mongoose.Types.ObjectId(chitGroupId),
            userId: new mongoose.Types.ObjectId(userId),
            status: MembershipStatus.REQUESTED
        });

        await logAction(userId, UserRole.USER, 'CHIT_JOIN_REQUESTED', {
            newValue: { chitGroupId, membershipId: (membership._id as any).toString() }
        });

        return membership;
    }

    /**
     * Organizer approves a pending member request.
     */
    public async approveMember(organizerId: string, membershipId: string) {
        const membership = await this.repo.findMembershipByIdWithGroup(membershipId);
        if (!membership) throw new AppError('Membership record not found.', 404);

        const group = membership.chitGroupId as unknown as IChitGroup;
        if (group.organizerId.toString() !== organizerId) {
            throw new AppError('Unauthorized.', 403);
        }

        if (group.status !== ChitGroupStatus.FORMING) {
            throw new AppError('Cannot approve outside FORMING phase.', 400);
        }

        const approvedCount = await this.repo.countApprovedMembers(group._id);

        if (approvedCount >= group.totalMembers) {
            throw new AppError('Full capacity reached.', 400);
        }

        membership.status = MembershipStatus.APPROVED;
        await this.repo.saveMembership(membership);

        await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_MEMBER_APPROVED', {
            targetUserId: membership.userId.toString(),
            newValue: { membershipId, chitGroupId: (group._id as any).toString() }
        });

        const newApprovedCount = approvedCount + 1;
        group.currentMemberCount = newApprovedCount;
        await this.repo.saveGroup(group);

        if (newApprovedCount === group.totalMembers) {
            await this.activateGroup(group._id.toString(), organizerId);
        }

        return membership;
    }

    /**
     * Activates a group when capacity is full.
     */
    public async activateGroup(chitGroupId: string, organizerId: string) {
        const group = await this.repo.findById(chitGroupId);
        if (!group) return;

        group.status = ChitGroupStatus.ACTIVE;
        await this.repo.saveGroup(group);

        await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_GROUP_ACTIVATED', {
            newValue: { chitGroupId }
        });

        await this.repo.activateGroupMemberships(chitGroupId);
    }

    /**
     * Organizer rejects a pending member request.
     */
    public async rejectMember(organizerId: string, membershipId: string) {
        const membership = await this.repo.findMembershipByIdWithGroup(membershipId);
        if (!membership) throw new AppError('Membership record not found.', 404);

        const group = membership.chitGroupId as unknown as IChitGroup;
        if (group.organizerId.toString() !== organizerId) {
            throw new AppError('Unauthorized.', 403);
        }

        membership.status = MembershipStatus.REJECTED;
        await this.repo.saveMembership(membership);

        await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_MEMBER_REJECTED', {
            targetUserId: membership.userId.toString(),
            newValue: { membershipId, chitGroupId: (group._id as any).toString() }
        });

        return membership;
    }

    /**
     * Organizer manually adds a member by email.
     */
    public async manualAddMember(organizerId: string, chitGroupId: string, userEmail: string) {
        const group = await this.repo.findById(chitGroupId);
        if (!group) throw new AppError('Group not found.', 404);

        if (group.organizerId.toString() !== organizerId) {
            throw new AppError('Unauthorized.', 403);
        }

        if (group.status !== ChitGroupStatus.FORMING) {
            throw new AppError('Manual adding is only allowed during the FORMING phase.', 400);
        }

        const user = await User.findOne({ email: userEmail.toLowerCase(), kycStatus: 'APPROVED' });
        if (!user) {
            throw new AppError('User not found or not KYC approved.', 404);
        }

        const existingMembership = await this.repo.findMembershipByUserAndGroup(user._id.toString(), chitGroupId);
        if (existingMembership) {
            throw new AppError('User is already a member or has a pending request.', 400);
        }

        const approvedCount = await this.repo.countApprovedMembers(chitGroupId);

        if (approvedCount >= group.totalMembers) {
            throw new AppError('Chit Group is full.', 400);
        }

        const membership = await this.repo.createMembership({
            chitGroupId: new mongoose.Types.ObjectId(chitGroupId),
            userId: user._id,
            status: MembershipStatus.APPROVED
        });

        await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_MEMBER_MANUALLY_ADDED', {
            targetUserId: user._id.toString(),
            newValue: { membershipId: (membership._id as any).toString(), chitGroupId }
        });

        group.currentMemberCount = approvedCount + 1;
        await this.repo.saveGroup(group);

        if (group.currentMemberCount === group.totalMembers) {
            await this.activateGroup(chitGroupId, organizerId);
        }

        return membership;
    }
}
