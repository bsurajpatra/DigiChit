import { PaymentStatus } from '../models/Installment.js';

export interface GenerateInstallmentsDto {
    dueDate?: Date | string;
}

export interface UpdateInstallmentDto {
    amount?: number;
    dueDate?: Date | string;
    lateFee?: number;
    remarks?: string;
}

export interface UpdateInstallmentStatusDto {
    paymentStatus: PaymentStatus;
    paidAmount?: number;
    paymentMethod?: string;
    transactionId?: string;
    remarks?: string;
}
