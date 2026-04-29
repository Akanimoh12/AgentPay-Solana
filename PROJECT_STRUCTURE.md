# AgentPay — Project Structure

> Micropayment and autonomous billing protocol for AI agents on Solana.

**Last updated:** April 27, 2026
**Monorepo manager:** pnpm workspaces
**Build orchestration:** Turborepo
**Smart contract framework:** Anchor 0.30.1 (Rust)
**Chain:** Solana Testnet / Mainnet

This is a pnpm monorepo with a flat folder structure. Each concern lives in its own root-level directory. Turborepo handles task orchestration, caching, and dependency-aware builds across the workspace.

---

## Complete Directory Tree

```
AgentPay/
│
├── package.json                        # Root package.json — workspace config, shared scripts, devDependency hoisting
├── pnpm-workspace.yaml                 # Defines workspace packages: contracts, sdk, frontend, backend, demo
├── pnpm-lock.yaml                      # Lockfile — committed to version control
├── turbo.json                          # Turborepo pipeline config — build, test, lint, dev tasks and caching
├── biome.json                          # Biome config — linting and formatting rules (replaces ESLint + Prettier)
├── .env.example                        # Template for all required environment variables
├── docker-compose.yml                  # Local dev services: PostgreSQL 16 + Redis 7
├── README.md                           # Project overview, architecture, usage guide
├── PROJECT_STRUCTURE.md                # This file — annotated directory tree and architectural decisions
├── LICENSE                             # MIT License
├── .gitignore                          # Ignores: node_modules, dist, .env, target/, .turbo
│
├── contracts/                          # Anchor workspace — Rust smart programs
│   ├── Anchor.toml                     # Anchor config — program IDs, cluster, wallet, test runner
│   ├── Cargo.toml                      # Rust workspace manifest — lists all member programs
│   ├── package.json                    # Package: @agentpay/contracts — Anchor CLI, ts-mocha, @coral-xyz/anchor
│   ├── tsconfig.json                   # TypeScript config for Anchor test files
│   │
│   ├── programs/
│   │   ├── agent_registry/             # AgentRegistry Anchor program
│   │   │   ├── Cargo.toml
│   │   │   └── src/
│   │   │       ├── lib.rs              # Program entry — declares instructions (initialize, register_agent, update_services, deactivate_agent)
│   │   │       ├── state.rs            # AgentRecord account struct — agent_id, name, wallet, services, active, created_at
│   │   │       ├── instructions/       # One file per instruction with validation and account contexts
│   │   │       └── errors.rs           # Custom error codes (AlreadyRegistered, NotFound, Unauthorized, etc.)
│   │   │
│   │   ├── payment_router/             # PaymentRouter Anchor program
│   │   │   ├── Cargo.toml
│   │   │   └── src/
│   │   │       ├── lib.rs              # Program entry — declares instructions (initialize, pay_direct, create_escrow, release_escrow, cancel_escrow)
│   │   │       ├── state.rs            # RouterConfig + Escrow account structs
│   │   │       ├── instructions/       # Per-instruction files with CPI, lamport transfers, fee logic
│   │   │       └── errors.rs           # Custom error codes (EscrowAlreadyReleased, DeadlinePassed, etc.)
│   │   │
│   │   └── split_vault/                # SplitVault Anchor program
│   │       ├── Cargo.toml
│   │       └── src/
│   │           ├── lib.rs              # Program entry — declares instructions (configure_split, distribute, deactivate_split)
│   │           ├── state.rs            # SplitConfig account struct — split_id, owner, recipients (wallet + share_bps), active
│   │           ├── instructions/       # Per-instruction files with remaining_accounts distribution logic
│   │           └── errors.rs           # Custom error codes (InvalidShareTotal, TooManyRecipients, etc.)
│   │
│   ├── tests/                          # TypeScript integration tests using @coral-xyz/anchor
│   │   ├── agent_registry.ts           # Tests: registration, lookup, deactivation, duplicate reverts
│   │   ├── payment_router.ts           # Tests: direct pay, escrow lifecycle, fee deduction, deadline expiry
│   │   └── split_vault.ts              # Tests: split config, distribution math, deactivation
│   │
│   ├── migrations/                     # Anchor migration scripts (if needed for initializer instructions)
│   │
│   ├── agent_registry/                 # Anchor-generated IDL and types for agent_registry
│   ├── payment_router/                 # Anchor-generated IDL and types for payment_router
│   └── split_vault/                    # Anchor-generated IDL and types for split_vault
│
├── sdk/                                # TypeScript SDK — @agentpay/sdk
│   ├── package.json                    # Package: @agentpay/sdk — @coral-xyz/anchor, @solana/web3.js, bs58, zod
│   ├── tsconfig.json                   # TypeScript 5.4+ strict config
│   ├── tsup.config.ts                  # tsup bundler — outputs CJS + ESM, generates .d.ts
│   ├── vitest.config.ts                # Vitest test config
│   │
│   └── src/
│       ├── index.ts                    # Public API barrel export — client, types, utilities
│       ├── client.ts                   # AgentPayClient class — Connection, AnchorProvider, module init
│       │
│       ├── modules/
│       │   ├── registry.ts             # RegistryModule — registerAgent, getAgent, listAgents, updateServices, deactivate
│       │   ├── payments.ts             # PaymentsModule — payDirect, createEscrow, releaseEscrow, cancelEscrow, getEscrow
│       │   └── splits.ts              # SplitsModule — configureSplit, distribute, getSplit, deactivateSplit
│       │
│       ├── idl/
│       │   ├── index.ts               # Barrel export for all IDLs
│       │   ├── agent_registry.ts      # Anchor IDL for agent_registry program
│       │   ├── payment_router.ts      # Anchor IDL for payment_router program
│       │   └── split_vault.ts         # Anchor IDL for split_vault program
│       │
│       ├── types/
│       │   ├── index.ts               # Barrel export all types
│       │   ├── agent.ts               # AgentProfile, RegisterAgentParams, UpdateServicesParams
│       │   ├── payment.ts             # Escrow, DirectPaymentParams, CreateEscrowParams
│       │   ├── split.ts               # SplitConfig, SplitRecipient
│       │   └── schemas.ts             # Zod schemas — ClientConfig validation
│       │
│       └── utils/
│           ├── keys.ts                # PDA derivation — agentPda, escrowPda, splitPda, deriveAgentId, randomId32
│           ├── amounts.ts             # solToLamports, lamportsToSol, formatSol, bpsToPercent, percentToBps
│           ├── errors.ts              # AgentPayError, AgentNotFoundError, EscrowNotFoundError, InsufficientFundsError
│           └── constants.ts           # SOLANA_TESTNET_RPC, LAMPORTS_PER_SOL, MAX_SPLIT_RECIPIENTS, BPS_DENOMINATOR
│
├── frontend/                           # Next.js 14 App Router — web dashboard
│   ├── package.json                    # Package: @agentpay/frontend — next 14, tailwindcss, @solana/wallet-adapter-*, @agentpay/sdk
│   ├── next.config.ts                  # Next.js config — transpilePackages for SDK, env vars
│   ├── tailwind.config.ts              # Tailwind CSS config — AgentPay brand colors, dark mode
│   ├── tsconfig.json                   # TypeScript config — strict, JSX preserve, path aliases (@/)
│   ├── postcss.config.js              # PostCSS config — Tailwind plugin
│   ├── .env.example                   # Frontend-specific env template (NEXT_PUBLIC_* vars)
│   │
│   ├── app/
│   │   ├── layout.tsx                  # Root layout — SolanaProvider, QueryClientProvider, global styles
│   │   ├── globals.css                 # Tailwind directives, body styles, utility classes
│   │   ├── page.tsx                    # Landing page — hero, features, how it works, CTA
│   │   └── dashboard/
│   │       ├── layout.tsx              # Dashboard layout — sidebar navigation, header with wallet connection
│   │       ├── page.tsx                # Dashboard home — payment volume summary, recent transactions
│   │       ├── agents/page.tsx         # Agent directory — browse registered agents
│   │       ├── payments/page.tsx       # Payment list — filterable table of all payments
│   │       ├── escrows/page.tsx        # Escrow management — active escrows, release/cancel actions
│   │       └── splits/page.tsx         # Revenue splits — configure and view split distributions
│   │
│   ├── components/
│   │   ├── ui/                         # Base UI components — Button, Card, Badge, Input, Table, Dialog
│   │   ├── landing/                    # Landing page sections — Hero, Features, HowItWorks, Footer
│   │   ├── features/                   # Domain components — PaymentCard, EscrowTimeline, SplitBreakdown
│   │   ├── layouts/
│   │   │   ├── Sidebar.tsx             # Dashboard sidebar — navigation links, wallet status
│   │   │   └── Header.tsx              # Dashboard header — breadcrumb, wallet connect button
│   │   └── providers.tsx               # Client providers — SolanaProvider, WalletModalProvider, QueryClientProvider
│   │
│   ├── hooks/                          # React hooks
│   │   ├── useAgentRegistry.ts         # useSolanaAgents, useRegisterAgent — Solana wallet adapter + SDK
│   │   ├── usePayments.ts              # usePayments, useCreateEscrow, useReleaseEscrow
│   │   └── useSplits.ts               # useSplits, useConfigureSplit, useDistribute
│   │
│   └── lib/
│       ├── solana.ts                   # Solana connection singleton, cluster config
│       ├── query.ts                    # TanStack Query client — default options
│       └── api.ts                      # Typed API client — methods for all backend endpoints
│
├── backend/                            # Hono.js REST API backend
│   ├── package.json                    # Package: @agentpay/backend — hono, drizzle-orm, pg, redis, @agentpay/sdk
│   ├── tsconfig.json                   # TypeScript config — strict, ESNext
│   ├── drizzle.config.ts              # Drizzle Kit config — schema path, migration output
│   ├── .env.example                   # Backend-specific env template
│   │
│   └── src/
│       ├── index.ts                    # App entry — Hono app, middleware, route mounting, server start
│       │
│       ├── routes/
│       │   ├── agents.ts               # POST / (register), GET / (list), GET /:agentId
│       │   ├── payments.ts             # POST /direct, POST /escrow, POST /escrow/:id/release, POST /escrow/:id/cancel, GET /
│       │   └── splits.ts              # POST / (configure), POST /:id/distribute, GET /:id
│       │
│       ├── services/
│       │   ├── AgentService.ts         # Agent registration logic — validates input, calls SDK, persists to DB
│       │   ├── PaymentService.ts       # Payment orchestration — escrow creation, release, status tracking
│       │   └── SplitService.ts        # Split configuration and distribution logic
│       │
│       ├── db/
│       │   ├── index.ts                # Drizzle ORM client — PostgreSQL connection
│       │   ├── schema.ts              # Drizzle schema — agents, payments, escrows, splits tables
│       │   ├── migrate.ts             # Migration runner script
│       │   └── migrations/            # SQL migration files generated by drizzle-kit
│       │
│       ├── middleware/
│       │   ├── errorHandler.ts         # Global error handler — structured JSON error responses
│       │   └── rateLimit.ts            # Rate limiting middleware — Redis-backed, per-IP limits
│       │
│       └── lib/
│           ├── agentpay.ts             # Singleton AgentPay SDK client instance
│           ├── redis.ts                # Redis client initialization — getCache, setCache helpers
│           └── config.ts              # Environment variable parsing and validation via Zod
│
├── demo/                               # Standalone CLI demo — shows all SDK operations end-to-end
│   ├── package.json                    # Package: @agentpay/demo — @agentpay/sdk, @solana/web3.js, chalk, dotenv
│   ├── .env.example                   # Demo-specific env template (program IDs + PAYER_SECRET_KEY)
│   │
│   └── src/
│       ├── index.ts                    # Interactive menu — select and run scenarios
│       ├── lib/
│       │   └── client.ts              # Shared client factory — reads env vars, returns AgentPayClient
│       └── scenarios/
│           ├── agent-registration.ts   # Demo: register two agents, verify profiles
│           ├── simple-payment.ts       # Demo: pay_direct with fee deduction
│           ├── escrow-payment.ts       # Demo: create escrow, check state, release
│           ├── revenue-split.ts        # Demo: configure split, distribute 0.1 SOL
│           └── full-workflow.ts        # Demo: all operations end-to-end
│
└── docs/                               # Project documentation
    └── README.md                       # Documentation index
```

---

## Environment Variables Reference

All variables are documented in `.env.example`. Each sub-package has its own `.env.example`. Copy root `.env.example` to `.env` and fill in the values.

| Variable | Description | Required | Example |
|---|---|---|---|
| `SOLANA_CLUSTER` | Solana cluster name | Yes | `testnet` |
| `SOLANA_RPC_URL` | Solana JSON-RPC endpoint | Yes | `https://api.testnet.solana.com` |
| `SOLANA_COMMITMENT` | Transaction confirmation level | No (default: confirmed) | `confirmed` |
| `AGENT_REGISTRY_PROGRAM_ID` | Deployed AgentRegistry program ID | After `anchor deploy` | `AgentRegist1...` |
| `PAYMENT_ROUTER_PROGRAM_ID` | Deployed PaymentRouter program ID | After `anchor deploy` | `PaymentRoutr1...` |
| `SPLIT_VAULT_PROGRAM_ID` | Deployed SplitVault program ID | After `anchor deploy` | `SplitVau1t1...` |
| `DEPLOYER_SECRET_KEY` | Base58 or JSON-array wallet secret for deployment | Yes (deploy) | `[1,2,3,...]` |
| `PAYER_SECRET_KEY` | Secret key for demo / backend signing | Yes (demo/backend) | `base58...` |
| `DATABASE_URL` | PostgreSQL connection string | Yes (backend) | `postgresql://...` |
| `REDIS_URL` | Redis connection string | No (degrades gracefully) | `redis://localhost:6379` |
| `API_PORT` | Hono API server port | No (default: 3001) | `3001` |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | Solana cluster exposed to browser | Yes (frontend) | `testnet` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC URL exposed to browser | Yes (frontend) | `https://api.testnet.solana.com` |
| `NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID` | AgentRegistry program ID for frontend | Yes (frontend) | `AgentRegist1...` |
| `NEXT_PUBLIC_PAYMENT_ROUTER_PROGRAM_ID` | PaymentRouter program ID for frontend | Yes (frontend) | `PaymentRoutr1...` |
| `NEXT_PUBLIC_SPLIT_VAULT_PROGRAM_ID` | SplitVault program ID for frontend | Yes (frontend) | `SplitVau1t1...` |
| `NEXT_PUBLIC_API_URL` | Backend API URL visible to browser | Yes (frontend) | `http://localhost:3001/api` |

---

## Monorepo Task Reference

All commands run from the repository root unless noted. Turborepo handles dependency ordering and caching.

| Command | Scope | Description |
|---|---|---|
| `pnpm install` | Root | Install all workspace dependencies |
| `pnpm build` | All packages | Build everything: SDK → API → Web (Turborepo-ordered) |
| `pnpm test` | All packages | Run all tests: Anchor tests + SDK Vitest + API Vitest |
| `pnpm lint` | All packages | Lint and format-check with Biome |
| `pnpm lint:fix` | All packages | Auto-fix linting and formatting |
| `pnpm dev` | Apps only | Start API (port 3001) + Web (port 3000) in parallel |
| `pnpm typecheck` | All packages | TypeScript type checking across all packages |
| `pnpm contracts:compile` | contracts | `anchor build` — compile all Rust programs |
| `pnpm contracts:test` | contracts | `anchor test` — run TypeScript integration tests against localnet |
| `pnpm contracts:deploy` | contracts | `anchor deploy` — deploy programs to configured cluster |
| `pnpm sdk:build` | sdk | Build SDK — outputs CJS + ESM to `dist/` |
| `pnpm frontend:dev` | frontend | Start Next.js dev server on port 3000 |
| `pnpm backend:dev` | backend | Start Hono API in dev mode with hot reload |

---

## Inter-Package Dependency Map

```
┌─────────────────────────────────────────────────────┐
│                    frontend                          │
│                  (Next.js 14)                        │
│                       │                             │
│                       │ imports                     │
│                       ▼                             │
│  backend ─────────► sdk ◄──────── demo              │
│  (Hono.js)         (TypeScript)                     │
│                       │                             │
│                       │ imports IDLs                │
│                       ▼                             │
│                   contracts                         │
│            (Anchor / Rust programs)                  │
└─────────────────────────────────────────────────────┘
```

| Consumer | Depends On | What It Uses |
|---|---|---|
| `frontend` | `sdk` | AgentPayClient, types, wallet-adapter hooks |
| `backend` | `sdk` | AgentPayClient for on-chain reads in API services |
| `demo` | `sdk` | AgentPayClient, utility functions, all module methods |
| `sdk` | `contracts` (IDLs) | Anchor IDL JSON — embedded in `src/idl/` at build time |

The `contracts` package has no internal dependencies — it is the leaf node. Changes to Rust programs require `anchor build` to regenerate IDLs, then `sdk` picks them up.

---

## Key Architectural Decisions

### Why Anchor over raw Solana programs

Anchor provides a framework of account validation macros, error type generation, and CPI helpers that significantly reduce boilerplate in Rust programs. Account constraints (seeds, ownership, mutability) are declared at the struct level rather than scattered through instruction handlers, making the code more auditable. Anchor's IDL generation produces machine-readable program interfaces that the TypeScript SDK consumes directly.

Raw Solana programs require manually implementing account validation, serialization (via Borsh), and error handling that Anchor provides automatically. For a protocol with three programs and complex state, the maintainability benefit is substantial.

### Why @coral-xyz/anchor + @solana/web3.js over alternative clients

The SDK uses the official Anchor TypeScript client (`@coral-xyz/anchor`) for program interaction because it consumes IDLs directly, providing type-safe instruction builders and account fetchers. `@solana/web3.js` handles the underlying connection, keypair management, and transaction submission.

This mirrors how the on-chain programs are defined — using the same IDL at both ends means parameter types stay in sync automatically. No manual ABI-to-TypeScript mapping is needed.

### Why Hono.js over Express for the API

Hono.js provides Express-equivalent functionality with Web Standards APIs (Request/Response), built-in TypeScript support, and significantly better performance. It runs on Node.js, Bun, Deno, and edge runtimes without modification.

### Why Drizzle ORM over Prisma

Drizzle ORM generates SQL that reads like SQL. Queries are typed function calls that map directly to Postgres operations — no query engine abstraction layer. This matters for a payment system where precise control over transaction isolation and query performance is important. Drizzle gives us type safety without sacrificing control.

### Why Biome over ESLint + Prettier

Biome is a single binary handling both linting and formatting, replacing two tools and multiple plugins. In a monorepo with five packages, managing ESLint configs across packages becomes a maintenance burden. Biome's single config applies workspace-wide and runs significantly faster.

### Why pnpm workspaces + Turborepo

AgentPay has five distinct deployment targets: programs deploy to Solana, the SDK publishes to npm, the API deploys as a server, the frontend deploys as a static site, and the demo runs as a CLI. A monorepo with explicit package boundaries enforces clean interfaces. Turborepo provides incremental builds with remote caching — when only the frontend changes, contracts and SDK tests don't re-run.

---

## Solana Program Architecture

All three programs follow the same Anchor patterns:

**PDAs (Program Derived Addresses)** — All on-chain state is stored in PDAs seeded by program-specific identifiers, ensuring deterministic addresses derivable by any client without storing them.

| PDA | Seeds | Stores |
|---|---|---|
| `AgentRecord` | `[b"agent", agent_id]` | Name, wallet, services, active flag |
| `RouterConfig` | `[b"config"]` | Fee receiver, protocol fee bps |
| `Escrow` | `[b"escrow", escrow_id]` | Payer/payee, amount, deadline, release state |
| `EscrowVault` | `[b"escrow_vault", escrow_id]` | Lamport vault for escrowed funds |
| `SplitConfig` | `[b"split", split_id]` | Owner, recipients (wallet + share_bps), active |

**Agent IDs** — Agent identifiers are 32-byte arrays derived via `sha256(label)` (truncated), making them deterministic from a human-readable label. The `deriveAgentId` utility in the SDK handles this.

**Fee model** — `PaymentRouter` collects a protocol fee (default 50 bps = 0.5%) on both direct payments and escrow releases, transferred to a configurable `fee_receiver` account.
