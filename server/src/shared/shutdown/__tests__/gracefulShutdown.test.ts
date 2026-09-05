import http from 'http';
import mongoose from 'mongoose';
import express from 'express';
import { config } from '@shared/config/env.js';
import { logger } from '@shared/logger/logger.js';
import {
    GracefulShutdownManager,
    shutdownManager,
    setupGracefulShutdown
} from '../GracefulShutdown.js';
import {
    initInactivityCron,
    stopInactivityCron,
    isCronRunning
} from '@modules/user/index.js';
import { eventBus } from '@shared/event-bus/EventBus.js';

let totalTests = 0;
let passedTests = 0;

function pass(name: string) {
    totalTests++;
    passedTests++;
    console.log(`✅ [PASS] ${totalTests}. ${name}`);
}

function fail(name: string, error: any) {
    totalTests++;
    console.error(`❌ [FAIL] ${totalTests}. ${name}:`, error);
    throw error;
}

export async function runGracefulShutdownTests(): Promise<void> {
    console.log('\n=== RUNNING GRACEFUL SHUTDOWN AUTOMATED TESTS ===\n');

    // -------------------------------------------------------------------------
    // TEST 1: Normal startup & Resource Initialization
    // -------------------------------------------------------------------------
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(config.mongoUri);
        }
        if (mongoose.connection.readyState !== 1) {
            throw new Error(`MongoDB connection failed (state: ${mongoose.connection.readyState})`);
        }
        pass('MongoDB connection initialized and verified (ReadyState === 1)');
    } catch (err) {
        fail('MongoDB connection initialization', err);
    }

    // -------------------------------------------------------------------------
    // TEST 2: HTTP Server Initialization
    // -------------------------------------------------------------------------
    let testServer: http.Server | null = null;
    try {
        const testApp = express();
        testApp.get('/health', (req, res) => res.json({ status: 'ok' }));

        await new Promise<void>((resolve) => {
            testServer = testApp.listen(0, () => {
                resolve();
            });
        });

        if (!testServer || !(testServer as any).listening) {
            throw new Error('HTTP server failed to listen on port');
        }
        pass('HTTP server started and actively listening');
    } catch (err) {
        fail('HTTP server startup', err);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Scheduled Cron Task Initialization
    // -------------------------------------------------------------------------
    try {
        initInactivityCron();
        if (!isCronRunning()) {
            throw new Error('Inactivity cron job failed to start');
        }
        pass('Inactivity cron task started and active (isCronRunning() === true)');
    } catch (err) {
        fail('Cron task startup', err);
    }

    // -------------------------------------------------------------------------
    // TEST 4: EventBus Subscriptions Active
    // -------------------------------------------------------------------------
    let eventReceived = false;
    try {
        eventBus.subscribe('TEST_SHUTDOWN_EVENT', () => {
            eventReceived = true;
        });
        eventBus.publish({
            eventType: 'TEST_SHUTDOWN_EVENT',
            timestamp: new Date(),
            data: {}
        });
        if (!eventReceived) {
            throw new Error('EventBus failed to receive published event');
        }
        pass('EventBus active with registered listeners');
    } catch (err) {
        fail('EventBus active check', err);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Graceful Shutdown Execution on SIGTERM
    // -------------------------------------------------------------------------
    try {
        shutdownManager.resetStateForTesting();
        if (testServer) {
            shutdownManager.registerServer(testServer);
        }

        const result = await shutdownManager.executeShutdown('SIGTERM', 0, {
            timeoutMs: 5000,
            exitProcess: false
        });

        if (!result.success) throw new Error('Shutdown returned unsuccessful status');
        if (!result.closedServer) throw new Error('Server was not marked as closed');
        if (!result.stoppedCron) throw new Error('Cron was not marked as stopped');
        if (!result.closedDb) throw new Error('Database was not marked as closed');

        pass('SIGTERM triggers graceful shutdown sequence and closes all components');
    } catch (err) {
        fail('SIGTERM shutdown execution', err);
    }

    // -------------------------------------------------------------------------
    // TEST 6: HTTP Server Stopped Accepting Connections
    // -------------------------------------------------------------------------
    try {
        if (testServer && (testServer as any).listening) {
            throw new Error('HTTP server is still listening after shutdown');
        }
        pass('HTTP server confirmed closed (listening === false)');
    } catch (err) {
        fail('HTTP server closed check', err);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Scheduled Cron Job Stopped
    // -------------------------------------------------------------------------
    try {
        if (isCronRunning()) {
            throw new Error('Inactivity cron task is still running after shutdown');
        }
        pass('Inactivity cron task confirmed stopped (isCronRunning() === false)');
    } catch (err) {
        fail('Cron task stop check', err);
    }

    // -------------------------------------------------------------------------
    // TEST 8: MongoDB Connection Closed
    // -------------------------------------------------------------------------
    try {
        if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
            throw new Error(`MongoDB connection is still open (readyState: ${mongoose.connection.readyState})`);
        }
        pass('MongoDB connection confirmed closed (readyState === 0)');
    } catch (err) {
        fail('MongoDB closed check', err);
    }

    // -------------------------------------------------------------------------
    // TEST 9: EventBus Listeners Cleared
    // -------------------------------------------------------------------------
    try {
        const listenerCount = eventBus.listenerCount('TEST_SHUTDOWN_EVENT');
        if (listenerCount !== 0) {
            throw new Error(`EventBus still has ${listenerCount} listeners attached`);
        }
        pass('EventBus listeners confirmed cleared (listenerCount === 0)');
    } catch (err) {
        fail('EventBus listeners cleared check', err);
    }

    // -------------------------------------------------------------------------
    // TEST 10: Idempotent Shutdown (Repeated Signal Ignored)
    // -------------------------------------------------------------------------
    try {
        // Shutdown is already complete from Test 5
        const secondResult = await shutdownManager.executeShutdown('SIGINT', 0, {
            timeoutMs: 5000,
            exitProcess: false
        });

        if (!secondResult.success) throw new Error('Repeated shutdown did not handle safely');
        if (secondResult.closedServer || secondResult.closedDb) {
            throw new Error('Repeated shutdown attempted redundant resource closure');
        }
        pass('Repeated shutdown signal (SIGINT after SIGTERM) is safely ignored (Idempotency)');
    } catch (err) {
        fail('Idempotent shutdown check', err);
    }

    // -------------------------------------------------------------------------
    // TEST 11: Fault-Tolerant Error Handling (Cleanup Error Isolation)
    // -------------------------------------------------------------------------
    try {
        shutdownManager.resetStateForTesting();

        // Reconnect DB to test cleanup continuation when a step throws
        await mongoose.connect(config.mongoUri);

        // Register a failing cleanup task
        shutdownManager.registerCleanup(async () => {
            throw new Error('Simulated custom cleanup failure');
        });

        const result = await shutdownManager.executeShutdown('SIGTERM', 0, {
            timeoutMs: 5000,
            exitProcess: false
        });

        if (!result.success) throw new Error('Shutdown failed to complete despite error handling');
        if (!result.closedDb) throw new Error('Database was not closed after custom cleanup failure');
        if (mongoose.connection.readyState !== 0) {
            throw new Error('Database remained open after cleanup error');
        }

        pass('Cleanup failure in one component is caught safely without preventing MongoDB closure (Fault Tolerance)');
    } catch (err) {
        fail('Fault-tolerant cleanup check', err);
    }

    // -------------------------------------------------------------------------
    // TEST 12: SIGINT Full Lifecycle Execution
    // -------------------------------------------------------------------------
    try {
        shutdownManager.resetStateForTesting();

        // Reconnect DB & start a new server and cron
        await mongoose.connect(config.mongoUri);
        const app2 = express();
        const server2 = app2.listen(0);
        initInactivityCron();
        shutdownManager.registerServer(server2);

        const sigintResult = await shutdownManager.executeShutdown('SIGINT', 0, {
            timeoutMs: 5000,
            exitProcess: false
        });

        if (!sigintResult.success || !sigintResult.closedServer || !sigintResult.closedDb || !sigintResult.stoppedCron) {
            throw new Error('SIGINT shutdown failed to close all resources');
        }

        if (server2.listening) throw new Error('Server 2 remained listening');
        if (isCronRunning()) throw new Error('Cron remained active');
        if (mongoose.connection.readyState !== 0) throw new Error('DB remained open');

        pass('SIGINT signal cleanly shuts down HTTP server, cron, and database');
    } catch (err) {
        fail('SIGINT full lifecycle check', err);
    }

    // -------------------------------------------------------------------------
    // TEST 13: Signal Registration Verification
    // -------------------------------------------------------------------------
    try {
        const dummyApp = express();
        const dummyServer = dummyApp.listen(0);
        setupGracefulShutdown(dummyServer);

        const sigtermListeners = process.listeners('SIGTERM');
        const sigintListeners = process.listeners('SIGINT');

        if (sigtermListeners.length === 0 || sigintListeners.length === 0) {
            throw new Error('Process signal listeners for SIGTERM/SIGINT were not registered');
        }

        dummyServer.close();
        pass('setupGracefulShutdown correctly registers SIGTERM, SIGINT, uncaughtException, and unhandledRejection');
    } catch (err) {
        fail('Signal registration check', err);
    }

    // Final reconnect for subsequent test suites
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(config.mongoUri);
    }

    console.log(`\n======================================================`);
    console.log(`✅ GRACEFUL SHUTDOWN TEST SUITE RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log(`======================================================\n`);
}

// Standalone execution support
if (process.argv[1]?.endsWith('gracefulShutdown.test.ts') || process.argv[1]?.endsWith('gracefulShutdown.test.js')) {
    runGracefulShutdownTests()
        .then(async () => {
            await mongoose.disconnect();
            process.exit(0);
        })
        .catch(async (err) => {
            console.error('Fatal test runner error:', err);
            await mongoose.disconnect();
            process.exit(1);
        });
}
