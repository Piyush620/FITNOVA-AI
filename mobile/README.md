# FitNova Mobile

Expo Router mobile client for FitNova AI.

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
- Real backend-backed tabs for dashboard, workouts, diet, calories, coach, and profile
- Shared live calendar across workouts, diet, and calories
- Diet and workout day detail flows tied to the selected calendar date
- Premium-aware AI coach chat with persisted history hydration
- Meal logging and reminder-notification support
- Jest coverage for auth store, API refresh handling, login, and dashboard flows

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
