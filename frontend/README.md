# Kith frontend

React (Vite) client for the Django social API.

## Run

```bash
# terminal 1 — Django
cd assignment
python manage.py runserver

# terminal 2 — React
cd frontend
npm run dev
```

Open http://localhost:5173

## Pages

- `/register` → `/verify-otp` → `/login`
- `/` feed
- `/explore` all posts
- `/posts/new` create post
- `/posts/:id` detail, like, comment, delete
- `/people` follow verified users
- `/profile` view/edit profile + picture

API base defaults to `http://127.0.0.1:8000/api`.
Override with `VITE_API_URL` if needed.
