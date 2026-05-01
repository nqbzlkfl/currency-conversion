#!/usr/bin/env bash
# ============================================================================
# Currency Converter — Interactive setup script
#
# For each step:
#   1. Verify the requirement is met
#   2. If verified → skip with ✓
#   3. If not met → ask user (default Yes); on No, warn and continue
#
# Steps:
#   1. Node.js 22+ installed
#   2. Repo structure (server/ + client/) present
#   3. server/env/.env.local exists and is non-empty
#   4. OXR_APP_ID looks valid (32 hex chars)
#   5. client/env/.env.local exists and is non-empty
#   6. server/node_modules complete (.package-lock.json present)
#   7. client/node_modules complete (.package-lock.json present)
#
# Safe to re-run. Pressing Enter on any prompt accepts the recommended action.
# ============================================================================

set -euo pipefail

# ── Pretty output helpers ───────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

ok()      { printf "${GREEN}✓${NC}  %s\n" "$1"; }
skip()    { printf "${DIM}✓ skipped${NC}  %s\n" "$1"; }
warn()    { printf "${YELLOW}⚠${NC}  %s\n" "$1"; }
fail()    { printf "${RED}✗${NC}  %s\n" "$1"; }
ask()     { printf "${BLUE}?${NC}  %s" "$1"; }
heading() { printf "\n${BOLD}── %s ──${NC}\n" "$1"; }

# ── Tracking counters ───────────────────────────────────────────────────────
DONE_COUNT=0
SKIPPED_COUNT=0
USER_DECLINED_COUNT=0
FAILED_COUNT=0

# ── Helper: prompt with default Y ───────────────────────────────────────────
# Usage: confirm "Question text"
# Returns: 0 if yes (default), 1 if no
confirm() {
  local prompt="$1"
  local reply
  ask "$prompt [Y/n]: "
  read -r reply
  reply="${reply:-y}"  # default to Y on empty
  case "$reply" in
    [yY]|[yY][eE][sS]) return 0 ;;
    *) return 1 ;;
  esac
}

# ── Locate repo root ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
CLIENT_DIR="$SCRIPT_DIR/client"

printf "\n${BOLD}Currency Converter — Setup${NC}\n"
printf "${DIM}Repo: %s${NC}\n" "$SCRIPT_DIR"

# ============================================================================
# STEP 1: Node.js 22+ installed
# ============================================================================
heading "Step 1/7  Node.js 22+"

if command -v node >/dev/null 2>&1; then
  NODE_VERSION="$(node --version | sed 's/v//')"
  NODE_MAJOR="${NODE_VERSION%%.*}"

  if [[ "$NODE_MAJOR" -ge 22 ]]; then
    ok "Node $NODE_VERSION installed"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
  else
    fail "Node $NODE_VERSION found, but project requires Node 22+"
    warn "This script can't auto-install Node. Please install Node 22:"
    printf "    ${DIM}nvm install 22 && nvm use 22${NC}\n"
    printf "    ${DIM}# or download from https://nodejs.org${NC}\n"
    warn "Then re-run ./setup.sh"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    exit 1
  fi
else
  fail "Node.js is not installed"
  warn "Install Node 22 first:"
  printf "    ${DIM}nvm install 22 && nvm use 22${NC}\n"
  printf "    ${DIM}# or download from https://nodejs.org${NC}\n"
  FAILED_COUNT=$((FAILED_COUNT + 1))
  exit 1
fi

# ============================================================================
# STEP 2: Repo structure
# ============================================================================
heading "Step 2/7  Repo structure"

if [[ -d "$SERVER_DIR" && -d "$CLIENT_DIR" ]]; then
  ok "server/ and client/ directories present"
  SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
else
  fail "Expected server/ and client/ at $SCRIPT_DIR"
  warn "Run this script from the repo root."
  FAILED_COUNT=$((FAILED_COUNT + 1))
  exit 1
fi

# ============================================================================
# STEP 3: Server env file (server/env/.env.local)
# ============================================================================
heading "Step 3/7  Server environment file"

SERVER_ENV="$SERVER_DIR/env/.env.local"
SERVER_ENV_EXAMPLE="$SERVER_DIR/env/.env.example"

# Light validation: file exists AND is non-empty
if [[ -f "$SERVER_ENV" && -s "$SERVER_ENV" ]]; then
  ok "$SERVER_ENV exists"
  SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
else
  if [[ -f "$SERVER_ENV" ]]; then
    warn "$SERVER_ENV exists but is empty"
  else
    warn "$SERVER_ENV is missing"
  fi

  if [[ ! -f "$SERVER_ENV_EXAMPLE" ]]; then
    fail "Template missing: $SERVER_ENV_EXAMPLE — cannot recover"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    exit 1
  fi

  if confirm "Create it from .env.example?"; then
    cp "$SERVER_ENV_EXAMPLE" "$SERVER_ENV"
    ok "Created $SERVER_ENV"
    DONE_COUNT=$((DONE_COUNT + 1))
  else
    warn "Skipped. Backend won't start without this file."
    USER_DECLINED_COUNT=$((USER_DECLINED_COUNT + 1))
  fi
fi

# ============================================================================
# STEP 4: OXR_APP_ID validation
# ============================================================================
heading "Step 4/7  Open Exchange Rates App ID"

# Skip this step entirely if the env file doesn't exist (covered by step 3)
if [[ ! -f "$SERVER_ENV" ]]; then
  warn "Skipping — $SERVER_ENV doesn't exist (see step 3)"
  USER_DECLINED_COUNT=$((USER_DECLINED_COUNT + 1))
else
  CURRENT_OXR_ID="$(grep -E '^OXR_APP_ID=' "$SERVER_ENV" 2>/dev/null | head -n1 | cut -d'=' -f2- || echo "")"
  # Strip any quotes/whitespace
  CURRENT_OXR_ID="${CURRENT_OXR_ID//\"/}"
  CURRENT_OXR_ID="${CURRENT_OXR_ID//\'/}"
  CURRENT_OXR_ID="${CURRENT_OXR_ID// /}"

  # Validate: 32 lowercase hex chars (OXR App IDs follow this format)
  if [[ "$CURRENT_OXR_ID" =~ ^[a-f0-9]{32}$ ]]; then
    ok "OXR_APP_ID is set and looks valid"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
  else
    if [[ -z "$CURRENT_OXR_ID" ]]; then
      warn "OXR_APP_ID is empty"
    else
      warn "OXR_APP_ID doesn't match expected format (32 hex chars)"
    fi
    printf "    ${DIM}Get a free key: https://openexchangerates.org/signup/free${NC}\n"

    if confirm "Enter your OXR_APP_ID now?"; then
      ask "    Paste your App ID: "
      read -r USER_OXR_ID

      if [[ -n "$USER_OXR_ID" ]]; then
        # Portable in-place sed (macOS uses BSD sed, Linux uses GNU sed)
        if [[ "$OSTYPE" == "darwin"* ]]; then
          sed -i '' "s|^OXR_APP_ID=.*|OXR_APP_ID=$USER_OXR_ID|" "$SERVER_ENV"
        else
          sed -i "s|^OXR_APP_ID=.*|OXR_APP_ID=$USER_OXR_ID|" "$SERVER_ENV"
        fi
        ok "Saved OXR_APP_ID to $SERVER_ENV"
        DONE_COUNT=$((DONE_COUNT + 1))
      else
        warn "Empty input — skipped"
        USER_DECLINED_COUNT=$((USER_DECLINED_COUNT + 1))
      fi
    else
      warn "Skipped. Edit $SERVER_ENV manually before running the backend."
      USER_DECLINED_COUNT=$((USER_DECLINED_COUNT + 1))
    fi
  fi
fi

# ============================================================================
# STEP 5: Client env file (client/env/.env.local)
# ============================================================================
heading "Step 5/7  Client environment file"

CLIENT_ENV="$CLIENT_DIR/env/.env.local"
CLIENT_ENV_EXAMPLE="$CLIENT_DIR/env/.env.example"

if [[ -f "$CLIENT_ENV" && -s "$CLIENT_ENV" ]]; then
  ok "$CLIENT_ENV exists"
  SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
else
  if [[ -f "$CLIENT_ENV" ]]; then
    warn "$CLIENT_ENV exists but is empty"
  else
    warn "$CLIENT_ENV is missing"
  fi

  if [[ ! -f "$CLIENT_ENV_EXAMPLE" ]]; then
    fail "Template missing: $CLIENT_ENV_EXAMPLE — cannot recover"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    exit 1
  fi

  if confirm "Create it from .env.example?"; then
    cp "$CLIENT_ENV_EXAMPLE" "$CLIENT_ENV"
    ok "Created $CLIENT_ENV"
    DONE_COUNT=$((DONE_COUNT + 1))
  else
    warn "Skipped. Frontend will use built-in defaults but may behave unexpectedly."
    USER_DECLINED_COUNT=$((USER_DECLINED_COUNT + 1))
  fi
fi

# ============================================================================
# STEP 6 & 7: node_modules verification
# ============================================================================

# Helper: returns 0 if node_modules looks complete (has .package-lock.json)
verify_node_modules() {
  local dir="$1"
  [[ -d "$dir/node_modules" && -f "$dir/node_modules/.package-lock.json" ]]
}

# Helper: run npm install in a directory
run_npm_install() {
  local dir="$1"
  local label="$2"
  printf "    ${DIM}Running npm install in $label...${NC}\n"
  if ( cd "$dir" && npm install --no-fund --no-audit ); then
    ok "$label dependencies installed"
    DONE_COUNT=$((DONE_COUNT + 1))
    return 0
  else
    fail "npm install failed in $label"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    return 1
  fi
}

heading "Step 6/7  Server dependencies"

if verify_node_modules "$SERVER_DIR"; then
  ok "server/node_modules looks complete"
  SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
else
  if [[ -d "$SERVER_DIR/node_modules" ]]; then
    warn "server/node_modules exists but install looks incomplete"
  else
    warn "server/node_modules is missing"
  fi

  if confirm "Run 'npm install' in server/?"; then
    run_npm_install "$SERVER_DIR" "server"
  else
    warn "Skipped. Backend won't run until you 'cd server && npm install'."
    USER_DECLINED_COUNT=$((USER_DECLINED_COUNT + 1))
  fi
fi

heading "Step 7/7  Client dependencies"

if verify_node_modules "$CLIENT_DIR"; then
  ok "client/node_modules looks complete"
  SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
else
  if [[ -d "$CLIENT_DIR/node_modules" ]]; then
    warn "client/node_modules exists but install looks incomplete"
  else
    warn "client/node_modules is missing"
  fi

  if confirm "Run 'npm install' in client/?"; then
    run_npm_install "$CLIENT_DIR" "client"
  else
    warn "Skipped. Frontend won't run until you 'cd client && npm install'."
    USER_DECLINED_COUNT=$((USER_DECLINED_COUNT + 1))
  fi
fi

# ============================================================================
# Final summary
# ============================================================================
heading "Summary"

printf "  ${GREEN}✓${NC} Already done / skipped:  %d\n" "$SKIPPED_COUNT"
printf "  ${GREEN}✓${NC} Completed this run:      %d\n" "$DONE_COUNT"
if [[ "$USER_DECLINED_COUNT" -gt 0 ]]; then
  printf "  ${YELLOW}⚠${NC} Declined by user:        %d\n" "$USER_DECLINED_COUNT"
fi
if [[ "$FAILED_COUNT" -gt 0 ]]; then
  printf "  ${RED}✗${NC} Failed:                  %d\n" "$FAILED_COUNT"
fi
echo

if [[ "$USER_DECLINED_COUNT" -gt 0 || "$FAILED_COUNT" -gt 0 ]]; then
  printf "${YELLOW}${BOLD}Setup is incomplete.${NC} Address the warnings above, then re-run ./setup.sh\n\n"
  exit 1
fi

# All good — print next steps
printf "${GREEN}${BOLD}✓ Setup complete!${NC}\n\n"
printf "${BOLD}Next steps:${NC}\n"
printf "  1. Backend (terminal 1):   ${BLUE}cd server && npm run dev${NC}    → http://localhost:8800\n"
printf "  2. Frontend (terminal 2):  ${BLUE}cd client && npm run dev${NC}    → http://localhost:5173\n"
printf "  3. Open ${BLUE}http://localhost:5173${NC} in your browser\n\n"
printf "${BOLD}Run tests:${NC}\n"
printf "  Server:  ${BLUE}cd server && npm test${NC}\n"
printf "  Client:  ${BLUE}cd client && npm test${NC}\n\n"
