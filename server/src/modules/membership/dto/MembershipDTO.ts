export interface RequestJoinDto {
    userId: string;
    chitGroupId: string;
}

export interface ApproveMemberDto {
    organizerId: string;
    membershipId: string;
}

export interface RejectMemberDto {
    organizerId: string;
    membershipId: string;
}
