# DigiChit Architecture Blueprint

## 1. Architectural Vision

DigiChit is a production-grade FinTech platform built using **Node.js**, **Express**, **TypeScript**, and **MongoDB/Mongoose**.

To ensure high maintainability, strict auditability, scalability, and testability, the server codebase is standardizing on a **Modular Monolith** pattern with **Clean Architecture** and **Domain-Driven Design (DDD)** principles.

---

## 2. Current Hybrid Architecture vs Target Modular Architecture

### Current Hybrid State
- **Legacy Components**: Use traditional MVC structure with global folders (`src/controllers/`, `src/services/`, `src/models/`, `src/routes/`).
- **Newer Components**: Already follow feature-based modular slices (`src/modules/payment/`, `src/modules/collection/`, `src/modules/ledger/`, `src/modules/statement/`).

### Target Modular Architecture
All business capabilities will be encapsulated within self-contained vertical slices inside `src/modules/<feature_name>/` and supported by a shared infrastructure layer in `src/shared/`.

```
src/
├── modules/                   # Vertical Slices (Feature Modules)
│   ├── auth/
│   ├── user/
│   ├── kyc/
│   ├── organizer/
│   ├── membership/
│   ├── chit-group/
│   ├── auction/
│   ├── bid/
│   ├── installment/
│   ├── payment/
│   ├── collection/
│   ├── ledger/
│   ├── statement/
│   ├── admin/
│   ├── support/
│   └── chit-message/
│
├── shared/                    # Shared Infrastructure Layer
│   ├── config/
│   ├── middleware/
│   ├── errors/
│   ├── logger/
│   ├── constants/
│   ├── types/
│   ├── utils/
│   ├── responses/
│   ├── database/
│   └── validators/
│
├── app.ts                     # Express App Initialization & Route Registration
└── index.ts                   # Server Lifecycle & DB Listener
```

---

## 3. Migration Strategy (Phased Approach)

To prevent breaking existing endpoints or disrupting development:

1. **Phase 0 (Foundation)**: Standardize directory layout, `shared/` infrastructure components, `shared/README.md`, `modules/README.md`, and `ARCHITECTURE.md`.
2. **Phase 1 (Shared Extraction)**: Extract global middlewares, error wrappers, response helpers, and config into `src/shared/`.
3. **Phase 2 (Incremental Module Extraction)**:
   - Move `auth` logic to `src/modules/auth/`
   - Move `user` & `kyc` to `src/modules/user/` and `src/modules/kyc/`
   - Move `chitGroup`, `auction`, `bid`, `installment` to respective module slices
4. **Phase 3 (Legacy Decommissioning)**: Delete top-level legacy MVC folders (`src/controllers/`, `src/services/`, `src/models/`, `src/routes/`).

---

## 4. Folder Standards

Every feature module MUST implement the following standardized sub-directory structure:

```
src/modules/<feature_name>/
├── controllers/          # Express HTTP handlers
├── services/             # Pure business logic & domain rules
├── repositories/         # MongoDB query abstractions (Mongoose only)
├── models/               # Domain Mongoose schema definitions
├── dto/                  # Data Transfer Objects
├── validators/           # express-validator schemas
├── interfaces/           # TypeScript interfaces & domain types
├── routes/               # Express router defining endpoints
├── events/               # Module domain events & publishers
├── listeners/            # Async event listeners
├── constants/            # Feature static constants & enums
├── types/                # Internal types
├── utils/                # Feature utility functions
└── index.ts              # Module barrel export
```

---

## 5. Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                       Feature Modules                       │
│  (auth, chit-group, payment, collection, ledger, etc.)      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ (Allowed)                    │ (Forbidden Direct Import)
               ▼                              ▼
┌─────────────────────────────┐  ┌────────────────────────────┐
│        Shared Layer         │  │     Other Feature Modules  │
│    (src/shared/* Only)      │  │  (Use Events / index.ts)   │
└─────────────────────────────┘  └────────────────────────────┘
```

1. **Modules → Shared (Allowed)**: Modules may import infrastructure utilities, error classes, response formatters, and config from `src/shared/`.
2. **Shared → Modules (Forbidden)**: `src/shared/` must **NEVER** depend on any feature module.
3. **Module → Module Direct Imports (Restricted)**:
   - Modules must not reach into another module's internal files.
   - Cross-module operations must use public module exports via `index.ts` or asynchronous **Domain Events** (`eventBus`).

---

## 6. Naming Conventions

- **Directories**: `camelCase` or `kebab-case` (`chit-group`, `payment`, `ledger`).
- **Files**:
  - Models: `PascalCase.ts` (e.g. `LedgerEntry.ts`, `Transaction.ts`)
  - Controllers: `PascalCaseController.ts` (e.g. `StatementController.ts`)
  - Services: `PascalCaseService.ts` (e.g. `LedgerService.ts`)
  - Repositories: `PascalCaseRepository.ts` (e.g. `LedgerRepository.ts`)
  - DTOs: `PascalCaseDTO.ts` (e.g. `CreateLedgerEntryDTO.ts`)
  - Routes: `camelCase.routes.ts` (e.g. `ledger.routes.ts`)
  - Validators: `camelCase.validator.ts` (e.g. `ledger.validator.ts`)
  - Enums: `camelCase.enum.ts` or `PascalCaseEnums.ts`
- **Imports**: Always include `.js` extensions for local module resolution in ESM TypeScript (`import { AppError } from '../../shared/errors/AppError.js';`).

---

## 7. Module Responsibilities

### Controller Rules
- **Role**: Entry point for HTTP requests.
- **Responsibilities**:
  1. Receive HTTP request (`req`)
  2. Parse & sanitize parameters
  3. Call appropriate Service method
  4. Return standardized JSON HTTP response (`res`)
- **Prohibitions**: No database queries, no business rules, no direct Mongoose calls.

### Service Rules
- **Role**: Encapsulate domain business logic.
- **Responsibilities**:
  1. Validate business invariants & rules
  2. Orchestrate repository data operations
  3. Publish domain events when state changes
- **Prohibitions**: No Express `req`/`res` objects, no direct HTTP status codes.

### Repository Rules
- **Role**: Data Access Layer.
- **Responsibilities**:
  1. Encapsulate all Mongoose/MongoDB query logic (`find`, `create`, `aggregate`)
  2. Map database documents to domain interfaces
- **Prohibitions**: No business rule validation, no HTTP handling.

### Model Rules
- **Role**: Data persistence definition.
- **Responsibilities**: Define Mongoose schemas, indexes, and document interfaces.
- **Prohibitions**: Every module owns its models; global `src/models/` will be phased out.
