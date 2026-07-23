export type InstallmentPaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'WAIVED' | 'FAILED';

export interface InstallmentUser {
    _id: string;
    name: string;
    email: string;
}

export interface InstallmentMembership {
    _id: string;
    userId: string | InstallmentUser;
    chitGroupId: string;
    status: string;
    joinedAt?: string;
    isWinner: boolean;
}

export interface InstallmentGroup {
    _id: string;
    name: string;
    monthlyContribution: number;
    totalMembers: number;
}

export interface InstallmentCycle {
    _id: string;
    cycleNumber: number;
    status: string;
    scheduledStartDate: string;
}

export interface Installment {
    _id: string;
    cycleId: string | InstallmentCycle;
    groupId: string | InstallmentGroup;
    membershipId: string | InstallmentMembership;
    userId: string | InstallmentUser;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paymentStatus: InstallmentPaymentStatus;
    status?: InstallmentPaymentStatus;
    paidAmount: number;
    paidDate?: string | null;
    lateFee: number;
    isLateFeeWaived?: boolean;
    lateFeeWaivedAt?: string | null;
    lateFeeWaivedBy?: string | null;
    transactionId?: string | null;
    remarks?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface InstallmentGroupStats {
    totalExpectedAmount: number;
    totalCollectedAmount: number;
    totalPendingAmount: number;
    collectionPercentage: number;
    totalInstallments: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    totalLateFeesAccrued: number;
}

export interface GenerateInstallmentsInput {
    cycleId: string;
    dueDate?: string;
}

export interface WaiveLateFeeInput {
    remarks?: string;
}
