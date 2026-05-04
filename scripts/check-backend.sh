#!/usr/bin/env bash
# Prints ICP network + canister status before the frontend dev server starts.
# Always exits 0 — purely informational.

ENV_FILE=".env"
ICP_URL="http://localhost:4943"

if [ -t 1 ]; then
  GREEN="\033[32m"; YELLOW="\033[33m"; RED="\033[31m"; BOLD="\033[1m"; RESET="\033[0m"
else
  GREEN=""; YELLOW=""; RED=""; BOLD=""; RESET=""
fi

printf "\n${BOLD}── HomeGentic backend check ───────────────────────────────${RESET}\n"

# ── ICP network ───────────────────────────────────────────────────────────────
if curl -sf --max-time 2 "${ICP_URL}/api/v2/status" > /dev/null 2>&1; then
  printf "  ${GREEN}✓${RESET}  ICP network        running at %s\n" "$ICP_URL"
else
  printf "  ${RED}✗${RESET}  ICP network        not reachable — run: make start\n"
fi

# ── Canister IDs from .env ────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  printf "  ${RED}✗${RESET}  .env               not found — run: cp .env.example .env && make deploy\n"
  printf "${BOLD}───────────────────────────────────────────────────────────${RESET}\n\n"
  exit 0
fi

missing=0
while IFS='=' read -r key val; do
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  [[ "$key" != CANISTER_ID_* ]] && continue
  name=$(echo "$key" | sed 's/^CANISTER_ID_//' | tr '[:upper:]' '[:lower:]')
  val=$(echo "$val" | tr -d '[:space:]')
  if [ -n "$val" ]; then
    printf "  ${GREEN}✓${RESET}  %-18s %s\n" "$name" "$val"
  else
    printf "  ${YELLOW}–${RESET}  %-18s not deployed\n" "$name"
    missing=$((missing + 1))
  fi
done < "$ENV_FILE"

if [ "$missing" -gt 0 ]; then
  printf "\n  ${YELLOW}%d canister(s) missing — run: make deploy${RESET}\n" "$missing"
fi

printf "${BOLD}───────────────────────────────────────────────────────────${RESET}\n\n"
exit 0
