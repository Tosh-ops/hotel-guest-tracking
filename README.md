# Hotel Guest Tracking

A Django-based hotel management API with JWT authentication, role-based permissions, room management, guest tracking, check-in/check-out workflows, service requests, and reporting endpoints.

## Features

- JWT authentication with `djangorestframework-simplejwt`
- Role-based access control for receptionists, housekeeping, and managers
- CRUD APIs for rooms, guests, check-ins, check-outs, and service requests
- Report endpoints for occupancy, revenue, room status, and health check
- Django REST Framework filtering, search, and ordering support

## Setup

```bash
python -m venv .venv
source .venv/Scripts/activate   # Windows PowerShell
# or `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## API Routes

- `api/accounts/`
- `api/hotel/`
- `api/reports/`
- `api/token/`
- `api/token/refresh/`

## Notes

- Make sure `django_filters` is installed and configured for filtering support
- Use `TokenObtainPairView` and `TokenRefreshView` for JWT auth
- Reports are manager-only endpoints

## Frontend

`index.html` / `app.js` / `style.css` make up a single-page frontend that talks to this
API directly (no build step — just static files). It has three role-based dashboards
(Receptionist, Housekeeping, Manager), a live room-status board, and offline queuing for
room-status and service-request updates.

### Running the full demo locally

```bash
# terminal 1 — backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo      # creates demo users + rooms
python manage.py runserver

# terminal 2 — frontend
python -m http.server 5500      # serves index.html at http://localhost:5500
```

Open `http://localhost:5500`, and log in with any of the seeded accounts
(password `demo1234` for all): `reception1`, `housekeeping1`, `manager1`.

If you deploy the backend somewhere (Render, Railway, etc), update `CONFIG.API_BASE`
at the top of `app.js` to point at the deployed URL, then redeploy the static frontend
(e.g. to Vercel) as usual.
