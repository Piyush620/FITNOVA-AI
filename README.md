<div align="center">
  <img
    src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:0B0B0B,55:00FF88,100:FF6B00&text=FitNova%20AI&fontColor=F7F7F7&fontSize=64&fontAlignY=38&desc=AI-Powered%20Fitness%20SaaS%20Platform&descAlignY=58&animation=fadeIn"
    alt="FitNova AI banner"
  />
</div>

<div align="center">
  <img
    src="https://readme-typing-svg.demolab.com?font=Orbitron&size=26&duration=3200&pause=700&color=00FF88&center=true&vCenter=true&width=900&lines=Train+Smarter.+Eat+Better.+Recover+Faster.;NestJS+%2B+MongoDB+%2B+AI+fitness+platform.;Calorie+tracking+and+coach+chat+included."
    alt="FitNova AI animated heading"
  />
</div>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-Backend-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Fastify-Server-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Gemini/OpenAI-AI-4285F4?style=for-the-badge" alt="AI" />
</p>

## Vision

FitNova AI is a fitness product that combines training plans, diet plans, progress tracking, calorie logging, and AI coaching in one web app.

This repository currently contains:
- a working NestJS + Fastify backend
- a working React web frontend
- working Stripe billing wiring backed by MongoDB persistence
- working BullMQ queue processing for heavyweight AI jobs

## Cross-Feature Sync

FitNova now links training, nutrition, and calorie tracking more tightly:
- active workout splits are passed into AI diet generation as structured context
- generated diet days can shift calories based on training-day versus recovery-day demand
- training days can include recovery-focused post-workout meals automatically
- the calorie tracker now explains whether today's target is coming from the active diet day, the active diet plan, or a workout-adjusted estimate
- the workout detail flow now points users directly into building a matching diet plan

## What Works Today

### Web app flows

- Sign up with email OTP verification, sign in, refresh session, and log out
- View a real dashboard with workout, diet, calorie, and progress summary data
- Generate, save, activate, view, restart, and progress workout plans
- Generate, save, activate, view, restart, and progress diet plans
- Open AI coach chat with saved history hydration
- Log meals in plain language, let AI estimate calories/macros, confirm, and save
- Review daily calorie totals and monthly calorie summaries
- Edit profile data and avatar details
- Sync diet planning and calorie tracking with the active workout split

### Backend modules

- `auth`
- `users`
- `workouts`
- `diet`
- `progress`
- `calorie-logs`
- `ai`
- `subscriptions`
- `queue`
- `system`

## Current Stack

### Backend

- NestJS 11
- Fastify
- MongoDB / Mongoose
- JWT auth with refresh-token flow
- Swagger docs
- Gemini or OpenAI provider support

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router v7
- Zustand
- Axios

### Still scaffold-only

- Mobile app

## API Quick Links

- API root: `http://127.0.0.1:4000/api/v1`
- Swagger docs: `http://127.0.0.1:4000/api/v1/docs`
- Health: `http://127.0.0.1:4000/api/v1/health`

## Project Structure

```text
FitNova AI/
|-- backend/
|   |-- src/
|   |   |-- common/
|   |   `-- modules/
|   |       |-- ai/
|   |       |-- auth/
|   |       |-- calorie-logs/
|   |       |-- diet/
|   |       |-- progress/
|   |       |-- queue/
|   |       |-- subscriptions/
|   |       |-- system/
|   |       |-- users/
|   |       `-- workouts/
|   |-- package.json
|   |-- Dockerfile
|   `-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- stores/
|   |   |-- test/
|   |   |-- types/
|   |   |-- App.tsx
|   |   `-- main.tsx
|   |-- package.json
|   `-- .env.example
|-- docker-compose.yml
|-- README.md
`-- TODO.md
```

## Getting Started

### Prerequisites

- Docker Desktop or Docker Engine with Compose
- Node.js 18+ and npm only if you also want to run parts of the stack outside Docker
- Gemini API key or OpenAI API key for AI flows

Optional for scaffold work only:
- Stripe keys
- PostgreSQL URL only if you extend the placeholder integration path

### Full Docker stack

The root `docker-compose.yml` now runs the full app stack:

- `frontend` on `http://localhost`
- `backend` on `http://localhost:4000/api/v1`
- Swagger docs on `http://localhost:4000/api/v1/docs`
- MongoDB on `mongodb://localhost:27017/fitnova-ai`
- Redis on `redis://localhost:6379`

Start everything:

```bash
docker compose up --build
```

Run detached if you prefer:

```bash
docker compose up --build -d
```

Stop the stack:

```bash
docker compose down
```

Remove containers plus named data volumes:

```bash
docker compose down -v
```

### Docker environment overrides

The compose file includes safe local defaults so the project can boot without extra files, but you should override secrets and provider keys before using real integrations.

Useful examples:
- [backend/.env.docker.example](/c:/Users/admin/Desktop/FitNova%20AI/backend/.env.docker.example)
- [frontend/.env.docker.example](/c:/Users/admin/Desktop/FitNova%20AI/frontend/.env.docker.example)

Compose reads variables from your shell or a root `.env` file automatically. Common overrides:

```env
JWT_ACCESS_SECRET=replace_this_with_a_real_secret
JWT_REFRESH_SECRET=replace_this_with_a_real_secret
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
# or
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
VITE_API_URL=/api/v1
```

### Infrastructure-only mode

If you only want MongoDB and Redis while running frontend/backend locally:

```bash
docker compose up -d mongodb redis
```

Stop the services with:

```bash
docker compose stop mongodb redis
```

### Backend setup

```bash
cd backend
npm install
npm run start:dev
```

### Backend container build

```bash
docker build -t fitnova-backend ./backend
docker run --env-file ./backend/.env -p 4000:4000 fitnova-backend
```

If the backend runs in Docker while MongoDB or Redis run on your host machine, do not leave `localhost` inside the backend container env file. Use host-reachable values such as:

```env
MONGODB_URI=mongodb://host.docker.internal:27017/fitnova-ai
REDIS_HOST=host.docker.internal
```

Available commands:

```bash
npm run build
npm run start:dev
npm run lint
npm test
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Available commands:

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run preview
```

### Local URLs

- Frontend: `http://localhost` in Docker, `http://localhost:5173` in local Vite dev
- Backend: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/v1/docs`

## Environment Notes

Use one root `.env` file for the Dockerized stack.

### Root `.env`

```env
NODE_ENV=production
PORT=4000
APP_NAME=FitNova AI
APP_ORIGIN=http://localhost
APP_TRUST_PROXY=true
SWAGGER_ENABLED=true
CORS_ALLOW_LOCALHOST=true

MONGODB_URI=mongodb://mongodb:27017/fitnova-ai

JWT_ACCESS_SECRET=your_secure_access_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=your_secure_refresh_secret
JWT_REFRESH_TTL=30d
BCRYPT_SALT_ROUNDS=12
EMAIL_VERIFICATION_OTP_TTL_MINUTES=10

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=FitNova AI <your_gmail_address@gmail.com>

AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Optional OpenAI path
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini

# Queue / Redis
REDIS_ENABLED=true
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DB=0

# Optional billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...

# Optional future relational integration
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/fitnova

# Rate limiting and logging
GLOBAL_RATE_LIMIT_TTL=60000
GLOBAL_RATE_LIMIT=100
AI_RATE_LIMIT_TTL=60000
AI_RATE_LIMIT=12
LOG_LEVEL=debug
LOG_TO_FILES=false
VITE_API_URL=/api/v1
```

If you run pieces outside Docker, adjust values such as:

```env
MONGODB_URI=mongodb://localhost:27017/fitnova-ai
REDIS_HOST=127.0.0.1
VITE_API_URL=http://localhost:4000/api/v1
APP_ORIGIN=http://localhost:5173,http://localhost:3000
APP_TRUST_PROXY=false
NODE_ENV=development
```

## Usage Notes

### Workout flow

1. Sign up or log in
2. Open `Workouts`
3. Generate an AI plan
4. Save it, activate it, and complete sessions from the detail screen

### Diet flow

1. Open `Diet`
2. If you want nutrition matched to training demand, activate a workout split first
3. Generate an AI diet plan using goal, food preference, timeline, and related inputs
4. FitNova uses the active workout split to shape day calories, recovery support, and post-workout meal timing when applicable
5. Save it, activate it, and mark meals complete from the detail screen

### AI coach flow

1. Open `AI Coach`
2. Ask a focused training, recovery, or diet question
3. Coach responses are stored and recent history is hydrated back into the page

### Calorie tracker flow

1. Open `Calories`
2. Describe what you ate in plain language
3. Let AI estimate calories and macros
4. Review the estimate
5. Save the entry
6. Check daily totals and monthly review cards
7. If an active diet day or workout day exists, the tracker target adjusts and explains the source directly in the UI

Manual calorie entry still exists as a fallback mode.

### Email verification flow

1. Open `Sign up`
2. Create the account with your email and password
3. Check your inbox for the 6-digit OTP
4. Open the verify screen and submit the OTP
5. After verification, FitNova creates the authenticated session and redirects to the dashboard

## Testing And Verification

### Backend

```bash
cd backend
npm test
npm run build
```

### Frontend

```bash
cd frontend
npm run lint
npm run test
npm run test:e2e
npm run test:e2e:live
npx tsc --noEmit
npm run build
```

`npm run test:e2e` runs the mocked browser journey.

`npm run test:e2e:live` runs the live local-stack smoke test and expects:

```bash
set FITNOVA_E2E_LIVE_EMAIL=your_test_user@example.com
set FITNOVA_E2E_LIVE_PASSWORD=your_test_password
```

Run it only when the backend and frontend are already running with reachable local services.

## Provider Setup Notes

### MongoDB

- Local Docker Compose default: `mongodb://localhost:27017/fitnova-ai`
- MongoDB Atlas also works if `MONGODB_URI` points to a reachable cluster
- If the backend fails early, verify MongoDB connectivity before debugging most other startup paths

### Redis / BullMQ

- Enable queue processing with `REDIS_ENABLED=true`
- Use `REDIS_HOST=127.0.0.1` and `REDIS_PORT=6379` for the provided local compose stack
- Workout plan saves, diet plan saves, and adaptive check-ins can run through BullMQ

### PostgreSQL

- `POSTGRES_URL` is currently optional and reserved for future relational integrations
- The current production-critical app flows do not require PostgreSQL

### Stripe

- Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, and `STRIPE_PRICE_YEARLY`
- Keep Stripe in test mode for local development
- Forward webhooks locally if you want end-to-end Stripe event testing:

```bash
stripe listen --forward-to localhost:4000/api/v1/subscriptions/webhook
```

### Gmail SMTP / OTP

- Set `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`
- For Gmail, use an App Password instead of your normal Gmail password
- Signups now depend on email delivery because account activation happens after OTP verification

## Current Gaps

- Backend integration coverage is still incomplete
- Broader frontend integration coverage is still incomplete
- Mobile app has not started

## Development Notes

- Update [TODO.md](./TODO.md) when scope changes
- Do not commit `.env` files
- Review Swagger docs for request/response shapes while building
- Use MongoDB connectivity first before debugging most backend startup issues

## Troubleshooting

### Backend won't start

- Check `MONGODB_URI`
- Check AI provider keys
- Verify port `4000` is free
- Leave `LOG_TO_FILES=false` unless you explicitly want local log files in `backend/logs`

### Frontend can't reach API

- Check `VITE_API_URL`
- In Docker, prefer `VITE_API_URL=/api/v1`
- Verify backend is running on port `4000`
- Check CORS origin settings in backend config

### Auth problems

- Access tokens expire normally
- Refresh flow should restore the session
- New signups must verify the 6-digit email OTP before first login
- For Gmail SMTP, use an App Password instead of your normal Gmail password
- If local state is corrupted, clear stored auth state and log in again

## Roadmap

The active roadmap lives in [TODO.md](./TODO.md).

## License

Private repository.
