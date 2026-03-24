#!/usr/bin/env bash
# HomeFax — Backend Test Script
# Tests auth and property canisters with sample data.
set -euo pipefail

echo "============================================"
echo "  HomeFax — Backend Tests"
echo "============================================"

# Verify dfx is running
if ! dfx ping 2>/dev/null; then
  echo "❌ dfx is not running. Run: dfx start --background"
  exit 1
fi

AUTH_ID=$(dfx canister id auth 2>/dev/null || echo "")
PROPERTY_ID=$(dfx canister id property 2>/dev/null || echo "")

if [ -z "$AUTH_ID" ] || [ -z "$PROPERTY_ID" ]; then
  echo "❌ Canisters not deployed. Run: bash scripts/deploy-local.sh"
  exit 1
fi

echo ""
echo "Auth canister:     $AUTH_ID"
echo "Property canister: $PROPERTY_ID"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "── Auth Canister Tests ──────────────────────────────────────────────────"

echo ""
echo "▶ [1] Get metrics (before any users)..."
dfx canister call auth getMetrics

echo ""
echo "▶ [2] Register as Homeowner..."
dfx canister call auth register '(record { role = variant { Homeowner }; email = "test@homefax.io"; phone = "555-0100" })'

echo ""
echo "▶ [3] Get own profile..."
dfx canister call auth getProfile

echo ""
echo "▶ [4] Check role (Homeowner)..."
dfx canister call auth hasRole '(variant { Homeowner })'

echo ""
echo "▶ [5] Check role (Contractor — should be false)..."
dfx canister call auth hasRole '(variant { Contractor })'

echo ""
echo "▶ [6] Update profile..."
dfx canister call auth updateProfile '(record { email = "updated@homefax.io"; phone = "555-0199" })'

echo ""
echo "▶ [7] Get metrics (after registration)..."
dfx canister call auth getMetrics

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "── Property Canister Tests ──────────────────────────────────────────────"

echo ""
echo "▶ [8] Get metrics (before any properties)..."
dfx canister call property getMetrics

echo ""
echo "▶ [9] Check tier limit — Free (expect 1)..."
dfx canister call property getPropertyLimitForTier '(variant { Free })'

echo ""
echo "▶ [10] Check tier limit — Pro (expect 5)..."
dfx canister call property getPropertyLimitForTier '(variant { Pro })'

echo ""
echo "▶ [11] Check tier limit — Premium (expect 25)..."
dfx canister call property getPropertyLimitForTier '(variant { Premium })'

echo ""
echo "▶ [12] Check tier limit — ContractorPro (expect 0 = unlimited)..."
dfx canister call property getPropertyLimitForTier '(variant { ContractorPro })'

echo ""
echo "▶ [13] Register a property (Free tier)..."
dfx canister call property registerProperty '(record {
  address = "123 Main Street";
  city = "San Francisco";
  state = "CA";
  zipCode = "94105";
  propertyType = variant { SingleFamily };
  yearBuilt = 1995;
  squareFeet = 1800;
  tier = variant { Free };
})'

echo ""
echo "▶ [14] Get my properties..."
dfx canister call property getMyProperties

echo ""
echo "▶ [15] Get property by ID (id=1)..."
dfx canister call property getProperty '(1)'

echo ""
echo "▶ [16] Try to register a second property (Free tier — should fail with LimitReached)..."
dfx canister call property registerProperty '(record {
  address = "456 Oak Avenue";
  city = "Oakland";
  state = "CA";
  zipCode = "94601";
  propertyType = variant { Condo };
  yearBuilt = 2010;
  squareFeet = 900;
  tier = variant { Free };
})' || echo "  ↳ Expected LimitReached error — ✓"

echo ""
echo "▶ [17] Get final property metrics..."
dfx canister call property getMetrics

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "── Upgrade Persistence Test ─────────────────────────────────────────────"
echo ""
echo "▶ [18] Upgrading auth canister (tests preupgrade/postupgrade)..."
dfx deploy auth --upgrade-unchanged
echo "▶ [19] Verify profile still exists after upgrade..."
dfx canister call auth getProfile
echo ""
echo "▶ [20] Upgrading property canister..."
dfx deploy property --upgrade-unchanged
echo "▶ [21] Verify property still exists after upgrade..."
dfx canister call property getMyProperties

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  ✅ All tests complete!"
echo "============================================"
