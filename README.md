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
- scaffolded queue modules that are not live yet

## Cross-Feature Sync

FitNova now links training, nutrition, and calorie tracking more tightly:
- active workout splits are passed into AI diet generation as structured context
- generated diet days can shift calories based on training-day versus recovery-day demand
- training days can include recovery-focused post-workout meals automatically
- the calorie tracker now explains whether today's target is coming from the active diet day, the active diet plan, or a workout-adjusted estimate
- the workout detail flow now points users directly into building a matching diet plan

## What Works Today

### Web app flows

- Sign up, sign in, refresh session, and log out
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
- `queue` scaffold
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

- Redis/BullMQ workers
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
|-- README.md
`-- TODO.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas or local MongoDB
- Gemini API key or OpenAI API key for AI flows

Optional for scaffold work only:
- Redis
- Stripe keys

### Backend setup

```bash
cd backend
npm install
npm run start:dev
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

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/v1/docs`

## Environment Notes

Create `.env.local` or `.env` files in both apps.

### Backend

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/fitnova

PORT=4000
APP_NAME=FitNova AI
APP_ORIGIN=http://localhost:5173,http://localhost:3000

JWT_ACCESS_SECRET=your_secure_access_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=your_secure_refresh_secret
JWT_REFRESH_TTL=30d
BCRYPT_SALT_ROUNDS=12

AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Optional OpenAI path
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview

# Optional queue scaffold
REDIS_ENABLED=false
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Optional billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
```

### Frontend

```env
VITE_API_URL=http://localhost:4000/api/v1
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
npx tsc --noEmit
npm run build
```

## Current Gaps

- Queue workers are scaffolded, not active
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

### Frontend can't reach API

- Check `VITE_API_URL`
- Verify backend is running on port `4000`
- Check CORS origin settings in backend config

### Auth problems

- Access tokens expire normally
- Refresh flow should restore the session
- If local state is corrupted, clear stored auth state and log in again

## Roadmap

The active roadmap lives in [TODO.md](./TODO.md).

## License

Private repository.
