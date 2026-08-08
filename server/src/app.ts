import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/routes/auth.routes.js';
import kycRoutes from './modules/kyc/routes/kyc.routes.js';
import adminRoutes from './modules/admin/routes/admin.routes.js';
import userRoutes from './modules/user/routes/user.routes.js';
import organizerRoutes from './modules/organizer/routes/organizer.routes.js';
import supportRoutes from './modules/support/routes/support.routes.js';
import chitGroupRoutes from './modules/chit-group/routes/chitGroup.routes.js';
import chitCycleRoutes from './modules/chit-cycle/routes/chitCycle.routes.js';
import auctionRoutes from './modules/auction/routes/auction.routes.js';
import bidRoutes from './modules/bid/routes/bid.routes.js';
import installmentRoutes from './modules/installment/routes/installment.routes.js';
import chitMessageRoutes from './modules/chit-message/routes/chitMessage.routes.js';
import membershipRoutes from './modules/membership/routes/membership.routes.js';
import transactionRoutes from './modules/payment/routes/transaction.routes.js';
import collectionRoutes from './modules/collection/routes/collection.routes.js';
import ledgerRoutes from './modules/ledger/routes/ledger.routes.js';
import statementRoutes from './modules/statement/routes/statement.routes.js';
import { initLedgerEventListeners } from './modules/ledger/listeners/LedgerEventListener.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { globalErrorHandler } from './shared/errors/GlobalErrorHandler.js';
import { apiRateLimiter } from './middlewares/rateLimit.middleware.js';
import { AppError } from './shared/errors/AppError.js';
import { initInactivityCron } from './utils/cron.js';
import { config } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize Cron Jobs & Domain Event Listeners
initInactivityCron();
initLedgerEventListeners();

// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Basic security headers with CORP allowed for static uploads
app.use(cors({
    origin: config.frontendUrl,
    credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Body limit to prevent DDoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


// Apply general API rate limiting
app.use('/api', apiRateLimiter);

// Silence favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/contact', supportRoutes);
app.use('/api/chit-groups', chitGroupRoutes);
app.use('/api/chit-cycles', chitCycleRoutes);
app.use('/api/chit-cycles', collectionRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/chit-messages', chitMessageRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/statements', statementRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'DigiChit API is running' });
});

// 404 handler - matches any request that hasn't been handled yet
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'ROUTE_NOT_FOUND'));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
