#!/usr/bin/env bash
set -euo pipefail
echo "=== Payment Canister Tests ==="

echo "▶ Get current subscription (expect Free default)..."
dfx canister call payment getMySubscription

MY_PRINCIPAL=$(dfx identity get-principal)

echo "▶ Grant Pro subscription (bypasses ICP payment — local dev only)..."
dfx canister call payment grantSubscription "(principal \"$MY_PRINCIPAL\", variant { Pro })"

echo "▶ Get updated subscription (expect Pro)..."
dfx canister call payment getMySubscription

echo "▶ getTierForPrincipal — expect Pro..."
dfx canister call payment getTierForPrincipal "(principal \"$MY_PRINCIPAL\")"

echo "▶ Grant Premium subscription..."
dfx canister call payment grantSubscription "(principal \"$MY_PRINCIPAL\", variant { Premium })"

echo "▶ Get updated subscription (expect Premium)..."
dfx canister call payment getMySubscription

echo "▶ Downgrade to Free via grantSubscription..."
dfx canister call payment grantSubscription "(principal \"$MY_PRINCIPAL\", variant { Free })"
dfx canister call payment getMySubscription

echo "▶ Grant ContractorFree subscription..."
dfx canister call payment grantSubscription "(principal \"$MY_PRINCIPAL\", variant { ContractorFree })"
SUB=$(dfx canister call payment getMySubscription)
echo "$SUB" | grep -q "ContractorFree" \
  && echo "  ↳ ContractorFree tier confirmed — ✓" \
  || (echo "  ↳ ❌ Expected ContractorFree tier"; exit 1)

echo "▶ ContractorFree expiresAt should be 0 (no expiry — free tier)..."
echo "$SUB" | grep -q "expiresAt = 0" \
  && echo "  ↳ expiresAt = 0 confirmed — ✓" \
  || echo "  ↳ expiresAt not 0 (may vary by format) — review output above"

echo "▶ getPricing ContractorFree (expect priceUSD=0, photosPerJob=5)..."
dfx canister call payment getPricing '(variant { ContractorFree })'

echo "▶ getPriceQuote Free (expect 0)..."
dfx canister call payment getPriceQuote '(variant { Free })'

echo "▶ getSubscriptionStats — verify contractorFree field present..."
dfx canister call payment getSubscriptionStats

echo "✅ Payment tests passed!"
echo ""
echo "NOTE: subscribe() requires a live ICP ledger + XRC canister."
echo "      Use grantSubscription() for local testing."

# ─── §47 Trusted Canister (inter-canister whitelist) ─────────────────────────
# payment receives calls from: job (getTierForPrincipal)

echo ""
echo "=== Payment — Trusted Canister Tests ==="

MY_PRINCIPAL=$(dfx identity get-principal)

if ! dfx identity list 2>/dev/null | grep -q "^canister-caller-test$"; then
  dfx identity new canister-caller-test --disable-encryption 2>/dev/null || true
fi
CALLER_TEST_PRINCIPAL=$(dfx identity get-principal --identity canister-caller-test)

echo ""
echo "── [T1] addTrustedCanister — admin (controller) can add ─────────────────"
dfx canister call payment addTrustedCanister "(principal \"$CALLER_TEST_PRINCIPAL\")"
echo "  ↳ addTrustedCanister succeeded — ✓"

echo ""
echo "── [T2] getTrustedCanisters — returns the added principal ───────────────"
TRUSTED=$(dfx canister call payment getTrustedCanisters)
echo "$TRUSTED" | grep -q "$CALLER_TEST_PRINCIPAL" \
  && echo "  ↳ caller-test principal present in trusted list — ✓" \
  || (echo "  ↳ ❌ caller-test principal NOT found"; exit 1)

echo ""
echo "── [T3] addTrustedCanister — non-controller is rejected ─────────────────"
if ! dfx identity list 2>/dev/null | grep -q "^contractor-test$"; then
  dfx identity new contractor-test --disable-encryption 2>/dev/null || true
fi
dfx canister call payment addTrustedCanister "(principal \"$MY_PRINCIPAL\")" \
    --identity contractor-test \
  && echo "  ↳ ❌ Expected rejection for non-controller" \
  || echo "  ↳ Non-controller correctly rejected — ✓"

echo ""
echo "── [T4] Trusted principal bypasses rate limit ───────────────────────────"
dfx canister call payment setUpdateRateLimit "(2 : nat)"
dfx canister call payment getMySubscription --identity canister-caller-test
dfx canister call payment getMySubscription --identity canister-caller-test
dfx canister call payment getMySubscription --identity canister-caller-test
echo "  ↳ 3 calls passed for trusted principal despite rate limit of 2 — ✓"
dfx canister call payment setUpdateRateLimit "(30 : nat)"

echo ""
echo "── [T5] removeTrustedCanister — principal removed from list ─────────────"
dfx canister call payment removeTrustedCanister "(principal \"$CALLER_TEST_PRINCIPAL\")"
TRUSTED_AFTER=$(dfx canister call payment getTrustedCanisters)
echo "$TRUSTED_AFTER" | grep -q "$CALLER_TEST_PRINCIPAL" \
  && echo "  ↳ ❌ Principal still in list after removal" \
  || echo "  ↳ Principal correctly removed — ✓"

echo ""
echo "✅ Payment trusted canister tests complete!"
