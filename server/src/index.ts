import { logger } from '@shared/logger/logger.js';
import mongoose from 'mongoose';
import app from './app.js';
import { config } from '@shared/config/env.js';
import { migrateFinancialConfig } from '@modules/chit-group/utils/migrateFinancialConfig.js';
import { setupGracefulShutdown } from '@shared/shutdown/GracefulShutdown.js';

const { port, mongoUri } = config;

mongoose
    .connect(mongoUri)
    .then(async () => {
        logger.info('Connected to MongoDB');
        await migrateFinancialConfig();
        const server = app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
        setupGracefulShutdown(server);
    })
    .catch((err) => {
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    });
