# DigiChit Feature Modules Layer (`src/modules/`)

The `modules/` directory contains all domain-driven business features of DigiChit. Every feature operates as a self-contained vertical slice adhering to Clean Architecture principles.

---

## Standard Module Structure

Every module under `src/modules/<feature_name>/` MUST follow this standardized layout:

```
src/modules/<feature_name>/
├── controllers/          # HTTP request handlers (Parses input -> Calls Service -> Returns Response)
├── services/             # Core business logic & domain rules
├── repositories/         # MongoDB database access layer (Mongoose queries only)
├── models/               # Domain Mongoose schema & model definitions
├── dto/                  # Data Transfer Objects (Request/Response DTO interfaces)
├── validators/           # Express-validator middleware definitions
├── interfaces/           # Module-specific TypeScript interfaces & domain types
├── routes/               # Express router defining API endpoints
├── events/               # Module domain events & publishers
├── listeners/            # Domain event subscribers listening to internal events
├── constants/            # Module-specific static enums & constants
├── types/                # Domain specific types
├── utils/                # Feature specific utility functions
└── index.ts              # Public module interface barrel export
```

---

## Business Module Registry

| Module Name | Business Responsibilities |
| :--- | :--- |
| **`auth/`** | Authentication, signup, login, password resets, email verification, JWT token lifecycle. |
| **`user/`** | Member profile management, account settings, user status management. |
| **`kyc/`** | Identity verification, document upload, Aadhaar masking, KYC approval states. |
| **`organizer/`** | Chit organizer applications, verification workflows, organizer dashboard data. |
| **`membership/`** | Group membership registrations, member assignment, winner tracking. |
| **`chit-group/`** | Chit group creation, financial parameters configuration, group state management. |
| **`auction/`** | Monthly auction scheduling, bidding limits, auction lifecycle execution. |
| **`bid/`** | Real-time member bid submissions, minimum bid validations, winner declarations. |
| **`installment/`** | Monthly member installment obligation generation, due date tracking, late fee waivers. |
| **`payment/`** | Payment order initiation, payment gateway verification (Mock, Razorpay, Stripe), refund handling. |
| **`collection/`** | Organizer collection window controls (OPEN/CLOSE), summary analytics, pending member tracking. |
| **`ledger/`** | Double-entry immutable financial ledger entries, transaction audit logging, debit/credit tracking. |
| **`statement/`** | Read-only financial statements for Members, Organizers, and Groups, CSV/PDF statement exports. |
| **`admin/`** | Administrative oversight, KYC approval workflows, organizer approvals, system analytics. |
| **`support/`** | Contact inquiries, customer support tickets, support query management. |
| **`chit-message/`** | In-group real-time chat, announcements, and member messaging. |

---

## Inter-Module Dependency Rules

1. **Modules must NOT import directly from other internal module files.**
2. Cross-module communication MUST occur strictly via:
   - **Public Exports**: Exported interfaces/services via `index.ts`
   - **Domain Events**: Asynchronous event publishing (`eventBus`)
