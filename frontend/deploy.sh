#!/usr/bin/env bash
set -euo pipefail

# Build React and deploy to the Nginx web root.
# Requires sudo to write /usr/local/var/www/kith

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

echo "Building frontend..."
npm run build

echo "Deploying to /usr/local/var/www/kith ..."
sudo mkdir -p /usr/local/var/www/kith
sudo cp -r dist/* /usr/local/var/www/kith/

echo "Done. Hard refresh your browser (Cmd+Shift+R)."
echo "Open: http://127.0.0.1:8000/posts/new"
