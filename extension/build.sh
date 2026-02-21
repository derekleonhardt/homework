#!/bin/bash
# Build extension for Chrome or Firefox (local-only mode).

set -euo pipefail

BROWSER=${1:-chrome}
DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ "$BROWSER" != "chrome" && "$BROWSER" != "firefox" ]]; then
  echo "Usage: ./build.sh [chrome|firefox]" >&2
  exit 1
fi

if [[ "$BROWSER" == "chrome" ]]; then
  cp "$DIR/manifest.chrome.json" "$DIR/manifest.json"
else
  cp "$DIR/manifest.firefox.json" "$DIR/manifest.json"
fi

cp "$DIR/config.example.js" "$DIR/config.js"

echo "Built for $BROWSER"
echo "APP_URL=http://localhost:3000"
echo "API_URL=http://localhost:3000/api/ingest"
