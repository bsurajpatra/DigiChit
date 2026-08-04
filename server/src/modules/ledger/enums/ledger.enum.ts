export enum LedgerEntryType {
    INSTALLMENT_PAYMENT = 'INSTALLMENT_PAYMENT',
    REFUND = 'REFUND',
    LATE_FEE = 'LATE_FEE',
    MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
    REVERSAL = 'REVERSAL'
}

export enum LedgerDirection {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT'
}

export enum LedgerReferenceType {
    TRANSACTION = 'TRANSACTION',
    REFUND = 'REFUND',
    MANUAL = 'MANUAL'
}

export enum LedgerAccountType {
    MEMBER_RECEIVABLE = 'MEMBER_RECEIVABLE',
    COLLECTION_ACCOUNT = 'COLLECTION_ACCOUNT'
}
