# AMECO — Amhara Media Corporation
## Face Recognition Access Control System

---

## Project Structure

```
ameco/
├── backend/          ← Django REST + Channels + face-recognition
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   ├── ameco_project/     ← settings, urls, asgi, wsgi, celery
│   ├── authentication/    ← CustomUser, JWT login/logout
│   ├── admins/            ← AdminProfile CRUD
│   ├── guards/            ← GuardProfile CRUD
│   ├── staff/             ← StaffProfile CRUD
│   ├── visitors/          ← Visitor + VisitorRequest CRUD
│   ├── cameras/           ← GateWithCamera CRUD + power/status toggle
│   ├── recognition/       ← Face scan API + BiometricData + encoding cache
│   ├── notifications/     ← WebSocket consumer + Notification model
│   └── logs/              ← AccessLog + CSV export
│
└── frontend/         ← React 18 + Vite + Tailwind CSS v4
    ├── src/
    │   ├── App.jsx
    │   ├── services/      ← api.js (Axios), websocket.js
    │   ├── context/       ← Auth, Theme, Language, Notification
    │   ├── components/    ← Sidebar, TopBar, DataTable, Modal, CameraCapture, FaceScanOverlay, RegistrationForm, StatCard
    │   └── pages/
    │       ├── Login/
    │       ├── AdminDashboard/   ← Overview, Admins, Guards, Staff, Visitors, Cameras, Logs, Notifications, Settings
    │       └── GuardDashboard/   ← Overview, Visitors, Requests, Notifications, Settings
    └── ...
```

---

## Backend Setup

### 1. Prerequisites
- Python 3.10+
- PostgreSQL
- Redis
- `cmake` and C build tools (required by `face_recognition` / `dlib`)

### 2. Install system dependencies (Ubuntu/Debian)
```bash
sudo apt-get install -y cmake build-essential libopenblas-dev liblapack-dev \
  libx11-dev libgtk-3-dev libboost-python-dev python3-dev
```

### 3. Create virtual environment & install
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Configure environment
Copy `.env` and fill in your values:
```bash
cp .env .env.local
# Edit DB_PASSWORD, SECRET_KEY, REDIS_URL
```

### 5. Database setup
```bash
createdb ameco_db
python manage.py migrate
python manage.py createsuperuser
```

### 6. Run development servers

**Django (HTTP + WebSocket via Daphne):**
```bash
daphne -b 0.0.0.0 -p 8000 ameco_project.asgi:application
```

**Celery worker:**
```bash
celery -A ameco_project worker -l info
```

**Celery Beat (scheduled tasks — visitor expiry):**
```bash
celery -A ameco_project beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## Frontend Setup

### 1. Install
```bash
cd frontend
npm install
```

### 2. Environment (optional)
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

### 3. Run
```bash
npm run dev
# Opens at http://localhost:5173
```

---

## Default Login

After `createsuperuser`, log in at `/login` with your superuser credentials.
Set the `role` field to `admin` in Django admin → Users.

---

## Key API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/login/` | JWT login |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET  | `/api/auth/me/` | Current user info |
| GET/POST | `/api/admins/management/` | Admin profiles |
| GET/POST | `/api/guard/` | Guard profiles |
| GET/POST | `/api/staff/` | Staff profiles |
| GET/POST | `/api/temporary-users/profiles/` | Visitor profiles |
| GET/POST | `/api/temporary-requests/requests/` | Visitor requests |
| PATCH | `/api/temporary-requests/requests/{id}/update_status/` | Approve/Deny |
| GET/POST | `/api/camera/terminals/` | Gate cameras |
| PATCH | `/api/camera/terminals/{id}/toggle_power/` | Toggle power |
| PATCH | `/api/camera/terminals/{id}/toggle_status/` | Toggle maintenance |
| POST | `/api/recognition/scan/` | Face scan |
| POST | `/api/recognition/reload/` | Reload encoding cache |
| GET  | `/api/logs/history/` | Access logs (admin) |
| GET  | `/api/logs/export_csv/` | Download logs CSV |
| WS   | `ws://host/ws/notifications/{username}/` | Real-time events |

---

## Face Registration Flow

1. Register person (admin/guard/staff/visitor) via API with `face_scan_1..5_base64` fields
2. Backend saves `BiometricData`, calls `compute_and_store_encodings()`
3. Face encodings stored in DB (JSON) and loaded into in-memory cache
4. `POST /api/recognition/scan/` with `{ image: base64, camera_id: "TERM-001" }`
5. Returns `ACCEPTED | REJECTED | SPOOF_DETECTED | ATTEMPT_LIMIT_REACHED`

---

## WebSocket Events

| Event type | Direction | Description |
|-----------|-----------|-------------|
| `new_visitor_request` | Server → Admin | Guard submitted a request |
| `request_decision` | Server → Guard | Admin approved/denied |
| `camera_power` | Server → All | Camera power toggled |
| `camera_status` | Server → All | Camera status toggled |

---

## Production Notes

- Use `gunicorn` + `daphne` behind Nginx
- Set `DEBUG=False` and configure `ALLOWED_HOSTS`
- Use environment variables for all secrets
- Run `python manage.py collectstatic` before deployment
- Configure Celery Beat DB schedule via Django admin → Periodic Tasks