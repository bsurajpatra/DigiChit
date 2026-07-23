import api from './axios';
import type { Installment, InstallmentPaymentStatus } from '../types/installment';

export const fetchGroupInstallments = async (groupId: string, status?: InstallmentPaymentStatus): Promise<Installment[]> => {
    const res = await api.get(`/installments/group/${groupId}`, {
        params: status ? { status } : {}
    });
    return res.data.data.installments;
};

export const fetchCycleInstallments = async (cycleId: string, status?: InstallmentPaymentStatus): Promise<Installment[]> => {
    const res = await api.get(`/installments/cycle/${cycleId}`, {
        params: status ? { status } : {}
    });
    return res.data.data.installments;
};

export const fetchMemberInstallments = async (membershipId: string): Promise<Installment[]> => {
    const res = await api.get(`/installments/member/${membershipId}`);
    return res.data.data.installments;
};

export const fetchInstallmentById = async (installmentId: string): Promise<Installment> => {
    const res = await api.get(`/installments/${installmentId}`);
    return res.data.data.installment;
};

export const generateCycleInstallments = async (cycleId: string, dueDate?: string): Promise<Installment[]> => {
    const res = await api.post(`/installments/generate/${cycleId}`, { dueDate });
    return res.data.data.installments || [];
};

export const waiveLateFee = async (installmentId: string, remarks?: string): Promise<Installment> => {
    const res = await api.patch(`/installments/${installmentId}`, { lateFee: 0, remarks });
    return res.data.data.installment;
};

export const updateInstallmentStatus = async (installmentId: string, paymentStatus: InstallmentPaymentStatus, remarks?: string): Promise<Installment> => {
    const res = await api.patch(`/installments/${installmentId}/status`, { paymentStatus, remarks });
    return res.data.data.installment;
};
