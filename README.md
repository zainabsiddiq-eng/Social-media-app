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

## License

Personal / assignment project — use and modify as needed.
