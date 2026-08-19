# Deploy with systemd + Nginx (no Docker)

Use this on a **Linux server** (Ubuntu/Debian). `systemctl` is not available on macOS.

> **macOS:** use **launchctl + Nginx** instead — see the [README](../README.md#production-deployment-macos--launchctl--nginx).

---

## 1. Copy project to the server

Example path used below: `/var/www/djngopersonal_project`

```bash
sudo mkdir -p /var/www
sudo cp -r djngopersonal_project /var/www/
sudo chown -R www-data:www-data /var/www/djngopersonal_project
```

## 2. Python environment

```bash
cd /var/www/djngopersonal_project
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 3. Environment file

Edit `/var/www/djngopersonal_project/assignment/.env`:

```env
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

SECRET_KEY=generate-a-long-random-secret-key
ALLOWED_HOSTS=192.168.16.47,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=http://192.168.16.47
CORS_ALLOWED_ORIGINS=http://192.168.16.47

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your@gmail.com
```

## 4. Django setup

```bash
cd /var/www/djngopersonal_project/assignment
source ../venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
```

## 5. Build React frontend

```bash
cd /var/www/djngopersonal_project/frontend
npm install
npm run build
```

Production build output: `frontend/dist/` (served by Nginx).

## 6. Install systemd services (systemctl)

```bash
sudo bash deploy/systemctl.sh install
sudo bash deploy/systemctl.sh status
```

Other commands:

```bash
sudo bash deploy/systemctl.sh start
sudo bash deploy/systemctl.sh stop
sudo bash deploy/systemctl.sh restart
sudo bash deploy/systemctl.sh reload-nginx
sudo bash deploy/systemctl.sh logs
```

Optional Celery worker:

```bash
sudo WITH_CELERY=1 bash deploy/systemctl.sh install
```

## 7. Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

The `install` command in `deploy/systemctl.sh` copies `deploy/nginx/kith.linux.conf` to `/etc/nginx/sites-available/kith` and reloads Nginx.

Manual Nginx install (if you skip the script):

```bash
sudo cp /var/www/djngopersonal_project/deploy/nginx/kith.linux.conf /etc/nginx/sites-available/kith
sudo ln -sf /etc/nginx/sites-available/kith /etc/nginx/sites-enabled/kith
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

## 8. Verify

```bash
curl http://192.168.16.47/api/docs/
curl http://192.168.16.47/
```

Open in browser: `http://192.168.16.47`

## Useful commands

```bash
# Backend logs
sudo journalctl -u kith-gunicorn -f

# Celery logs
sudo journalctl -u kith-celery -f

# Restart after code changes
sudo systemctl restart kith-gunicorn
sudo systemctl reload nginx

# After frontend rebuild
cd /var/www/djngopersonal_project/frontend && npm run build
sudo systemctl reload nginx
```

## Architecture

```
Browser
   │
   ▼
Nginx :80
   ├── /              → frontend/dist (React)
   ├── /static/       → assignment/staticfiles
   ├── /media/        → assignment/media
   ├── /api/          → Gunicorn :8000 → Django
   └── /admin/        → Gunicorn :8000 → Django

systemd:
   kith-gunicorn.service  → Gunicorn
   kith-celery.service    → Celery worker (optional)
```

## Notes

- Do **not** use `runserver` in production; Gunicorn runs via systemd.
- Set `DEBUG=False` in settings (already set).
- Replace `192.168.16.47` with your domain or server IP in Nginx and `.env`.
- For HTTPS, add Certbot/Let's Encrypt and update `CSRF_TRUSTED_ORIGINS` to `https://...`.
