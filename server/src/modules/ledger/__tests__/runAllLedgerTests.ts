import mongoose from 'mongoose';
import { config } from '@shared/config/env.js';
import { runJournalPostingTests } from './journalPosting.test.js';
import { runAccountProvisioningTests } from './accountProvisioning.test.js';
import { runInstallmentObligationJournalTests } from '@modules/installment/__tests__/installmentObligationJournal.test.js';
import { runPaymentJournalPostingTests } from './paymentJournalPosting.test.js';
import { runPaymentRefundJournalPostingTests } from './paymentRefundJournalPosting.test.js';
import { runWinnerPotAllocationJournalTests } from './winnerPotAllocationJournal.test.js';

async function main() {
    console.log('\n======================================================');
    console.log('  STARTING CONSOLIDATED LEDGER TEST RUNNER (P0 - P5)');
    console.log('======================================================\n');

    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB at:', config.mongoUri);

        // 1. Run P0 Tests
        console.log('\n--- 1. LEDGER P0: DOUBLE-ENTRY CORE FOUNDATION ---');
        await runJournalPostingTests();

        // 2. Run P1 Tests
        console.log('\n--- 2. LEDGER P1: AUTOMATIC ACCOUNT PROVISIONING ---');
        await runAccountProvisioningTests();

        // 3. Run P2 Tests
        console.log('\n--- 3. LEDGER P2: INSTALLMENT OBLIGATION ACCOUNTING ---');
        await runInstallmentObligationJournalTests();

        // 4. Run P3 Tests
        console.log('\n--- 4. LEDGER P3: PAYMENT SUCCESS DOUBLE-ENTRY ACCOUNTING ---');
        await runPaymentJournalPostingTests();

        // 5. Run P4 Tests
        console.log('\n--- 5. LEDGER P4: REFUND DOUBLE-ENTRY ACCOUNTING ---');
        await runPaymentRefundJournalPostingTests();

        // 6. Run P5 Tests
        console.log('\n--- 6. LEDGER P5: WINNER POT ALLOCATION ACCOUNTING ---');
        await runWinnerPotAllocationJournalTests();

        console.log('\n======================================================');
        console.log('  🎉 ALL LEDGER SUITES (P0, P1, P2, P3, P4, P5) PASSED CLEANLY');
        console.log('======================================================\n');
    } catch (err: any) {
        console.error('\n❌ TEST RUNNER FAILED WITH ERROR:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

main();
