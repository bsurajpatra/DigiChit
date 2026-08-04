export interface CreateChitGroupDto {
    name: string;
    totalMembers: number;
    monthlyContribution: number;
    durationMonths: number;
    startDate: Date | string;
    remarks?: string;
}

export interface UpdateChitGroupDto {
    name?: string;
    remarks?: string;
}
