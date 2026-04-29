<p align="center">
  <h1 align="center">AgentPay</h1>
  <p align="center"><strong>The payment infrastructure layer for the autonomous agent economy</strong></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/chain-Solana%20Testnet-9945FF" alt="Solana Testnet" />
  <img src="https://img.shields.io/badge/framework-Anchor%200.30-14F195" alt="Anchor 0.30" />
</p>

<p align="center">
  <a href="https://agentpay-sigma.vercel.app/"><strong>🌐 Live App</strong></a> ·
  <a href="https://www.loom.com/share/6cd494b3c10b42a8a4d258e1abb55463"><strong>🎬 Demo Video</strong></a>
</p>

---

## Deployed Programs (Solana Testnet)

| Program | ID |
|---|---|
| **AgentRegistry** | `AgentRegist1111111111111111111111111111111` |
| **PaymentRouter** | `PaymentRoutr1111111111111111111111111111111` |
| **SplitVault** | `SplitVau1t11111111111111111111111111111111` |

> **Network:** Solana Testnet · **RPC:** `https://api.testnet.solana.com` · **Framework:** Anchor 0.30.1

---

## Overview

As autonomous AI agents become active participants in digital economies — booking compute, purchasing data, hiring other agents — they need a way to pay each other. Today, no standard protocol exists for agent-to-agent payments. Agents lack persistent on-chain identities, cannot escrow funds conditionally, and have no mechanism for transparent invoicing. Developers building multi-agent systems are forced to hardcode payment logic, rely on centralized intermediaries, or skip billing entirely.

**AgentPay** is a Solana smart contract protocol and TypeScript SDK that provides financial rails for autonomous AI agents. It enables agents to register verifiable on-chain identities, initiate micropayments, escrow funds with conditional release tied to job completion, and split revenue across multiple parties — all settled on Solana with a complete audit trail.

The vision is straightforward: as the agentic economy scales from hundreds to millions of autonomous agents transacting with each other, AgentPay becomes the standard financial plumbing layer. Every agent-to-agent interaction that involves value exchange — compute purchases, data licensing, inference requests, task delegation — flows through a common, composable protocol that any developer can integrate in minutes.

---

## Key Features

- **Self-custodial agent wallets** — Agents register on-chain identities in the AgentRegistry, binding a verifiable label to a self-custodial Solana wallet. No custodians, no intermediaries.

- **Micropayment settlement** — Sub-cent SOL payments between agents with minimal transaction cost. Designed for high-frequency, low-value transactions at scale.

- **Escrow with conditional release** — Funds are locked in escrow when a job is initiated and released only when the job is complete. Protects both requesting and fulfilling agents.

- **Multi-party revenue splitting** — Revenue from a single payment can be automatically distributed across multiple recipients according to predefined basis-point ratios via SplitVault.

- **Developer-first TypeScript SDK** — A clean, typed SDK (`@agentpay/sdk`) built on `@coral-xyz/anchor` and `@solana/web3.js` that abstracts on-chain operations into simple method calls.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AGENT LAYER                          │
│                                                             │
│   AI Agent A          AI Agent B          AI Agent C        │
│   (Requester)         (Provider)          (Affiliate)       │
│       │                   │                    │            │
│       └──────── AgentPay TypeScript SDK ───────┘            │
│                          │                                  │
├──────────────────────────┼──────────────────────────────────┤
│                   PROTOCOL LAYER                            │
│                          │                                  │
│  ┌──────────────┐  ┌─────┴────────┐  ┌──────────────────┐  │
│  │ AgentRegistry│  │PaymentRouter │  │   SplitVault     │  │
│  │              │  │              │  │                  │  │
│  │ • Register   │  │ • Pay direct │  │ • Configure      │  │
│  │ • Lookup     │  │ • Escrow     │  │   split ratios   │  │
│  │ • Verify     │  │ • Release    │  │ • Distribute     │  │
│  │   identity   │  │ • Cancel     │  │   revenue        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                          │                                  │
├──────────────────────────┼──────────────────────────────────┤
│                SOLANA INFRASTRUCTURE                        │
│                                                             │
│   ┌────────────────────────────────────────────────────┐   │
│   │              Solana Testnet / Mainnet               │   │
│   │   Anchor runtime · Program Derived Addresses ·      │   │
│   │   SOL native token · Confirmed commitment           │   │
│   └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## How It Works

A complete agent-to-agent payment flow through AgentPay:

**1. Agent Registration**
Both agents register on-chain. Each agent calls the AgentRegistry program with a unique agent ID (derived via `deriveAgentId`), a human-readable name, and a list of services offered. The registry stores this as a PDA (Program Derived Address) owned by the agent's wallet.

**2. Job Request**
Agent A (requester) discovers Agent B (provider) through the registry and initiates a job request. The request specifies the service, desired parameters, amount, and deadline.

**3. Escrow Lock**
Agent A calls `PaymentRouter.createEscrow()`, locking the agreed SOL amount in a PDA vault. The escrow record includes: payer, payee, amount, job ID, and deadline. Funds are held by the program — neither agent can access them unilaterally.

**4. Job Execution**
Agent B performs the requested work off-chain (AgentPay manages only the financial layer).

**5. Settlement**
Once the job is complete, Agent A calls `PaymentRouter.releaseEscrow()`. The program transfers funds from the escrow vault to the payee, deducting a protocol fee (configurable, default 50 bps). If the job is not completed by the deadline, Agent A calls `cancelEscrow()` to reclaim funds.

**6. Revenue Split**
If Agent B has a SplitVault configured (e.g. 85% to itself, 10% to a referral agent, 5% as treasury), they call `SplitVault.distribute()`. Each recipient's share is calculated in basis points and transferred in the same transaction.

---

## SDK Usage

```typescript
import { createAgentPayClient, deriveAgentId, randomId32, solToLamports } from "@agentpay/sdk";

const client = createAgentPayClient({
  rpcUrl: "https://api.testnet.solana.com",
  cluster: "testnet",
  programs: {
    agentRegistry: "AgentRegist1111111111111111111111111111111",
    paymentRouter: "PaymentRoutr1111111111111111111111111111111",
    splitVault:    "SplitVau1t11111111111111111111111111111111",
  },
  payerSecretKey: process.env.PAYER_SECRET_KEY,
});

// Register an agent
const agentId = deriveAgentId("my-agent-label");
await client.registry.registerAgent({
  agentId,
  name: "MyAgent",
  services: ["text-completion"],
  owner: client.provider.wallet.publicKey,
});

// Create an escrow
const escrowId = randomId32();
await client.payments.createEscrow({
  escrowId,
  payerAgentId: agentId,
  payeeAgentId: providerAgentId,
  payee: providerPublicKey,
  amountLamports: solToLamports(0.05),
  jobId: deriveAgentId("job-001"),
  deadline: Math.floor(Date.now() / 1000) + 3600,
  payer: client.provider.wallet.publicKey,
});

// Release on completion
await client.payments.releaseEscrow(escrowId, client.provider.wallet.publicKey);

// Configure a revenue split
const splitId = randomId32();
await client.splits.configureSplit({
  splitId,
  ownerAgentId: agentId,
  recipients: [
    { wallet: providerWallet, shareBps: 8500 },
    { wallet: referralWallet, shareBps: 1000 },
    { wallet: treasuryWallet, shareBps: 500  },
  ],
  owner: client.provider.wallet.publicKey,
});
await client.splits.distribute({ splitId, amountLamports: solToLamports(0.1), payer });
```

---

## Project Structure

```
AgentPay/
├── contracts/               # Anchor programs (Rust)
│   ├── programs/
│   │   ├── agent_registry/  # Agent identity registration
│   │   ├── payment_router/  # Direct pay + escrow engine
│   │   └── split_vault/     # Multi-party revenue distribution
│   ├── tests/               # TypeScript integration tests (Anchor)
│   └── Anchor.toml          # Anchor workspace config
├── sdk/                     # TypeScript SDK — @agentpay/sdk
│   └── src/
│       ├── modules/         # registry, payments, splits
│       ├── types/           # TypeScript types + Zod schemas
│       └── utils/           # keys, amounts, errors, constants
├── backend/                 # Hono.js REST API
│   └── src/
│       ├── routes/          # agents, payments, splits endpoints
│       ├── services/        # business logic
│       └── db/              # Drizzle ORM (Postgres)
├── frontend/                # Next.js 14 dashboard
│   └── src/
│       ├── app/             # App Router pages
│       ├── components/      # UI and feature components
│       └── hooks/           # Solana wallet + SDK hooks
├── demo/                    # Standalone CLI demo scenarios
│   └── src/scenarios/       # agent-registration, payment, escrow, split, full-workflow
├── docs/                    # Architecture and reference docs
├── turbo.json               # Turborepo build pipeline
├── pnpm-workspace.yaml      # pnpm workspace config
├── biome.json               # Linting + formatting
└── docker-compose.yml       # Postgres + Redis for local dev
```

---

## Getting Started

1. **Clone and install** — `pnpm install` at the repo root resolves all workspace dependencies.

2. **Start local services** — `docker compose up -d` starts PostgreSQL and Redis.

3. **Configure environment** — copy `.env.example` to `.env` and fill in:
   - `SOLANA_RPC_URL` — Solana RPC endpoint
   - `AGENT_REGISTRY_PROGRAM_ID` / `PAYMENT_ROUTER_PROGRAM_ID` / `SPLIT_VAULT_PROGRAM_ID` — after `anchor deploy`
   - `DEPLOYER_SECRET_KEY` — base58 or JSON-array wallet secret
   - `DATABASE_URL` and `REDIS_URL`

4. **Build Anchor programs** — `cd contracts && anchor build && anchor deploy`

5. **Build the SDK** — `pnpm sdk:build`

6. **Run the demo** — `cd demo && cp .env.example .env && pnpm start`

7. **Start the full stack** — `pnpm dev` (runs backend on :3001 and frontend on :3000 in parallel)

---

## Anchor Programs

| Program | Purpose | Key Instructions |
|---|---|---|
| **agent_registry** | Agent identity management | `initialize`, `register_agent`, `update_services`, `deactivate_agent` |
| **payment_router** | Payment engine | `initialize`, `pay_direct`, `create_escrow`, `release_escrow`, `cancel_escrow` |
| **split_vault** | Revenue distribution | `configure_split`, `distribute`, `deactivate_split` |

All programs use PDAs (Program Derived Addresses) for on-chain state, with seeds based on program-assigned IDs. The `payment_router` maintains a `RouterConfig` PDA storing the fee receiver and protocol fee bps.

---

## Use Cases

**AI Data Marketplace** — Data provider agents sell curated datasets to consumer agents. AgentPay handles per-query micropayments, escrows bulk purchases, and splits revenue between curator and source.

**Autonomous DeFi Networks** — DeFi agents hire specialist agents for strategy execution. Each interaction is a paid service call settled via AgentPay.

**Agent-as-a-Service Platforms** — Platforms hosting AI agents bill per-invocation. When a user request triggers a chain of agents, each bills for its contribution via SplitVault.

**Decentralized Inference Markets** — GPU providers sell inference to requester agents. Escrow protects against failed jobs; direct pay handles spot requests.

---

## Roadmap

### Phase 1 — MVP
- Deploy all three Anchor programs to Solana testnet
- Ship TypeScript SDK with full program coverage
- Demo scenarios: registration, direct pay, escrow, revenue split, full workflow
- Frontend dashboard with wallet connection, agent browser, and payment history

### Phase 2 — Ecosystem
- Publish `@agentpay/sdk` to npm
- SPL token payment support alongside native SOL
- Dispute resolution with time-locked arbitration
- Agent reputation system based on on-chain history

### Phase 3 — Maturity
- Cross-chain payment routing via Wormhole bridge
- Subscription / recurring payment primitives
- DAO governance for protocol parameter control
- Full security audit of all programs

---

## License

[MIT](LICENSE)
