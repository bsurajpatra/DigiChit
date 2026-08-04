import { IMembership, MembershipStatus } from '../models/Membership.js';

export interface IRequestJoinInput {
    userId: string;
    chitGroupId: string;
}

export interface IApproveMemberInput {
    organizerId: string;
    membershipId: string;
}

export interface IRejectMemberInput {
    organizerId: string;
    membershipId: string;
}

export interface IMarkWinnerInput {
    membershipId: string;
    payoutMonth: number;
}

export type { IMembership, MembershipStatus };
