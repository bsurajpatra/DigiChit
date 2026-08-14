# DigiChit — Secure Chit Fund Management System

DigiChit is a full-stack web platform for running chit funds digitally — covering member onboarding and KYC, chit group and cycle management, auction-based bidding, installment collection, payments, and ledger/statement reporting, with distinct experiences for **Users**, **Organizers**, and **Admins**.

> A chit fund is a rotating savings-and-credit scheme where a group of members contribute a fixed installment each cycle, and one member "wins" the pooled amount each round through an auction (lowest bid / highest discount wins), until every member has won once.

## Tech Stack

**Frontend (`/client`)**
- React 19 + TypeScript, built with Vite
- React Router v7 for routing
- Tailwind CSS v4 for styling
- React Hook Form + Zod for form handling and validation
- Axios for API calls
- Framer Motion for animation, Lucide for icons
- Cloudinary (direct client-side signed uploads) for images/documents

**Backend (`/server`)**
- Node.js + Express 5, written in TypeScript
- MongoDB with Mongoose
- JWT-based authentication, bcrypt password hashing
- AES-256-CBC field-level encryption for sensitive data (e.g. KYC fields)
- Helmet, CORS, and rate limiting (`express-rate-limit`) for baseline API hardening
- Cloudinary for file/document storage
- Nodemailer for transactional email, `node-cron` for scheduled jobs
- Mock payment gateway module (payments are simulated, not connected to a real processor)

The backend follows a **modular, layered architecture** — each domain module (`auth`, `kyc`, `chit-group`, `payment`, `ledger`, etc.) has its own `controllers`, `services`, `repositories`, `models`, `dto`, `validators`, and `routes`, kept independent behind an `index.ts` barrel file.

## Current Feature Set

### Authentication & Accounts
- Register / login with JWT auth
- Email verification (with resend) and forgot/reset password flows
- Role-based access control: `USER`, `ORGANIZER`, `ADMIN`
- Profile management, including profile picture uploads via Cloudinary
- Auto-flagging of inactive accounts via a scheduled cron job

### KYC (Know Your Customer)
- KYC document submission and status tracking (`NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`)
- Sensitive KYC fields are encrypted at rest and viewable only through authorized endpoints
- Admin review queue to approve/reject submissions
- KYC approval is a prerequisite gate for joining chit groups and bidding

### Organizer Onboarding
- Users can apply to become chit-fund Organizers (subject to eligibility checks)
- Admin queue to review, approve, or reject organizer applications

### Admin Controls
- Freeze / suspend / restore / soft-delete user accounts
- Change user roles
- Review KYC submissions, organizer applications, and support queries from a dedicated admin dashboard

### Chit Groups & Membership
- Organizers can create, update, and list chit groups
- Users can discover groups that are open ("forming"), view details, and request to join
- Invite-link based joining (`/join/:id`)
- Organizers can approve/reject join requests or manually add a member by email
- Members can view their own membership/enrollment history across groups

### Chit Cycles
- Organizers create and progress cycles through a lifecycle: create → start → open collections → close collections → record winner → complete / cancel
- Per-cycle payment status and details tracking

### Auctions & Bidding
- Auctions are created per cycle, with status transitions and a winner-declaration step
- Members submit, update, or withdraw bids on an active auction (gated behind KYC approval)
- Bid history viewable by auction or by member

### Installments
- Installments are generated per cycle (based on group configuration)
- Installment status can be updated, and installments queried by cycle, member, or group

### Payments & Collections
- Mock payment gateway flow: initiate → verify → refund
- Transaction history queryable by member, group, or installment
- Per-cycle collection status, summaries, and pending-member tracking
- Organizers can open/close the collection window for a cycle

### Ledger & Statements
- An event-driven ledger records financial activity (payments and cycle events feed into it via an internal event bus)
- Ledger entries searchable/filterable by member or group
- Downloadable/exportable statements for members, organizers, and groups

### Messaging & Support
- In-group discussion threads (create thread, reply, update status) between members and organizers
- A public contact form for guests
- Authenticated in-app support ticketing (submit query, view history, respond) with an admin-side queue and response flow

### Informational / Legal Pages
- Landing page, About Us, Contact, Terms & Conditions, Privacy Policy, Disclaimer

## Project Structure

```
DigiChit/
├── client/                 # React + TypeScript frontend (Vite)
│   └── src/
│       ├── api/             # Axios API clients per domain
│       ├── components/      # Shared & feature-specific UI components
│       ├── context/         # Auth & UI context providers
│       ├── hooks/           # Data-fetching hooks per domain
│       ├── pages/            # Route-level pages (auth, dashboard, organizer, admin, kyc, statements, legal)
│       └── types/           # Shared TypeScript types
└── server/                 # Express + TypeScript backend
    └── src/
        ├── modules/          # One folder per domain (auth, kyc, admin, user, organizer,
        │                     #   chit-group, chit-cycle, auction, bid, installment,
        │                     #   chit-message, membership, payment, collection,
        │                     #   ledger, statement, support)
        └── shared/           # Config, DB connection, error handling, logging,
                              #   middleware, response helpers, validators, utils
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A MongoDB instance (local or Atlas)
- A Cloudinary account (for file uploads)
- An SMTP-capable email account (for verification/reset emails, e.g. via Nodemailer)

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in `server/` with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_byte_encryption_key
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
EMAIL_FROM=your_from_address
```

Run the API:

```bash
npm run dev     # start in watch mode (tsx)
npm run build   # compile TypeScript
npm start       # run compiled build
```

### Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in `client/` with:

```env
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

Run the app:

```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run preview   # preview the production build
```

## API Overview

All backend routes are mounted under `/api`, grouped by domain:

| Base Path | Domain |
|---|---|
| `/api/auth` | Registration, login, email verification, password reset |
| `/api/kyc` | KYC submission and review |
| `/api/admin` | Account moderation (freeze/suspend/restore/delete/role change) |
| `/api/user` | Profile, password change, profile picture, user search |
| `/api/organizer` | Organizer applications and approvals |
| `/api/contact` | Public contact & in-app support queries |
| `/api/chit-groups` | Chit group creation, discovery, membership requests |
| `/api/chit-cycles` | Cycle lifecycle management |
| `/api/auctions` | Auction creation and winner declaration |
| `/api/bids` | Bid submission, update, withdrawal |
| `/api/installments` | Installment generation and status tracking |
| `/api/chit-messages` | In-group discussion threads |
| `/api/memberships` | Membership approvals within a group |
| `/api/transactions` | Payment initiation, verification, refunds, history |
| `/api/collections` | Collection window status/summary per cycle |
| `/api/ledger` | Ledger entry search and retrieval |
| `/api/statements` | Member/organizer/group statement export |

A `GET /health` endpoint is available for basic uptime checks.

## Notes on Current State

- The payment gateway integration is currently a **mock provider** — no live payment processor is connected yet.
- This README reflects the codebase as currently implemented and will evolve as new modules and features are added.

## License

No license file is currently included in this repository.