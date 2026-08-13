import ChitGroup, { CommissionType, LateFeeType, AuctionStrategy } from '../models/ChitGroup.js';
import { logger } from '@shared/logger/logger.js';

/**
 * Migration helper to ensure all existing ChitGroup records have a valid financialConfig object.
 */
export const migrateFinancialConfig = async () => {
    try {
        const groupsWithoutConfig = await ChitGroup.find({
            $or: [
                { financialConfig: { $exists: false } },
                { financialConfig: null }
            ]
        });

        if (groupsWithoutConfig.length === 0) {
            logger.info('[Migration]: All ChitGroups have financialConfig initialized.');
            return;
        }

        logger.info(`[Migration]: Backfilling financialConfig for ${groupsWithoutConfig.length} ChitGroups...`);

        for (const group of groupsWithoutConfig) {
            group.financialConfig = {
                version: 1,
                commission: {
                    value: 5,
                    type: CommissionType.PERCENTAGE
                },
                lateFee: {
                    value: 0.1,
                    type: LateFeeType.PERCENTAGE
                },
                gracePeriodDays: 5,
                auctionStrategy: AuctionStrategy.LOWEST_BID,
                allowPartialInstallment: false,
                allowPrepayment: true,
                allowPenaltyWaiver: true,
                currency: 'INR'
            };
            await group.save();
        }

        logger.info('[Migration]: FinancialConfig backfill migration completed successfully.');
    } catch (error) {
        logger.error('[Migration Error]: Failed to run financialConfig backfill:', error);
    }
};
