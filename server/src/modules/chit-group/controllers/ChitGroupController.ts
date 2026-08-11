import { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/index.js';
import { ChitGroupService } from '../services/ChitGroupService.js';
import { ChitGroupRepository } from '../repositories/ChitGroupRepository.js';
import { AppError } from '@shared/errors/AppError.js';

const chitGroupService = new ChitGroupService();
const chitGroupRepo = new ChitGroupRepository();

export class ChitGroupController {
    public static async createChitGroup(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const chitGroup = await chitGroupService.createChitGroup(req.user!.id, req.body);
            res.status(201).json({ success: true, data: { chitGroup } });
        } catch (error) {
            next(error);
        }
    }

    public static async updateChitGroup(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
            const chitGroup = await chitGroupService.updateChitGroup(
                req.user!.id,
                req.user!.role,
                req.params.id as string,
                req.body,
                clientIp
            );
            res.status(200).json({ success: true, data: { chitGroup } });
        } catch (error) {
            next(error);
        }
    }

    public static async getChitGroups(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groups = await chitGroupRepo.findFormingGroupsExcludingOrganizer(req.user!.id);
            const groupIds = groups.map((g) => g._id);

            const userMemberships = await chitGroupRepo.findUserMembershipsForGroupIds(req.user!.id, groupIds);
            const membershipMap = new Map(
                userMemberships.map((m) => [m.chitGroupId.toString(), m.status])
            );

            const groupsWithMembership = groups.map((group) => ({
                ...group,
                myMembershipStatus: membershipMap.get(group._id.toString()) || null
            }));

            res.status(200).json({ success: true, data: { groups: groupsWithMembership } });
        } catch (error) {
            next(error);
        }
    }

    public static async getChitGroupDetails(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const group = await chitGroupRepo.findByIdWithOrganizer(req.params.id as string);
            if (!group) return next(new AppError('Group not found.', 404));

            const members = await chitGroupRepo.findMembersByGroupId(group._id);

            res.status(200).json({ success: true, data: { group, members } });
        } catch (error) {
            next(error);
        }
    }

    public static async requestJoin(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const membership = await chitGroupService.requestJoin(req.user!.id, req.params.id as string);
            res.status(201).json({ success: true, data: { membership } });
        } catch (error) {
            next(error);
        }
    }

    public static async approveMember(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const membership = await chitGroupService.approveMember(req.user!.id, req.params.membershipId as string);
            res.status(200).json({ success: true, data: { membership } });
        } catch (error) {
            next(error);
        }
    }

    public static async rejectMember(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const membership = await chitGroupService.rejectMember(req.user!.id, req.params.membershipId as string);
            res.status(200).json({ success: true, data: { membership } });
        } catch (error) {
            next(error);
        }
    }

    public static async getMyMemberships(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const memberships = await chitGroupRepo.findUserMembershipsWithGroup(req.user!.id);
            res.status(200).json({ success: true, data: { memberships } });
        } catch (error) {
            next(error);
        }
    }

    public static async getOrganizerGroups(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groups = await chitGroupRepo.findByOrganizerId(req.user!.id);
            res.status(200).json({ success: true, data: { groups } });
        } catch (error) {
            next(error);
        }
    }

    public static async manualAddMember(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;
            const membership = await chitGroupService.manualAddMember(req.user!.id, req.params.id as string, email);
            res.status(201).json({ success: true, data: { membership } });
        } catch (error) {
            next(error);
        }
    }
}
