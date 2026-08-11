import { logger } from '@shared/logger/logger.js';
import mongoose from 'mongoose';
import app from './app.js';
import { config } from '@shared/config/env.js';
import { migrateFinancialConfig } from '@shared/database/migrateFinancialConfig.js';

const { port, mongoUri } = config;

mongoose
    .connect(mongoUri)
    .then(async () => {
        logger.info('Connected to MongoDB');
        await migrateFinancialConfig();
        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    });
