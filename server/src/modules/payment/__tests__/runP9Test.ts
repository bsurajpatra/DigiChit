import mongoose from 'mongoose';
import { config } from '@shared/config/env.js';
import { runE2EPaymentFlowTests } from './e2ePaymentFlow.test.js';

async function main() {
    await mongoose.connect(config.mongoUri);
    try {
        await runE2EPaymentFlowTests();
    } catch (e) {
        console.error('P9 execution error:', e);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
