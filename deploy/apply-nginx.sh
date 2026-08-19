#!/usr/bin/env bash
set -euo pipefail

# Apply Nginx config + latest frontend. Run with: sudo bash deploy/apply-nginx.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Copying frontend build to /usr/local/var/www/kith-app"
mkdir -p /usr/local/var/www/kith-app
cp -R "$ROOT/frontend/dist/." /usr/local/var/www/kith-app/
chmod -R a+rX /usr/local/var/www/kith-app

echo "Testing Nginx config"
nginx -t

echo "Reloading Nginx"
nginx -s reload

echo "Done."
echo "Open: http://127.0.0.1:8000/posts/new"
echo "Or:   http://127.0.0.1:8080/posts/new"
