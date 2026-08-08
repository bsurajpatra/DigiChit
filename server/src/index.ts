import mongoose from 'mongoose';
import app from './app.js';
import { config } from './shared/config/env.js';
import { migrateFinancialConfig } from './shared/database/migrateFinancialConfig.js';

const { port, mongoUri } = config;

mongoose
    .connect(mongoUri)
    .then(async () => {
        console.log('Connected to MongoDB');
        await migrateFinancialConfig();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
