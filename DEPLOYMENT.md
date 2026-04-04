# FitNova AI Deployment Guide

## What is ready

- Backend Docker image in [backend/Dockerfile](/c:/Users/admin/Desktop/FitNova%20AI/backend/Dockerfile)
- Frontend Docker image in [frontend/Dockerfile](/c:/Users/admin/Desktop/FitNova%20AI/frontend/Dockerfile)
- Full local stack orchestration in [docker-compose.yml](/c:/Users/admin/Desktop/FitNova%20AI/docker-compose.yml)
- Root environment template in [.env.example](/c:/Users/admin/Desktop/FitNova%20AI/.env.example)
- CI workflow in [.github/workflows/quality.yml](/c:/Users/admin/Desktop/FitNova%20AI/.github/workflows/quality.yml)

## Recommended production shape

Use one Linux VM or container host with:

- Docker Engine + Compose
- A public domain for the web app
- A public API domain or subpath for the backend
- Managed MongoDB or a secured MongoDB instance
- Managed Redis or a secured Redis instance
- SMTP credentials for OTP emails
- Stripe production keys and webhook secret
- One AI provider key: Gemini or OpenAI

Suggested layout:

- `app.example.com` for the web frontend
- `api.example.com` for the backend API
- Mobile app `EXPO_PUBLIC_API_URL=https://api.example.com/api/v1`

## Production env file

Create a root `.env` from [.env.example](/c:/Users/admin/Desktop/FitNova%20AI/.env.example) and replace placeholders.

Minimum values you must set before a real deployment:

- `APP_ORIGIN`
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `AI_PROVIDER`
- `GEMINI_API_KEY` or `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_YEARLY`
- `VITE_API_URL`
- `EXPO_PUBLIC_API_URL`

## Web/backend deploy with Docker

1. Copy the repo to the server.
2. Copy `.env.example` to `.env` and fill production secrets.
3. Point `MONGODB_URI` and Redis settings at production services.
4. Build and start the stack:

```bash
docker compose up --build -d
```

5. Confirm health:

- Frontend: `http://your-domain/`
- Backend health: `http://your-api/api/v1/health`
- Swagger: `http://your-api/api/v1/docs`

## Reverse proxy and TLS

In production, put TLS in front of the containers with one of:

- Nginx Proxy Manager
- Caddy
- Traefik
- Cloudflare Tunnel plus origin certs

Requirements:

- Forward frontend traffic to the `frontend` service
- Forward backend traffic to the `backend` service on port `4000`
- Preserve `X-Forwarded-*` headers
- Set `APP_ORIGIN` to the public web origin

## Stripe webhook

Create a production webhook endpoint that targets:

```text
https://api.example.com/api/v1/subscriptions/webhook
```

Then set:

- `STRIPE_WEBHOOK_SECRET`
- production `STRIPE_PRICE_MONTHLY`
- production `STRIPE_PRICE_YEARLY`

## Mobile release requirements

The Expo mobile app is separate from Docker deployment. Before building a mobile release:

- set `EXPO_PUBLIC_API_URL` to the public backend URL
- confirm backend CORS/origin settings match your web origin
- confirm OTP email and Stripe flows work against production services

Typical mobile build commands:

```bash
cd mobile
npm install
npx expo start
```

If you want store builds, the next step is wiring EAS credentials and profiles.

## Final pre-launch checklist

- Backend tests pass
- Frontend tests pass
- Mobile tests pass
- Frontend production build passes
- Production secrets are set
- MongoDB and Redis are reachable from the server
- SMTP sends real OTP mail
- Stripe webhook receives live events
- Mobile app points to the public API

## What still needs your input

I can finish the actual deployment execution once you provide:

- the deployment target: VPS, Render, Railway, Fly.io, ECS, etc.
- domain names
- production secrets
- whether you want mobile store builds now or only web/backend deployment first
