import { IInstallment, PaymentStatus } from '../models/Installment.js';

export interface IGenerateInstallmentsInput {
    cycleId: string;
    dueDate?: Date | string;
}

export interface IUpdateInstallmentInput {
    amount?: number;
    dueDate?: Date | string;
    lateFee?: number;
    remarks?: string;
}

export interface IUpdateInstallmentStatusInput {
    paymentStatus: PaymentStatus;
    paidAmount?: number;
    paymentMethod?: string;
    transactionId?: string;
    remarks?: string;
}

export type { IInstallment, PaymentStatus };
