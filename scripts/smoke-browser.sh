#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || true)"
if [[ -z "$CHROME" ]]; then
  echo "Browser smoke requires Chrome or Chromium" >&2; exit 1
fi
./node_modules/.bin/vite preview --host 127.0.0.1 --port 4173 --strictPort >/tmp/skiplet-preview.log 2>&1 &
SERVER_PID=$!
ROOT_DOM="$(mktemp)"; INTERIOR_DOM="$(mktemp)"
trap 'kill "$SERVER_PID" 2>/dev/null || true; rm -f "$ROOT_DOM" "$INTERIOR_DOM"' EXIT
URL=http://127.0.0.1:4173/
for attempt in $(seq 1 40); do
  if curl -fsS "$URL" -o /dev/null; then break; fi
  sleep 0.25
done
curl -fsS "$URL" -o /dev/null
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-webgl --disable-software-rasterizer --disable-dev-shm-usage --virtual-time-budget=4000 --dump-dom "$URL" >"$ROOT_DOM" 2>/tmp/skiplet-chrome.log
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-webgl --disable-software-rasterizer --disable-dev-shm-usage --virtual-time-budget=4000 --dump-dom "$URL?perspective=01-opening&view=your-exposition" >"$INTERIOR_DOM" 2>>/tmp/skiplet-chrome.log
for term in 'aria-label="Choose a perspective"' 'Enter perspective' '2D fallback'; do
  grep -Fq "$term" "$ROOT_DOM" || { echo "Missing perspective feature: $term" >&2; exit 1; }
done
for term in 'Scenes inside this perspective' 'Perspective: Opening' 'Back to perspective carousel' 'Reveal Your exposition'; do
  grep -Fq "$term" "$INTERIOR_DOM" || { echo "Missing annotated view feature: $term" >&2; exit 1; }
done
echo "Browser smoke: outer carousel, direct view, gem annotations and software fallback verified"
