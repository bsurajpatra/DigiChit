import ChitGroup, { CommissionType, LateFeeType, AuctionStrategy } from '../models/ChitGroup.js';

export const migrateFinancialConfig = async () => {
    try {
        const groupsWithoutConfig = await ChitGroup.find({
            $or: [
                { financialConfig: { $exists: false } },
                { financialConfig: null }
            ]
        });

        if (groupsWithoutConfig.length === 0) {
            console.log('[Migration]: All ChitGroups have financialConfig initialized.');
            return;
        }

        console.log(`[Migration]: Backfilling financialConfig for ${groupsWithoutConfig.length} ChitGroups...`);

        for (const group of groupsWithoutConfig) {
            const commVal = group.commissionPercent !== undefined ? group.commissionPercent : 2;
            group.financialConfig = {
                version: 1,
                commission: {
                    value: commVal,
                    type: CommissionType.PERCENTAGE
                },
                lateFee: {
                    value: 0,
                    type: LateFeeType.FIXED
                },
                gracePeriodDays: 3,
                auctionStrategy: AuctionStrategy.LOWEST_BID,
                allowPartialInstallment: false,
                allowPrepayment: true,
                allowPenaltyWaiver: true,
                currency: 'INR'
            };
            await group.save();
        }

        console.log('[Migration]: FinancialConfig backfill migration completed successfully.');
    } catch (error) {
        console.error('[Migration Error]: Failed to run financialConfig backfill:', error);
    }
};
