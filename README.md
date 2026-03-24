<div align="center">
  <img
    src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:0B0B0B,55:00FF88,100:FF6B00&text=FitNova%20AI&fontColor=F7F7F7&fontSize=64&fontAlignY=38&desc=AI-Powered%20Fitness%20SaaS%20Platform&descAlignY=58&animation=fadeIn"
    alt="FitNova AI banner"
  />
</div>

<div align="center">
  <img
    src="https://readme-typing-svg.demolab.com?font=Orbitron&size=26&duration=3200&pause=700&color=00FF88&center=true&vCenter=true&width=900&lines=Train+Smarter.+Eat+Better.+Recover+Faster.;NestJS+%2B+MongoDB+%2B+AI+Fitness+Platform.;Built+for+premium+web+and+mobile+experiences."
    alt="FitNova AI animated heading"
  />
</div>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-Backend-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Fastify-Server-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/MongoDB-Primary%20Data-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/OpenAI-AI%20Layer-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Backend%20In%20Motion-00FF88?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/Theme-Dark%20Modern-0B0B0B?style=flat-square" alt="Theme" />
  <img src="https://img.shields.io/badge/Accent-FF6B00-FF6B00?style=flat-square" alt="Accent" />
</p>

## Vision

FitNova AI is a modern fitness SaaS platform designed to combine structured training, nutrition planning, progress tracking, and AI-powered coaching into one premium product experience.

The current repository contains the backend foundation with authentication, users, workouts, diet planning, system health, Swagger docs, and AI service scaffolding.

## Current Stack

- Backend: NestJS + Fastify + TypeScript
- Database: MongoDB Atlas
- Auth: JWT + refresh tokens + role-based guards
- AI: OpenAI integration scaffold with fallback-friendly architecture
- Queue: Redis + BullMQ base integration scaffold
- Docs: Swagger/OpenAPI

## Current Backend Modules

- `auth`
  JWT auth, refresh tokens, registration, login, current-user context
- `users`
  Profile read/update and dashboard summary endpoints
- `workouts`
  Workout plan creation, active plan lookup, plan activation, session completion
- `diet`
  Diet plan creation, active plan lookup, plan activation, meal completion
- `ai`
  Workout plan, diet plan, and coach chat endpoints
- `system`
  Root metadata and health endpoints
- `queue`
  Redis/BullMQ-ready queue service scaffold

## API Quick Links

- API root: `http://127.0.0.1:4000/api/v1`
- Swagger docs: `http://127.0.0.1:4000/api/v1/docs`
- Health: `http://127.0.0.1:4000/api/v1/health`

## Project Structure

```text
FitNova AI/
├─ backend/
│  ├─ src/
│  │  ├─ common/
│  │  └─ modules/
│  │     ├─ ai/
│  │     ├─ auth/
│  │     ├─ diet/
│  │     ├─ queue/
│  │     ├─ system/
│  │     ├─ users/
│  │     └─ workouts/
│  ├─ .env.example
│  ├─ package.json
│  └─ tsconfig.json
└─ README.md
```

## Getting Started

```bash
cd backend
npm install
npm run start:dev
```

Then open:

```text
http://127.0.0.1:4000/api/v1/docs
```

## Environment

Create `backend/.env` based on `backend/.env.example`.

Core variables:

```env
PORT=4000
APP_NAME=FitNova AI
APP_ORIGIN=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_TTL=30d
BCRYPT_SALT_ROUNDS=12
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
REDIS_ENABLED=false
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DB=0
```

## Built Features

- Secure auth system with JWT + refresh flow
- Protected user profile APIs
- Workout planning module with active-plan logic
- Diet planning module with meal completion tracking
- AI route scaffolding for future intelligent generation
- Swagger docs for easy testing
- `.gitignore` that excludes sensitive `.env` files

## Next Build Targets

- Progress tracking module
- Stripe subscription + PostgreSQL billing layer
- Frontend web app
- Mobile app with Expo
- Push notifications
- Adaptive AI recommendations

## Design Direction

- Background: `#0B0B0B`
- Primary: `#00FF88`
- Accent: `#FF6B00`
- Tone: premium, athletic, startup-grade

## Note

GitHub README files do not support true custom font installation, so the visual style here uses SVG banner assets and animated text to achieve that bold branded look while staying GitHub-compatible.
