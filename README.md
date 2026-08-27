# DigiChit — Enterprise Chit Fund Management & Double-Entry Ledger Platform

**DigiChit** is a full-stack financial platform designed to digitize and automate chit funds (Rotating Savings and Credit Associations / ROSCAs). It features complete lifecycle management for chit groups, auctions, installment collections, member payments, and an **event-driven, immutable double-entry general ledger**.

---

## 📑 Table of Contents
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Double-Entry Ledger & Financial Engine (P0 – P9)](#double-entry-ledger--financial-engine-p0--p9)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
- [Security & Compliance](#security--compliance)
- [Current State & Verification](#current-state--verification)

---

## 🏛️ System Architecture

DigiChit follows a **modular, event-driven domain architecture**. Each backend domain module (`auth`, `kyc`, `chit-group`, `chit-cycle`, `auction`, `bid`, `installment`, `payment`, `ledger`, `collection`, `statement`, etc.) is fully encapsulated with its own controllers, services, repositories, models, validators, and event listeners.

Financial transactions are coordinated asynchronously via an internal **EventBus** that triggers immutable double-entry journal postings across isolated accounts.

```
Frontend (React 19 + TypeScript + Vite)
         │
         ▼  (REST API / JWT Auth)
Express API Gateway & Controllers
         │
         ▼
Domain Services (Auction, Payment, Cycle, Installment, Collection)
         │
         ▼  (Domain Events: TRANSACTION_SUCCESS, AUCTION_WINNER_DECLARED, PRIZE_DISBURSED, etc.)
     EventBus
         │
         ▼
LedgerEventListener ──► JournalPostingService ──► Immutable Double-Entry Journal
                                                           (MongoDB)
```

---

## 💻 Tech Stack

### Frontend (`/client`)
- **Framework**: React 19 + TypeScript, powered by Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design System (Sleek Dark Theme)
- **State & Forms**: React Hook Form + Zod validation
- **Animations & Icons**: Framer Motion, Lucide React
- **HTTP Client**: Axios with interceptors
- **Media**: Cloudinary (client-side signed uploads)

### Backend (`/server`)
- **Runtime**: Node.js + Express 5 in TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Security & Hardening**: JWT, Bcrypt, AES-256-CBC field encryption for KYC, Helmet, CORS, Express Rate Limit
- **Accounting Engine**: Event-driven Double-Entry Journal Posting with integer paise precision
- **Communication & Jobs**: Nodemailer (Transactional email), `node-cron` (Scheduled tasks)
- **Payment Processing**: Integrated Mock Payment Gateway (simulated banking & webhook verification)

---

## ⚖️ Double-Entry Ledger & Financial Engine (P0 – P9)

DigiChit features an enterprise-grade, GAAP/Chit-Fund-compliant double-entry accounting core. All monetary entries are strictly calculated and stored in **integer paise** (₹1 = 100 paise) with immutable database protections.

| Sprint / Phase | Scope | Description | Accounting Invariant |
|---|---|---|---|
| **P0** | **Double-Entry Foundation** | Multi-line `JournalEntry` schema, immutability pre-hooks, line-level debit/credit balance validator. | $\sum \text{DEBITS} \equiv \sum \text{CREDITS} > 0$ |
| **P1** | **Automatic Account Provisioning** | Deterministic generation of SYSTEM, GROUP, and MEMBER accounts (`GRP-{id}-BANK`, `GRP-{id}-CLEARING`, `GRP-{id}-MEM-{id}-RECEIVABLE`, `PRIZE_PAYABLE`, `COMM_INCOME`, `DIV_PAYABLE`, etc.). | Zero Manual Account Setup |
| **P2** | **Installment Obligation Accounting** | Accrual journal created upon monthly cycle creation & installment generation. | **DEBIT**: `MEMBER_RECEIVABLE`<br>**CREDIT**: `CHIT_CYCLE_CLEARING` |
| **P3** | **Payment Success Accounting** | Cash collection journal created upon verified member installment payment. | **DEBIT**: `GROUP_BANK_ESCROW`<br>**CREDIT**: `MEMBER_RECEIVABLE` |
| **P4** | **Refund & Reversal Accounting** | Append-only reversal journal created upon transaction refund (leaving original payment journal immutable). | **DEBIT**: `MEMBER_RECEIVABLE`<br>**CREDIT**: `GROUP_BANK_ESCROW` |
| **P5** | **Winner Declaration & Pot Allocation** | Pot clearing liability cleared into winner prize payable, organizer commission, and member dividend pool. | **DEBIT**: `CHIT_CYCLE_CLEARING` ($V$)<br>**CREDIT**: `PRIZE_PAYABLE` ($P$)<br>**CREDIT**: `COMM_INCOME` ($C$)<br>**CREDIT**: `DIV_PAYABLE` ($Div$) |
| **P6** | **Winner Prize Payout Accounting** | Disburses prize cash from group bank escrow to winning member, clearing prize liability. | **DEBIT**: `MEMBER_PRIZE_PAYABLE`<br>**CREDIT**: `GROUP_BANK_ESCROW` |
| **P7** | **Organizer Commission Payout** | Disburses organizer fee from group bank escrow, clearing commission liability. | **DEBIT**: `COMM_PAYABLE`<br>**CREDIT**: `GROUP_BANK_ESCROW` |
| **P8** | **Dividend Allocation & Offset** | Distributes auction dividend pool to non-winning members (either via direct cash payout or installment offset). | **DEBIT**: `DIV_PAYABLE`<br>**CREDIT**: `MEMBER_RECEIVABLE` (Offset) / `BANK` (Cash) |
| **P9** | **Full End-to-End Payment Pipeline** | Seamless member payment checkout (`PayNowModal`) $\rightarrow$ Transaction API $\rightarrow$ EventBus $\rightarrow$ Double-Entry Posting. | Full Lifecycle Verification |
| **Collection Mgmt** | **Organizer Collection Control** | Per-cycle collection lifecycle state machine (`NOT_STARTED` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED`) with strict RBAC guards. | Authoritative Server Enforcement |

---

## ✨ Key Features

### 1. Consolidated "Chit Details → Installments & Dues" UI
- Single destination for all financial operations within a Chit Circle.
- **Organizer Collection Management Panel**: Live cycle status tracking with one-click **[Open Collections]** and **[Close Collections]** action buttons backed by confirmation dialogs.
- **Member Personal Dues**: Full-width cards with a 4-metric breakdown (Base Contribution, Accrued Late Fee, Paid Amount, Net Remaining) and live **[Pay Now]** triggers.
- **Inline Table Operations**: Member inline payment checkout and Organizer fee waiving.

### 2. Authentication & Role-Based Access Control
- JWT-based authentication with secure cookie/header storage.
- Email verification (with resend cooldowns) and forgot/reset password workflows.
- Granular permissions for **User / Member**, **Organizer**, and **Admin**.
- Automated detection and flagging of inactive accounts via scheduled cron tasks.

### 3. KYC Compliance & Document Verification
- Multi-document upload (Govt ID, Address Proof, PAN) stored securely on Cloudinary.
- **AES-256-CBC field-level encryption** for sensitive PII at rest.
- Dedicated Admin KYC Review Queue with instant approve/reject capability.
- KYC verification required before joining groups or placing auction bids.

### 4. Chit Group & Membership Management
- Customizable financial configuration (commission %, monthly installment, member count, auction rules).
- Public group discovery ("Forming" state) and private direct invite links (`/join/:id`).
- Organizer membership review dashboard (approve, reject, or manually add members).

### 5. Auctions & Real-Time Bidding
- Dynamic percentage-based reverse auction bidding with minimum/maximum bid limits.
- Automated discount, organizer commission, and dividend pool calculations.
- Winner selection with tie-breaking and immediate double-entry pot allocation journal posting.

### 6. Payments & Mock Payment Gateway
- Complete frontend payment flow: Member clicks "Pay Now" $ightarrow$ `PayNowModal` (UPI, Card, Net Banking, Simulator) $ightarrow$ `POST /api/v1/transactions/initiate` $ightarrow$ `POST /api/v1/transactions/verify` $ightarrow$ automatic UI refetch.
- Dual single-entry and double-entry bookkeeping with idempotent retry safety.

### 7. Financial Reporting & Statements
- Member personal statements, Organizer revenue summaries, and Group-level statements.
- Real-time balance queries aggregating debits and credits across provisioned accounts.

---

## 📁 Project Structure

```
DigiChit/
├── client/                     # React 19 + TypeScript Frontend (Vite)
│   ├── src/
│   │   ├── api/                # Typed Axios API clients
│   │   ├── components/         # Modern UI components & Modals
│   │   │   ├── auctions/       # Auction cards, tables, bidding
│   │   │   ├── cycles/         # Cycle cards, status badges, timelines
│   │   │   ├── installments/   # InstallmentTable, StatisticsCards, CollectionProgress
│   │   │   └── payment/        # PayNowModal (Authoritative payment modal)
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── hooks/              # Custom hooks (useChitGroup, useBids, useInstallments, useChitCycles)
│   │   ├── pages/              # App Pages (Dashboard, ChitDetails, Auctions, Payments, KYC, Admin)
│   │   └── types/              # Frontend TypeScript models & DTOs
│   └── vite.config.ts
│
└── server/                     # Node.js + Express 5 Backend (TypeScript)
    └── src/
        ├── modules/            # Encapsulated Domain Modules
        │   ├── admin/          # Account moderation & role controls
        │   ├── auction/        # Auction scheduling & winner declaration
        │   ├── auth/           # Login, registration, password recovery
        │   ├── bid/            # Bidding logic & validation
        │   ├── chit-cycle/     # Cycle state machine
        │   ├── chit-group/     # Group schemas & financial config
        │   ├── collection/     # Per-cycle collection windows & controllers
        │   ├── installment/    # Installment generation & obligations
        │   ├── kyc/            # KYC document uploads & AES encryption
        │   ├── ledger/         # Double-Entry Core, Provisioning & Journals
        │   │   ├── enums/      # AccountType, AccountCategory, JournalDirection
        │   │   ├── models/     # Account, JournalEntry, LedgerEntry
        │   │   ├── services/   # JournalPostingService, AccountProvisioningService
        │   │   ├── listeners/  # LedgerEventListener (Domain event hooks)
        │   │   └── __tests__/  # P0 - P9 Consolidated Double-Entry & Collection Test Suites
        │   ├── membership/     # Chit group enrollments
        │   ├── payment/        # Transactions & MockPaymentGateway
        │   ├── statement/      # Statement aggregation & export
        │   ├── support/        # In-app ticketing & contact forms
        │   └── user/           # Profiles & user settings
        ├── shared/             # EventBus, Logger, Errors, DB, Middleware
        └── index.ts            # Server entry point & route mounting
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v6.0+ (Local MongoDB or Atlas cluster)
- **Cloudinary Account** (for KYC & avatar document hosting)
- **SMTP Credentials** (for transactional email delivery)

---

### Backend Setup

1. Navigate to the server folder:
   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file in `server/`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/digichit
   JWT_SECRET=your_super_secret_jwt_key_here
   ENCRYPTION_KEY=32_byte_hex_string_for_kyc_aes_encryption
   FRONTEND_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_secret_here

   # Cloudinary (Media & KYC)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # SMTP / Email
   EMAIL_USER=your_smtp_user
   EMAIL_PASS=your_smtp_app_password
   EMAIL_FROM=DigiChit <no-reply@digichit.com>
   ```

3. Start the backend development server:
   ```bash
   npm run dev
   ```

---

### Frontend Setup

1. Navigate to the client folder:
   ```bash
   cd client
   npm install
   ```

2. Create a `.env` file in `client/`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

---

## 🧪 Running Tests

The project includes a **consolidated double-entry accounting and financial test suite** verifying all invariants, scope protections, concurrency safety, balance equations, and collection state machine flows:

```bash
cd server
npx tsx src/modules/ledger/__tests__/runAllLedgerTests.ts
```

### Comprehensive Test Suite Breakdown:
- **P0**: Core Double-Entry Foundation (12 / 12 tests)
- **P1**: Automatic Account Provisioning (9 / 9 tests)
- **P2**: Installment Obligation Accounting (6 / 6 tests)
- **P3**: Payment Success Accounting (19 / 19 tests)
- **P4**: Refund Reversal Accounting (19 / 19 tests)
- **P5**: Winner Pot Allocation Accounting (30 / 30 tests)
- **P6**: Prize Payout Accounting (26 / 26 tests)
- **P7**: Organizer Commission Payout Accounting (29 / 29 tests)
- **P8**: Dividend Allocation & Installment Offset Accounting (32 / 32 tests)
- **P9**: Full End-to-End Payment Pipeline (15 / 15 tests)
- **Collection Management**: Organizer Collection Control & Member Payment Flow (16 / 16 tests)
- **Total Financial Suite**: **213 / 213 Tests Passing (100% Pass Rate)**

---

## 📡 API Reference

All backend routes are mounted under `/api` (or `/api/v1` for payment transactions):

| Base Route | Domain Area | Key Capabilities |
|---|---|---|
| `/api/auth` | Authentication | Registration, Login, Email Verification, Password Reset |
| `/api/kyc` | KYC Verification | Submit KYC, Admin Review Queue, Status Check |
| `/api/admin` | Administration | Account Suspension, Role Updates, System Audit |
| `/api/user` | User Profile | Update Profile, Avatar Upload, Password Change |
| `/api/organizer` | Organizer Onboarding | Applications, Approvals, Profile Management |
| `/api/chit-groups` | Chit Groups | Create Group, Join via Link, Discovery |
| `/api/chit-cycles` | Cycles & Collections | Start Cycle, Open/Close Collections, Record Winner |
| `/api/auctions` | Auctions | Schedule Auction, Live Status, Declare Winner |
| `/api/bids` | Bidding | Place Bid, Withdraw Bid, Bid History |
| `/api/installments`| Installments | Query Dues, Generate Cycle Dues, Waive Late Fees |
| `/api/v1/transactions`| Payments | Initiate Payment, Verify Payment, Issue Refunds |
| `/api/collections` | Collections | Collection Window Status & Aggregates |
| `/api/ledger` | General Ledger | Account Balance Aggregations, Journal Inquiries |
| `/api/statements` | Statements | Member, Organizer & Group Statement Exports |
| `/api/contact` | Support | In-App Tickets & Public Contact Form |

A health check endpoint is accessible at `GET /health`.

---

## 🔒 Security & Compliance

- **Immutable Accounting**: MongoDB pre-hooks block `updateOne`, `findOneAndUpdate`, `deleteOne`, and `findOneAndDelete` on all posted `JournalEntry` documents.
- **Zero Floating Point Math**: All ledger operations use integer paise (₹1 = 100 paise) to prevent precision loss.
- **PII Encryption**: AES-256-CBC field encryption protects KYC Aadhaar/PAN fields in the database.
- **Authoritative Server Valuation**: Member payments enforce server-side installment calculations, ignoring client-side amount payloads.
- **Dual Bookkeeping**: Supports seamless backward compatibility with legacy single-entry records during the ledger migration period.

---

## 🏁 Current State & Verification

- ✅ **P0 – P8 Double-Entry Accounting Core**: Complete & verified across 213 tests.
- ✅ **Organizer Collection Controls**: Live in Chit Details $\rightarrow$ Installments & Dues tab (`NOT_STARTED` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED`).
- ✅ **Member Payment Checkout**: Full-width personal dues cards with live `PayNowModal` connected to real backend transaction APIs.
- ✅ **Zero Dead Payment Modals**: Removed legacy placeholder components with 0 active references.
- ✅ **100% Green TypeScript & Production Builds**: Clean builds across both client and server environments.

---

## 📄 License
This project is proprietary and confidential. All rights reserved.
