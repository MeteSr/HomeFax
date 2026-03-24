#!/usr/bin/env bash
# HomeFax — Local Deployment Script
# Starts a local dfx replica and deploys all canisters.
set -euo pipefail

echo "============================================"
echo "  HomeFax — Local Deployment"
echo "============================================"

# ── 1. Start dfx replica (background) ─────────────────────────────────────────
echo ""
echo "▶ Starting dfx local replica..."
if dfx ping 2>/dev/null; then
  echo "  ✓ dfx is already running"
else
  dfx start --background --clean
  echo "  ✓ dfx started"
fi

# ── 2. Deploy canisters ────────────────────────────────────────────────────────
echo ""
echo "▶ Deploying canisters..."
dfx deploy auth
dfx deploy property

# ── 3. Show canister IDs ───────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Deployed Canister IDs"
echo "============================================"

AUTH_ID=$(dfx canister id auth)
PROPERTY_ID=$(dfx canister id property)

echo "  Auth canister:     $AUTH_ID"
echo "  Property canister: $PROPERTY_ID"
echo ""
echo "  Candid UI (auth):     http://localhost:4943/?canisterId=$AUTH_ID"
echo "  Candid UI (property): http://localhost:4943/?canisterId=$PROPERTY_ID"
echo ""
echo "▶ To run backend tests:"
echo "  bash scripts/test-backend.sh"
echo ""
echo "✅ Deployment complete!"
