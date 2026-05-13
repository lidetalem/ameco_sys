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
