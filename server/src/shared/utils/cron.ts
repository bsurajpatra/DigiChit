import cron from 'node-cron';

export const scheduleCronJob = (cronExpression: string, task: () => void | Promise<void>) => {
    return cron.schedule(cronExpression, task);
};
