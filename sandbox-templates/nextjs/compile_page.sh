#!/usr/bin/env bash
set -euo pipefail

# Config
export NEXT_TELEMETRY_DISABLED=1
PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"
APP_DIR="/home/user/nextjs-app"
URL="http://localhost:${PORT}"

echo "[setup] Using APP_DIR=${APP_DIR}, PORT=${PORT}, HOST=${HOST}"

ping_server() {
  local url="$1"
  local counter=0
  local code=000

  echo "[ping] Waiting for server at ${url} ..."
  # Try up to ~120s (600 * 0.2s); adjust if you want
  while true; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
    if [[ "$code" == "200" ]]; then
      echo "[ping] Server is up (HTTP 200)."
      break
    fi

    ((counter++))
    if (( counter % 10 == 0 )); then
      echo "[ping] Still waiting... (last code: ${code})"
    fi
    sleep 0.2
  done
}

# Start the pinger in background so the first page gets compiled
ping_server "${URL}" &

# Move into app and ensure deps exist
cd "${APP_DIR}"

if [[ -f package-lock.json ]]; then
  echo "[deps] Installing with npm ci"
  npm ci
else
  echo "[deps] Installing with npm install"
  npm install
fi

# Safety: ensure next is available
if ! npx --yes next --version >/dev/null 2>&1; then
  echo "[deps] Installing next (fallback)"
  npm install next@latest
fi

# Dev server with turbopack (bind to 0.0.0.0 so sandbox can reach it)
echo "[start] Launching Next dev server..."
exec npx next dev --turbopack -p "${PORT}" -H "${HOST}"
