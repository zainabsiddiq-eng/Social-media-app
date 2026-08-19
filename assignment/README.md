# Kith — Social Auth & Posts Platform

Full-stack social app with **Django REST Framework** (backend) and **React + Vite** (frontend).

Users can register with email/WhatsApp OTP verification, log in with JWT, manage profiles, create posts, like, comment, and follow other users.

---

## Project structure

```
djngopersonal_project/
├── assignment/          # Django backend
│   ├── app/             # Auth, OTP, user edit
│   ├── posts/           # Profile, posts, feed, likes, comments, follow
│   ├── assignment/      # Settings, root URLs
│   └── .env             # Local secrets (not committed)
├── frontend/            # React (Vite) client — brand: Kith
├── deploy/              # Nginx, Gunicorn, launchd, systemd configs
│   ├── nginx/kith.conf
│   ├── gunicorn.conf.py
│   ├── launchd/com.assignment.gunicorn.plist
│   └── DEPLOY.md
└── venv/                # Python virtualenv
```

---

## Features

### Authentication (`app`)
- Register with name, email, phone, password, and OTP delivery method (`email` | `whatsapp`)
- Country-code phone input on signup (e.g. `+92`, `+91`)
- Verify OTP / resend OTP (5-minute expiry, cooldown while active)
- Edit unverified signup details (`PATCH /api/edit-user/`)
- Login with JWT (`access` + `refresh`)

### Social (`posts`)
- Get / update profile (name, phone, bio, profile picture)
- Create, list, retrieve, update, delete posts
- Feed (own posts + public posts from follow graph)
- Like / unlike toggle
- Comment on posts
- List verified users and follow / unfollow

### Frontend (Kith)
- Auth flow: register → verify OTP → login
- **My Post**, **All Posts**, People, Write, Alerts
- Settings menu: Edit Profile, Log out
- Like / Unlike, Edit / Remove on own posts

---

## Prerequisites

- Python 3.12+ (project tested with 3.14)
- Node.js 18+ (20+ recommended)
- PostgreSQL
- Redis (optional, for Celery)
- **Nginx** (production / reverse proxy)
- **Gunicorn** (production Django server)
- **launchctl** (macOS — keep services running at login)

---

## Backend setup

```bash
cd /path/to/djngopersonal_project
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install django djangorestframework djangorestframework-simplejwt
pip install django-cors-headers drf-spectacular python-dotenv
pip install psycopg2-binary pillow django-celery-beat
# plus any other packages already used in your venv
```

### Environment variables

Create `assignment/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password
DEFAULT_FROM_EMAIL=your@gmail.com

MESSAGE_SERVICE_API_KEY=your_whatsapp_api_key
MESSAGE_SERVICE_URL=https://your-message-service/messages/send
```

> Use a [Gmail App Password](https://myaccount.google.com/apppasswords) if sending OTP by email.

### Database

Update `assignment/assignment/settings.py` `DATABASES` if needed (default uses local PostgreSQL).

```bash
cd assignment
python manage.py migrate
python manage.py runserver
```

API base: `http://127.0.0.1:8000/api/`  
Swagger docs: `http://127.0.0.1:8000/api/docs/`

---

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

The Vite config proxies `/api` and `/media` to Django, and CORS allows `http://localhost:5173`.

Optional env in `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_MEDIA_URL=http://127.0.0.1:8000
```

---

## API overview

All authenticated routes need:

```http
Authorization: Bearer <access_token>
```

### Auth (no JWT)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/register/` | Create user + send OTP |
| `POST` | `/api/verify-otp/` | Verify account |
| `POST` | `/api/resend-otp/` | Resend OTP |
| `POST` | `/api/login/` | Get JWT tokens |
| `PATCH` | `/api/edit-user/` | Edit unverified signup details |

### Profile & social (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` / `PUT` | `/api/profile/` | View / update profile (`multipart` for picture) |
| `POST` | `/api/posts/create/` | Create post |
| `GET` | `/api/posts/list/` | List all posts |
| `GET` | `/api/posts/<uuid>/` | Post detail |
| `PUT` | `/api/posts/<uuid>/update/` | Update own post |
| `DELETE` | `/api/posts/<uuid>/delete/` | Delete own post |
| `GET` | `/api/feed/` | Personalized feed |
| `POST` | `/api/posts/<uuid>/like/` | Like / unlike toggle |
| `POST` | `/api/posts/<uuid>/comment/` | Add comment (`content`) |
| `GET` | `/api/verified-users/` | List verified users |
| `POST` | `/api/follow/<user_id>/` | Follow / unfollow toggle |

---

## Frontend routes

| Path | Page |
|------|------|
| `/register` | Sign up |
| `/verify-otp` | OTP verification |
| `/login` | Sign in |
| `/` | My Post (feed) |
| `/explore` | All Posts |
| `/posts/new` | Write post |
| `/posts/:id` | Post detail |
| `/posts/:id/edit` | Edit post |
| `/people` | Follow users |
| `/notifications` | Alerts (placeholder) |
| `/profile` | Edit profile |

---

## Typical auth flow

1. `POST /api/register/` with `delivery_method: "email"`
2. Enter OTP from email → `POST /api/verify-otp/`
3. `POST /api/login/` → store `access` token
4. Call protected APIs with `Authorization: Bearer …`

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Backend | Django 6, DRF, SimpleJWT, PostgreSQL, CORS, Spectacular |
| Frontend | React 18, Vite 5, React Router 6 |
| Email OTP | Gmail SMTP (app password) |
| WhatsApp OTP | External message service (env-configured) |

---

## Notes

- Custom user model uses **email** as `USERNAME_FIELD` (no `username` field).
- Access token lifetime: **120 minutes**; refresh: **7 days**.
- Profile picture uploads are stored under `assignment/media/`.
- Do not commit `.env` or real API keys / app passwords.

---

## Production deployment (macOS — launchctl + Nginx)

Deploy on Mac using **launchctl** (macOS service manager) and **Nginx**. Gunicorn and Nginx start automatically and restart if they crash.

### Architecture

```
Browser → Nginx :8000          (launchctl: homebrew.mxcl.nginx)
            ├── /              → /usr/local/var/www/kith (React build)
            ├── /api/          → Gunicorn :8001 → Django
            ├── /admin/        → Gunicorn :8001 → Django
            ├── /static/       → assignment/staticfiles/
            └── /media/        → assignment/media/

Gunicorn                       (launchctl: com.assignment.gunicorn)
```

| Service | launchctl label | Port |
|---------|-----------------|------|
| Nginx | `homebrew.mxcl.nginx` | 8000 |
| Gunicorn | `com.assignment.gunicorn` | 8001 |

App URL: **http://127.0.0.1:8000** or **http://192.168.16.47:8000**

---

### 1. Install dependencies

```bash
brew install nginx postgresql redis   # redis optional (Celery)
cd /Users/macbook/Desktop/djngopersonal_project
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment & Django setup

Create `assignment/.env` (see [Backend setup](#backend-setup)) and add:

```env
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.16.47
CSRF_TRUSTED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000,http://192.168.16.47:8000
CORS_ALLOWED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000,http://192.168.16.47:8000
```

```bash
cd assignment
python manage.py migrate
python manage.py collectstatic --noinput
```

### 3. Build & deploy frontend

```bash
cd frontend
npm install
npm run build

sudo mkdir -p /usr/local/var/www/kith
sudo cp -r dist/* /usr/local/var/www/kith/
```

Production env (`frontend/.env.production`):

```env
VITE_API_URL=/api
VITE_MEDIA_URL=
```

After frontend changes:

```bash
cd frontend && npm run build
sudo cp -r dist/* /usr/local/var/www/kith/
```

### 4. Nginx configuration

Edit `/usr/local/etc/nginx/nginx.conf` — add this server block inside the `http { }` block (see also `deploy/nginx/kith.conf`):

```nginx
server {
    listen 8000;
    server_name 192.168.16.47 localhost;

    location / {
        root /usr/local/var/www/kith;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /Users/macbook/Desktop/djngopersonal_project/assignment/staticfiles/;
    }

    location /media/ {
        alias /Users/macbook/Desktop/djngopersonal_project/assignment/media/;
    }
}
```

Test config:

```bash
sudo nginx -t
```

### 5. launchctl — Gunicorn service

Copy the plist to LaunchAgents and update paths if your project is not on the Desktop:

```bash
cp deploy/launchd/com.assignment.gunicorn.plist ~/Library/LaunchAgents/

launchctl load ~/Library/LaunchAgents/com.assignment.gunicorn.plist
```

Plist contents (`deploy/launchd/com.assignment.gunicorn.plist`):

- Runs Gunicorn on `127.0.0.1:8001`
- Working directory: `assignment/`
- Auto-starts at login (`RunAtLoad`)
- Restarts on crash (`KeepAlive`)
- Logs: `gunicorn.log` and `gunicorn-error.log` in project root

### 6. launchctl — Nginx service

Start Nginx via Homebrew services (creates `homebrew.mxcl.nginx` launch agent):

```bash
brew services start nginx
```

Or manually:

```bash
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.nginx.plist
```

Reload Nginx after config changes:

```bash
sudo nginx -t && sudo nginx -s reload
```

### 7. Manage services

```bash
# Check status
launchctl list | grep -E 'gunicorn|nginx'

# Gunicorn
launchctl start com.assignment.gunicorn
launchctl stop com.assignment.gunicorn
launchctl unload ~/Library/LaunchAgents/com.assignment.gunicorn.plist
launchctl load ~/Library/LaunchAgents/com.assignment.gunicorn.plist

# Nginx
brew services restart nginx
# or
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.nginx
```

View Gunicorn logs:

```bash
tail -f gunicorn.log gunicorn-error.log
```

### 8. Verify deployment

```bash
curl -I http://127.0.0.1:8000/
curl -I http://127.0.0.1:8000/api/docs/
```

| Check | Expected |
|-------|----------|
| `launchctl list \| grep gunicorn` | PID shown (running) |
| `launchctl list \| grep nginx` | PID shown (running) |
| `http://127.0.0.1:8000/` | React app (200) |
| `http://127.0.0.1:8000/api/docs/` | Swagger UI (200) |
| Gunicorn stopped | `/api/` returns 502 Bad Gateway |

### Troubleshooting

- **502 on `/api/`** — Check Gunicorn: `launchctl list com.assignment.gunicorn` and `tail gunicorn-error.log`
- **Connection refused on 8000** — Nginx not running: `brew services start nginx`
- **Blank page** — Rebuild frontend and copy to `/usr/local/var/www/kith`
- **Static/admin CSS missing** — Run `python manage.py collectstatic --noinput`
- **Service won't start after plist edit** — `launchctl unload` then `launchctl load` the plist again

---

## Local development (without launchctl)

For day-to-day coding, use the dev servers instead of launchctl:

```bash
# Terminal 1 — Django
cd assignment && source ../venv/bin/activate && python manage.py runserver

# Terminal 2 — React
cd frontend && npm run dev
```

App: `http://localhost:5173` (Vite proxies `/api` to Django)

---

## Production deployment (Linux — systemd)

Deploy on Linux with **systemctl** (no Docker). See **[deploy/DEPLOY.md](deploy/DEPLOY.md)** for full steps.

| Component | systemd unit |
|-----------|----------------|
| Django API (Gunicorn) | `kith-gunicorn.service` |
| Celery worker (optional) | `kith-celery.service` |
| Web server | `nginx` |

Quick overview:

```bash
# On the Linux server
pip install -r requirements.txt
python manage.py migrate && python manage.py collectstatic --noinput
cd frontend && npm install && npm run build

# Install and start with systemctl
sudo bash deploy/systemctl.sh install
sudo bash deploy/systemctl.sh status
```

Useful commands:

```bash
sudo bash deploy/systemctl.sh start
sudo bash deploy/systemctl.sh stop
sudo bash deploy/systemctl.sh restart
sudo bash deploy/systemctl.sh reload-nginx
sudo bash deploy/systemctl.sh logs
```

Or raw systemctl:

```bash
sudo systemctl status kith-gunicorn nginx
sudo systemctl restart kith-gunicorn
sudo systemctl reload nginx
sudo journalctl -u kith-gunicorn -f
```

Frontend production build uses `frontend/.env.production` so API calls go to `/api` on the same host.

---

## License

Personal / assignment project — use and modify as needed.
