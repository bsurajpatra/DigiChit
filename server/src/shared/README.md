# DigiChit Shared Layer (`src/shared/`)

The `shared/` directory contains infrastructure, technical cross-cutting concerns, application utilities, error definitions, and global constants.

> ⚠️ **CRITICAL RULE**: Business logic must **NEVER** exist inside the `shared/` directory.

---

## Directory Responsibilities

| Folder | Purpose & Responsibilities |
| :--- | :--- |
| **`config/`** | Centralized application configuration, environment variable schemas (`env.ts`), and SDK client initializations. |
| **`middleware/`** | Cross-cutting Express middleware (JWT Auth guards, CORS settings, Rate Limiting, Error handling). |
| **`errors/`** | Standardized operational domain error classes (`AppError`, `NotFoundError`, `UnauthorizedError`, `ValidationError`). |
| **`logger/`** | Application logging engine, formatters, and central audit log abstractions. |
| **`constants/`** | Global static system constants, HTTP status codes, role names, and application keys. |
| **`types/`** | Global ambient TypeScript interface declarations and generic environment/request type augmentations. |
| **`utils/`** | Domain-agnostic utility functions (crypto hashing, date formatting, string helpers, file sanitization). |
| **`responses/`** | Standardized API response formatters (`ApiResponse.success()`, `ApiResponse.error()`). |
| **`database/`** | MongoDB database connection initialization, index setup, and Mongoose session/transaction helpers. |
| **`validators/`** | Reusable request validation schemas (Mongo ID validation, pagination query schemas). |

---

## Dependency Rules

- **Allowed**: `src/modules/*` → `src/shared/*`
- **Forbidden**: `src/shared/*` → `src/modules/*`
- `shared/` must remain completely independent of specific business feature modules.
