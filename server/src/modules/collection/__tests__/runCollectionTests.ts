import mongoose from 'mongoose';
import { config } from '@shared/config/env.js';
import { runCollectionManagementTests } from './collectionManagementFlow.test.js';

async function main() {
    await mongoose.connect(config.mongoUri);
    try {
        await runCollectionManagementTests();
    } catch (e) {
        console.error('Collection test execution error:', e);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
