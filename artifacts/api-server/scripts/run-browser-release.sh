#!/bin/sh

set -u

frontend_pid=
api_pid=
release_status=1

cleanup() {
  status=$?
  trap - EXIT INT TERM

  for pid in "$api_pid" "$frontend_pid"; do
    if [ -n "$pid" ]; then
      kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    fi
  done
  sleep 0.5
  for pid in "$api_pid" "$frontend_pid"; do
    if [ -n "$pid" ]; then
      kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
    if [ -n "$pid" ]; then
      wait "$pid" 2>/dev/null || true
    fi
  done

  exit "$status"
}

trap cleanup EXIT INT TERM

frontend_url=${E2E_BASE_URL:-http://127.0.0.1:25721}
frontend_url="${frontend_url%/}/"

api_health_url=${E2E_API_HEALTH_URL:-}
if [ -z "$api_health_url" ]; then
  if [ -n "${E2E_BASE_URL:-}" ]; then
    api_health_url="${frontend_url%/}/api/healthz"
  else
    api_health_url="http://127.0.0.1:8080/api/healthz"
  fi
fi
api_health_url="${api_health_url%/}"
api_log="${TMPDIR:-/tmp}/piece-of-history-release-api.log"
frontend_log="${TMPDIR:-/tmp}/piece-of-history-release-frontend.log"

is_ready() {
  curl --fail --silent --show-error --max-time 1 "$1" >/dev/null 2>&1
}

uses_remote_services=0
case "$frontend_url" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) uses_remote_services=1 ;;
esac

if [ "$uses_remote_services" -eq 0 ]; then
  frontend_ready=0
  api_ready=0
  is_ready "$frontend_url" && frontend_ready=1
  is_ready "$api_health_url" && api_ready=1

  if [ "$api_ready" -eq 0 ]; then
    setsid env NODE_ENV=development PORT=8080 \
      pnpm --filter @workspace/api-server run dev >"$api_log" 2>&1 &
    api_pid=$!
  fi
  if [ "$frontend_ready" -eq 0 ]; then
    setsid env API_PROXY_TARGET=http://127.0.0.1:8080 BASE_PATH=/ PORT=25721 \
      pnpm --filter @workspace/piece-of-history run dev >"$frontend_log" 2>&1 &
    frontend_pid=$!
  fi
fi

deadline=$(($(date +%s) + 30))
while [ "$(date +%s)" -lt "$deadline" ]; do
  if is_ready "$frontend_url" && is_ready "$api_health_url"; then
    break
  fi
  sleep 0.25
done

pnpm run test:browser
release_status=$?
exit "$release_status"