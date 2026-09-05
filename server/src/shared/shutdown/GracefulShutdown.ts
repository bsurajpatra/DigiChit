import http from 'http';
import mongoose from 'mongoose';
import { logger } from '@shared/logger/logger.js';
import { config } from '@shared/config/env.js';
import { stopInactivityCron } from '@modules/user/index.js';
import { eventBus } from '@shared/event-bus/EventBus.js';

export interface ShutdownOptions {
    timeoutMs?: number;
    exitProcess?: boolean;
}

export interface ShutdownResult {
    success: boolean;
    closedServer: boolean;
    closedDb: boolean;
    stoppedCron: boolean;
}

/**
 * Production-Grade Graceful Shutdown Manager for DigiChit Backend.
 * Handles SIGTERM, SIGINT, uncaughtException, and unhandledRejection cleanly.
 */
export class GracefulShutdownManager {
    private static instance: GracefulShutdownManager;
    private isShuttingDown: boolean = false;
    private server: http.Server | null = null;
    private customCleanups: Array<() => Promise<void> | void> = [];

    private constructor() {}

    public static getInstance(): GracefulShutdownManager {
        if (!GracefulShutdownManager.instance) {
            GracefulShutdownManager.instance = new GracefulShutdownManager();
        }
        return GracefulShutdownManager.instance;
    }

    public registerServer(server: http.Server): void {
        this.server = server;
    }

    public registerCleanup(fn: () => Promise<void> | void): void {
        this.customCleanups.push(fn);
    }

    public isShutdownInProgress(): boolean {
        return this.isShuttingDown;
    }

    public resetStateForTesting(): void {
        this.isShuttingDown = false;
        this.server = null;
        this.customCleanups = [];
    }

    /**
     * Executes the graceful shutdown sequence idempotently.
     */
    public async executeShutdown(
        signal: string,
        exitCode: number = 0,
        options: ShutdownOptions = {}
    ): Promise<ShutdownResult> {
        // 1. Idempotency Guard: Ensure only one shutdown executes
        if (this.isShuttingDown) {
            logger.info(`[Shutdown] Shutdown sequence is already in progress. Ignoring duplicate signal: ${signal}`);
            return { success: true, closedServer: false, closedDb: false, stoppedCron: false };
        }

        this.isShuttingDown = true;
        const timeoutMs = options.timeoutMs ?? config.shutdownTimeoutMs ?? 10000;
        const shouldExit = options.exitProcess !== false;

        logger.info(`[Shutdown] ${signal} signal received. Starting graceful shutdown sequence (Timeout: ${timeoutMs}ms)...`);

        // 2. Timeout Safeguard (unref'd timer prevents hanging indefinitely)
        let timeoutHandle: NodeJS.Timeout | null = null;
        if (shouldExit) {
            timeoutHandle = setTimeout(() => {
                logger.error(`[Shutdown] Graceful shutdown exceeded timeout limit of ${timeoutMs}ms. Forcing immediate termination.`);
                process.exit(1);
            }, timeoutMs);
            timeoutHandle.unref();
        }

        let closedServer = false;
        let closedDb = false;
        let stoppedCron = false;

        // 3. Step 1: Stop accepting new HTTP requests & allow in-flight requests to complete
        if (this.server) {
            logger.info('[Shutdown] Closing HTTP server...');
            try {
                await new Promise<void>((resolve, reject) => {
                    if (!this.server || !this.server.listening) {
                        return resolve();
                    }
                    this.server.close((err) => {
                        if (err) {
                            if ((err as any).code === 'ERR_SERVER_NOT_RUNNING') {
                                return resolve();
                            }
                            return reject(err);
                        }
                        resolve();
                    });
                });
                closedServer = true;
                logger.info('[Shutdown] HTTP server closed successfully. No longer accepting new connections.');
            } catch (err: any) {
                logger.error('[Shutdown] Error while closing HTTP server:', err.message || err);
            }
        }

        // 4. Step 2: Stop scheduled background cron tasks
        try {
            stopInactivityCron();
            stoppedCron = true;
            logger.info('[Shutdown] Scheduled background cron jobs stopped cleanly.');
        } catch (err: any) {
            logger.error('[Shutdown] Error stopping background cron jobs:', err.message || err);
        }

        // 5. Step 3: Execute custom registered cleanup hooks
        for (const cleanupFn of this.customCleanups) {
            try {
                await cleanupFn();
            } catch (err: any) {
                logger.error('[Shutdown] Error executing custom cleanup task:', err.message || err);
            }
        }

        // 6. Step 4: Close MongoDB / Mongoose connection
        try {
            if (mongoose.connection.readyState !== 0 && mongoose.connection.readyState !== 3) {
                logger.info('[Shutdown] Closing MongoDB connection...');
                await mongoose.connection.close(false);
                closedDb = true;
                logger.info('[Shutdown] MongoDB connection closed cleanly.');
            } else {
                logger.info('[Shutdown] MongoDB connection was already closed.');
            }
        } catch (err: any) {
            logger.error('[Shutdown] Error closing MongoDB connection:', err.message || err);
        }

        // 7. Step 5: Clean up Domain EventBus listeners
        try {
            eventBus.removeAllListeners();
            logger.info('[Shutdown] EventBus listeners cleared.');
        } catch (err: any) {
            logger.error('[Shutdown] Error clearing EventBus listeners:', err.message || err);
        }

        // 8. Step 6: Clear timeout timer and exit cleanly
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }

        logger.info('[Shutdown] Graceful shutdown sequence completed successfully.');

        if (shouldExit) {
            process.exit(exitCode);
        }

        return { success: true, closedServer, closedDb, stoppedCron };
    }
}

export const shutdownManager = GracefulShutdownManager.getInstance();

/**
 * Wires SIGTERM, SIGINT, uncaughtException, and unhandledRejection to the shutdown manager.
 */
export const setupGracefulShutdown = (server: http.Server): void => {
    shutdownManager.registerServer(server);

    const handleSignal = (signal: string) => {
        shutdownManager.executeShutdown(signal, 0, { exitProcess: true }).catch((err) => {
            logger.error(`[Shutdown] Unhandled error during ${signal} shutdown:`, err);
            process.exit(1);
        });
    };

    process.on('SIGTERM', () => handleSignal('SIGTERM'));
    process.on('SIGINT', () => handleSignal('SIGINT'));

    process.on('uncaughtException', (error) => {
        logger.error('[Fatal] Uncaught Exception detected:', error);
        shutdownManager.executeShutdown('UNCAUGHT_EXCEPTION', 1, { exitProcess: true }).catch(() => {
            process.exit(1);
        });
    });

    process.on('unhandledRejection', (reason) => {
        logger.error('[Fatal] Unhandled Rejection detected:', reason);
        shutdownManager.executeShutdown('UNHANDLED_REJECTION', 1, { exitProcess: true }).catch(() => {
            process.exit(1);
        });
    });

    logger.info('[Shutdown] Graceful shutdown handlers registered for SIGTERM, SIGINT, uncaughtException, and unhandledRejection.');
};
