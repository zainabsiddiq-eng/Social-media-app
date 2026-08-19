#!/usr/bin/env bash
set -euo pipefail

# Kith — systemd / systemctl helper (Linux only).
# Usage:
#   sudo bash deploy/systemctl.sh install
#   sudo bash deploy/systemctl.sh start|stop|restart|status|enable|disable
#   sudo bash deploy/systemctl.sh logs
#   sudo bash deploy/systemctl.sh reload-nginx
#
# Optional env:
#   PROJECT_ROOT=/var/www/djngopersonal_project
#   SERVICE_USER=www-data
#   WITH_CELERY=1

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "systemctl is for Linux. On macOS use launchctl instead:"
  echo "  launchctl list | grep -E 'gunicorn|nginx'"
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/systemctl.sh <command>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$REPO_ROOT}"
SERVICE_USER="${SERVICE_USER:-www-data}"
WITH_CELERY="${WITH_CELERY:-0}"

GUNICORN_UNIT="kith-gunicorn"
CELERY_UNIT="kith-celery"
NGINX_UNIT="nginx"

usage() {
  cat <<'EOF'
Kith systemctl script

Commands:
  install        Copy systemd units + Nginx site, enable and start services
  start          Start Gunicorn + Nginx (and Celery if WITH_CELERY=1)
  stop           Stop Gunicorn + Nginx (and Celery)
  restart        Restart Gunicorn + Nginx (and Celery)
  reload-nginx   Test and reload Nginx only
  status         Show service status
  logs           Follow Gunicorn logs (Ctrl+C to stop)
  enable         Enable services at boot
  disable        Disable services at boot
  help           Show this help

Examples:
  sudo bash deploy/systemctl.sh install
  sudo PROJECT_ROOT=/var/www/djngopersonal_project bash deploy/systemctl.sh install
  sudo WITH_CELERY=1 bash deploy/systemctl.sh start
  sudo bash deploy/systemctl.sh status
EOF
}

install_units() {
  if [[ ! -f "$PROJECT_ROOT/assignment/manage.py" ]]; then
    echo "Error: manage.py not found at $PROJECT_ROOT/assignment"
    exit 1
  fi

  echo "Project root: $PROJECT_ROOT"
  echo "Service user: $SERVICE_USER"

  mkdir -p /etc/systemd/system /etc/nginx/sites-available /etc/nginx/sites-enabled

  sed "s|/var/www/djngopersonal_project|$PROJECT_ROOT|g" \
    "$PROJECT_ROOT/deploy/systemd/kith-gunicorn.service" \
    > "/etc/systemd/system/${GUNICORN_UNIT}.service"

  sed "s|/var/www/djngopersonal_project|$PROJECT_ROOT|g" \
    "$PROJECT_ROOT/deploy/systemd/kith-celery.service" \
    > "/etc/systemd/system/${CELERY_UNIT}.service"

  if [[ -f /etc/nginx/sites-available/default || -d /etc/nginx/sites-enabled ]]; then
    sed "s|/var/www/djngopersonal_project|$PROJECT_ROOT|g" \
      "$PROJECT_ROOT/deploy/nginx/kith.linux.conf" \
      > /etc/nginx/sites-available/kith
    ln -sfn /etc/nginx/sites-available/kith /etc/nginx/sites-enabled/kith
    rm -f /etc/nginx/sites-enabled/default
  fi

  systemctl daemon-reload
  nginx -t
  enable_services
  start_services
  echo "Installed. Check: systemctl status ${GUNICORN_UNIT} ${NGINX_UNIT}"
}

enable_services() {
  systemctl enable "${GUNICORN_UNIT}" "${NGINX_UNIT}"
  if [[ "$WITH_CELERY" == "1" ]]; then
    systemctl enable "${CELERY_UNIT}"
  fi
}

disable_services() {
  systemctl disable "${GUNICORN_UNIT}" || true
  if [[ "$WITH_CELERY" == "1" ]]; then
    systemctl disable "${CELERY_UNIT}" || true
  fi
}

start_services() {
  systemctl start "${GUNICORN_UNIT}"
  systemctl start "${NGINX_UNIT}" || systemctl reload "${NGINX_UNIT}"
  if [[ "$WITH_CELERY" == "1" ]]; then
    systemctl start "${CELERY_UNIT}"
  fi
}

stop_services() {
  systemctl stop "${GUNICORN_UNIT}" || true
  if [[ "$WITH_CELERY" == "1" ]]; then
    systemctl stop "${CELERY_UNIT}" || true
  fi
}

restart_services() {
  systemctl restart "${GUNICORN_UNIT}"
  systemctl reload "${NGINX_UNIT}" || systemctl restart "${NGINX_UNIT}"
  if [[ "$WITH_CELERY" == "1" ]]; then
    systemctl restart "${CELERY_UNIT}"
  fi
}

reload_nginx() {
  nginx -t
  systemctl reload "${NGINX_UNIT}"
}

show_status() {
  systemctl --no-pager --full status "${GUNICORN_UNIT}" || true
  echo
  systemctl --no-pager --full status "${NGINX_UNIT}" || true
  if [[ "$WITH_CELERY" == "1" ]]; then
    echo
    systemctl --no-pager --full status "${CELERY_UNIT}" || true
  fi
}

show_logs() {
  journalctl -u "${GUNICORN_UNIT}" -u "${NGINX_UNIT}" -f
}

cmd="${1:-help}"
case "$cmd" in
  install) install_units ;;
  start) start_services ;;
  stop) stop_services ;;
  restart) restart_services ;;
  reload-nginx) reload_nginx ;;
  status) show_status ;;
  logs) show_logs ;;
  enable) enable_services ;;
  disable) disable_services ;;
  help|-h|--help) usage ;;
  *)
    echo "Unknown command: $cmd"
    usage
    exit 1
    ;;
esac
