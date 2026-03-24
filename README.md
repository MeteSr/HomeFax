# HomeFax 🏠

**The Carfax for Homes** — Blockchain-verified home maintenance history on the Internet Computer Protocol (ICP).

HomeFax gives homeowners an immutable, tamper-proof record of every repair, upgrade, and inspection. Buyers and agents can verify a property's full history before closing — building trust and increasing home values.

---

## Project Overview

| Layer | Technology |
|---|---|
| Blockchain | Internet Computer Protocol (ICP) |
| Backend | Motoko canisters |
| Auth | ICP Internet Identity |
| Frontend | React + TypeScript + Vite |

### Two-Canister Architecture

- **`auth` canister** — User registration, profiles, and role management (Homeowner / Contractor / Realtor)
- **`property` canister** — Property registration, verification, and tier-based limits

---

## Features Implemented

### Auth Canister
- [x] User registration with roles (Homeowner, Contractor, Realtor)
- [x] Profile management (get, update)
- [x] Role checking
- [x] Admin controls (addAdmin, pause, unpause)
- [x] Platform metrics
- [x] Upgrade hooks for data persistence

### Property Canister
- [x] Property registration with type and tier
- [x] Tier-based property limits (Free=1, Pro=5, Premium=25, ContractorPro=unlimited)
- [x] Admin verification levels (Unverified, Basic, Premium)
- [x] Admin controls (addAdmin, pause, unpause)
- [x] Platform metrics
- [x] Upgrade hooks for data persistence

### Frontend
- [x] React + TypeScript + Vite scaffold
- [x] Internet Identity authentication flow
- [x] Landing page
- [x] Backend status page (shows canister IDs and connection state)

---

## Quick Start

### Prerequisites

- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/) >= 0.15
- Node.js >= 18
- npm >= 9

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/MeteSr/HomeFax.git
cd HomeFax

# 2. Install frontend dependencies
cd src/frontend && npm install && cd ../..
```

### Deploy Locally

```bash
# Start dfx and deploy all canisters
bash scripts/deploy-local.sh
```

This will:
1. Start a local dfx replica in the background
2. Deploy the `auth` and `property` canisters
3. Print canister IDs and Candid UI links

### Start Frontend Dev Server

```bash
# In a separate terminal
npm run frontend
# → http://localhost:3000
```

### Run Backend Tests

```bash
npm test
# or directly:
bash scripts/test-backend.sh
```

---

## Manual Test Commands

### Auth Canister

```bash
# Register as a homeowner
dfx canister call auth register '(record { role = variant { Homeowner }; email = "you@example.com"; phone = "555-0100" })'

# Get your profile
dfx canister call auth getProfile

# Update your profile
dfx canister call auth updateProfile '(record { email = "new@example.com"; phone = "555-0199" })'

# Check your role
dfx canister call auth hasRole '(variant { Homeowner })'

# View platform metrics
dfx canister call auth getMetrics
```

### Property Canister

```bash
# Register a property (Pro tier)
dfx canister call property registerProperty '(record {
  address = "123 Main Street";
  city = "San Francisco";
  state = "CA";
  zipCode = "94105";
  propertyType = variant { SingleFamily };
  yearBuilt = 1995;
  squareFeet = 1800;
  tier = variant { Pro };
})'

# List your properties
dfx canister call property getMyProperties

# Get a specific property
dfx canister call property getProperty '(1)'

# Check tier limits
dfx canister call property getPropertyLimitForTier '(variant { Free })'
dfx canister call property getPropertyLimitForTier '(variant { ContractorPro })'

# View property metrics
dfx canister call property getMetrics
```

### Admin Commands

```bash
# Add yourself as admin (first call — no auth check)
dfx canister call auth addAdmin "(principal \"$(dfx identity get-principal)\")"
dfx canister call property addAdmin "(principal \"$(dfx identity get-principal)\")"

# Pause a canister
dfx canister call auth pause

# Unpause
dfx canister call auth unpause

# Verify a property (admin only)
dfx canister call property verifyProperty '(1, variant { Basic })'
```

---

## Upgrade Testing

HomeFax canisters use `preupgrade`/`postupgrade` hooks to persist all HashMap data across canister upgrades.

```bash
# 1. Register data before upgrade
dfx canister call auth register '(record { role = variant { Homeowner }; email = "test@test.com"; phone = "555-0001" })'

# 2. Upgrade the canister
dfx deploy auth --upgrade-unchanged

# 3. Verify data survived the upgrade
dfx canister call auth getProfile
```

The test script (`bash scripts/test-backend.sh`) includes automated upgrade persistence tests.

---

## Project Structure

```
homefax/
├── dfx.json                    # ICP canister configuration
├── package.json                # Root scripts (deploy, test, frontend)
├── .gitignore
├── README.md
│
├── src/
│   ├── auth/
│   │   └── main.mo             # Auth canister (Motoko)
│   ├── property/
│   │   └── main.mo             # Property canister (Motoko)
│   └── frontend/
│       ├── index.html
│       ├── package.json        # Frontend dependencies
│       ├── tsconfig.json       # TypeScript strict mode
│       ├── tsconfig.node.json
│       ├── vite.config.ts      # Vite + proxy to localhost:8000
│       └── src/
│           ├── main.tsx        # React entry point
│           ├── App.tsx         # Routes + Internet Identity auth
│           └── index.css       # Styles
│
└── scripts/
    ├── deploy-local.sh         # Start dfx + deploy all canisters
    └── test-backend.sh         # Full backend test suite
```

---

## Subscription Tiers

| Tier | Properties | Use Case |
|---|---|---|
| Free | 1 | Single homeowner |
| Pro | 5 | Small portfolio |
| Premium | 25 | Property investor |
| ContractorPro | Unlimited | Contractors & agencies |

---

## Next Features Roadmap

- [ ] Maintenance records canister (log repairs, HVAC, plumbing, etc.)
- [ ] Receipt document hashing (SHA-256 proof of documents)
- [ ] Public HomeFax report generation (shareable URL)
- [ ] Property search by ZIP code
- [ ] Contractor marketplace (verified service providers)
- [ ] ICP token payments for tier upgrades
- [ ] Mobile-responsive frontend dashboard
- [ ] Email notification integration via HTTP outcalls
- [ ] Property transfer on home sale

---

## License

MIT © HomeFax 2024
