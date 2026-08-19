#!/usr/bin/env bash
set -euo pipefail

# Run on Linux as a user with sudo access.
# Usage: sudo bash deploy/install.sh

PROJECT_ROOT="${PROJECT_ROOT:-/var/www/djngopersonal_project}"
SERVICE_USER="${SERVICE_USER:-www-data}"

echo "Installing Kith with systemd + Nginx"
echo "Project root: $PROJECT_ROOT"

if [[ ! -f "$PROJECT_ROOT/assignment/manage.py" ]]; then
  echo "Error: manage.py not found at $PROJECT_ROOT/assignment"
  exit 1
fi

# Replace paths in systemd units for custom PROJECT_ROOT
sed "s|/var/www/djngopersonal_project|$PROJECT_ROOT|g" \
  "$PROJECT_ROOT/deploy/systemd/kith-gunicorn.service" \
  > /etc/systemd/system/kith-gunicorn.service

sed "s|/var/www/djngopersonal_project|$PROJECT_ROOT|g" \
  "$PROJECT_ROOT/deploy/systemd/kith-celery.service" \
  > /etc/systemd/system/kith-celery.service

sed "s|/var/www/djngopersonal_project|$PROJECT_ROOT|g" \
  "$PROJECT_ROOT/deploy/nginx/kith.conf" \
  > /etc/nginx/sites-available/kith

chown -R "$SERVICE_USER:$SERVICE_USER" "$PROJECT_ROOT"

cd "$PROJECT_ROOT"
sudo -u "$SERVICE_USER" "$PROJECT_ROOT/venv/bin/pip" install -r requirements.txt
sudo -u "$SERVICE_USER" bash -c "
  cd '$PROJECT_ROOT/assignment' &&
  source '$PROJECT_ROOT/venv/bin/activate' &&
  python manage.py migrate &&
  python manage.py collectstatic --noinput
"

cd "$PROJECT_ROOT/frontend"
npm install
npm run build

ln -sf /etc/nginx/sites-available/kith /etc/nginx/sites-enabled/kith
rm -f /etc/nginx/sites-enabled/default

systemctl daemon-reload
systemctl enable kith-gunicorn nginx
systemctl restart kith-gunicorn
systemctl restart nginx

echo "Done. Check: systemctl status kith-gunicorn nginx"
