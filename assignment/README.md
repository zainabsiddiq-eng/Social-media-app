# Kith Backend (Django)

Django REST API for authentication, OTP verification, profiles, and social posts.

## Stack

- Django 6 + Django REST Framework
- JWT auth (`djangorestframework-simplejwt`)
- PostgreSQL
- Gmail SMTP (email OTP) / message service (WhatsApp OTP)
- CORS, OpenAPI docs (`drf-spectacular`)

## Setup

```bash
# from project root
source venv/bin/activate
cd assignment

# configure secrets
cp .env.example .env   # or create .env manually

python manage.py migrate
python manage.py runserver
```

Server: `http://127.0.0.1:8000`  
API docs: `http://127.0.0.1:8000/api/docs/`

## Environment (`.env`)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your@gmail.com

MESSAGE_SERVICE_API_KEY=your_key
MESSAGE_SERVICE_URL=https://your-service/messages/send
```

Update `DATABASES` in `assignment/settings.py` for your PostgreSQL credentials.

## Apps

| App | Role |
|-----|------|
| `app` | Register, OTP, login, edit unverified user |
| `posts` | Profile, posts, feed, likes, comments, follow |

## Auth endpoints

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/register/` | No |
| `POST` | `/api/verify-otp/` | No |
| `POST` | `/api/resend-otp/` | No |
| `POST` | `/api/login/` | No |
| `PATCH` | `/api/edit-user/` | No (unverified only) |

### Register body

```json
{
  "name": "Sundas",
  "email": "user@gmail.com",
  "phone": "+923001234567",
  "password": "YourPass1!",
  "delivery_method": "email"
}
```

### Login response

```json
{
  "message": "Login successful.",
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": { "id": 1, "name": "...", "email": "...", "phone": "..." }
}
```

Use header: `Authorization: Bearer <access>`

## Social endpoints (JWT required)

| Method | Path |
|--------|------|
| `GET` / `PUT` | `/api/profile/` |
| `POST` | `/api/posts/create/` |
| `GET` | `/api/posts/list/` |
| `GET` | `/api/posts/<uuid>/` |
| `PUT` | `/api/posts/<uuid>/update/` |
| `DELETE` | `/api/posts/<uuid>/delete/` |
| `GET` | `/api/feed/` |
| `POST` | `/api/posts/<uuid>/like/` |
| `POST` | `/api/posts/<uuid>/comment/` |
| `GET` | `/api/verified-users/` |
| `POST` | `/api/follow/<user_id>/` |

Profile update uses `multipart/form-data` for `profile_picture`.

## Notes

- Custom user model: email login, no `username` field
- OTP expires in 5 minutes; active OTP blocks resend until expiry
- Media files served from `/media/` in development
- CORS allows `http://localhost:5173` for the React frontend
