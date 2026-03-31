# FitNova Mobile

Expo Router mobile client scaffold for FitNova AI.

This is a separate client from the web app.

The current repo structure is:

- `frontend/` for the web application
- `mobile/` for the Expo mobile application
- `backend/` for the shared API

## Included

- Expo Router app shell with auth stack and product tabs
- Zustand auth store backed by AsyncStorage
- Axios API client with token refresh support
- Dashboard screen wired to the real backend summary endpoint
- Placeholder screens for workouts, diet, coach, calories, and profile

## Environment

Set `EXPO_PUBLIC_API_URL` before running on a device or simulator.

You can copy from:

```bash
mobile/.env.example
```

Examples:

```bash
set EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1
```

For a physical device, use your machine's LAN IP instead of `10.0.2.2`.
