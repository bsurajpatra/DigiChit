import { logger } from '@shared/logger/logger.js';
import cron from 'node-cron';
import { UserRepository } from '../repositories/UserRepository.js';

const userRepo = new UserRepository();

/**
 * Scheduled job to handle account inactivity.
 * Runs every day at midnight.
 * Rule: If lastLoginAt > 180 days, set status to INACTIVE.
 */
export const initInactivityCron = () => {
    // Run at 00:00 every day
    cron.schedule('0 0 * * *', async () => {
        logger.info('[CRON] Starting inactivity check...');
        
        const inactivityPeriod = 180 * 24 * 60 * 60 * 1000; // 180 days in ms
        const cutoffDate = new Date(Date.now() - inactivityPeriod);

        try {
            const modifiedCount = await userRepo.markInactiveUsers(cutoffDate);
            logger.info(`[CRON] Inactivity check completed. ${modifiedCount} accounts marked INACTIVE.`);
        } catch (error) {
            logger.error('[CRON] Error during inactivity check:', error);
        }
    });
};
