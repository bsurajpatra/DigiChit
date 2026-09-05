import { logger } from '@shared/logger/logger.js';
import cron from 'node-cron';
import { UserRepository } from '../repositories/UserRepository.js';

const userRepo = new UserRepository();
let inactivityTask: cron.ScheduledTask | null = null;

/**
 * Scheduled job to handle account inactivity.
 * Runs every day at midnight.
 * Rule: If lastLoginAt > 180 days, set status to INACTIVE.
 */
export const initInactivityCron = (): cron.ScheduledTask => {
    if (inactivityTask) {
        return inactivityTask;
    }

    // Run at 00:00 every day
    inactivityTask = cron.schedule('0 0 * * *', async () => {
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

    return inactivityTask;
};

/**
 * Stops the scheduled inactivity cron job during graceful shutdown.
 */
export const stopInactivityCron = (): void => {
    if (inactivityTask) {
        inactivityTask.stop();
        inactivityTask = null;
        logger.info('[CRON] Inactivity check cron job stopped.');
    }
};

/**
 * Returns whether the inactivity cron job is currently active.
 */
export const isCronRunning = (): boolean => {
    return inactivityTask !== null;
};
