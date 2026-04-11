# Contributing to HomeGentic

Thank you for your interest in contributing to HomeGentic!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/homegentic.git`
3. Install DFX: `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`
4. Install Node.js 20+
5. Start the local replica: `make start`
6. Deploy canisters: `make deploy`

## Development Workflow

1. Make your changes on `main` (this project commits directly to main)
2. Run backend tests: `make test`
3. Build the frontend: `cd frontend && npm run build`
4. Commit with a clear message and push

## Code Conventions

- Motoko canisters: use `persistent actor` — all vars are implicitly stable, no preupgrade/postupgrade hooks needed; use `transient var` only for state that should reset on upgrade (e.g. rate-limit maps)
- Frontend: React functional components with TypeScript strict mode
- Shell scripts: `set -euo pipefail` at the top, descriptive echo statements
- Commit messages: use conventional commits format (`feat:`, `fix:`, `docs:`, etc.)

## Canister Guidelines

- All new canisters go under `backend/<name>/main.mo`
- Add a corresponding `test.sh` under `backend/<name>/test.sh`
- Register the canister in `dfx.json`
- Add a deploy step to `scripts/deploy.sh`

## Reporting Issues

Use the GitHub issue templates:
- Bug reports: describe the bug, reproduction steps, and environment
- Feature requests: describe the problem and proposed solution
