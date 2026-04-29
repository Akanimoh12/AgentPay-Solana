# AgentPay Documentation

Technical documentation, guides, and API references for AgentPay — the payment infrastructure layer for autonomous AI agents on Solana.

## Contents

- **Architecture** — See `PROJECT_STRUCTURE.md` at the repo root for the full annotated directory tree and architectural decisions.
- **SDK Reference** — All public methods are typed; see `sdk/src/modules/` and `sdk/src/index.ts` for the public API surface.
- **Deployment** — See `contracts/Anchor.toml` for program IDs and cluster config. Run `anchor build && anchor deploy` from the `contracts/` directory.
- **Environment Setup** — See root `.env.example` and each sub-package's `.env.example`.

## Quick Links

| Topic | Location |
|---|---|
| Anchor programs (Rust) | `contracts/programs/` |
| TypeScript SDK | `sdk/src/` |
| Backend API routes | `backend/src/routes/` |
| Frontend components | `frontend/app/` and `frontend/components/` |
| CLI demo scenarios | `demo/src/scenarios/` |
| Root env template | `.env.example` |
| Build commands | `README.md` → Getting Started |
