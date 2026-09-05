import crypto from 'crypto';

export interface PaymentInitiationFingerprintParams {
    installmentId: string;
    paymentMethod?: string | null | undefined;
    paymentGateway?: string | null | undefined;
}

/**
 * Computes a deterministic SHA-256 hash of the canonical initiation request parameters.
 * Note: Amount is NOT included because amount is server-calculated from Installment dues.
 */
export function generatePaymentFingerprint(params: PaymentInitiationFingerprintParams): string {
    const canonicalPayload = JSON.stringify({
        installmentId: params.installmentId ? params.installmentId.toString().trim() : '',
        paymentMethod: params.paymentMethod ? params.paymentMethod.toString().trim() : 'MOCK',
        paymentGateway: params.paymentGateway ? params.paymentGateway.toString().trim() : 'MOCK'
    });

    return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
}
