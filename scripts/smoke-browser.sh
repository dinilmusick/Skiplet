#!/usr/bin/env bash
set -euo pipefail

CHROME="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || true)"
if [[ -z "$CHROME" ]]; then
  echo "Browser smoke test requires Chromium/Chrome on the runner" >&2
  exit 1
fi

./node_modules/.bin/vite preview --host 127.0.0.1 --port 4173 --strictPort > /tmp/skiplet-preview.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

URL="http://127.0.0.1:4173/"
for attempt in $(seq 1 40); do
  if curl -fsS "$URL" -o /dev/null; then break; fi
  sleep 0.25
done
curl -fsS "$URL" -o /dev/null

DOM_FILE="$(mktemp)"
trap 'kill "$SERVER_PID" 2>/dev/null || true; rm -f "$DOM_FILE"' EXIT
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-webgl \
  --disable-software-rasterizer --disable-dev-shm-usage \
  --virtual-time-budget=4000 --dump-dom "$URL" > "$DOM_FILE" 2>/tmp/skiplet-chrome.log

if ! grep -Fq 'aria-label="Chapter 1: Opening"' "$DOM_FILE"; then
  echo "React chapter carousel failed to render generated exposition page" >&2
  cat /tmp/skiplet-chrome.log >&2
  exit 1
fi
if ! grep -Fq 'role="tablist"' "$DOM_FILE"; then
  echo "Chapter navigation tabs were not rendered" >&2
  exit 1
fi
if ! grep -Fq '01 — Opening' "$DOM_FILE"; then
  echo "Chapter Markdown heading did not render" >&2
  exit 1
fi
if ! grep -Fq '2D fallback' "$DOM_FILE"; then
  echo "WebGL-disabled browser did not show the accessible fallback" >&2
  exit 1
fi
echo "Browser smoke: generated Markdown page, carousel controls and WebGL fallback verified"
