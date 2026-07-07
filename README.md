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
