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
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Fastify-Server-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Active%20Development-00FF88?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/Theme-Dark%20Modern-0B0B0B?style=flat-square" alt="Theme" />
  <img src="https://img.shields.io/badge/Accent-FF6B00-FF6B00?style=flat-square" alt="Accent" />
</p>

## Vision

FitNova AI is a modern fitness SaaS platform designed to combine structured training, nutrition planning, progress tracking, and AI-powered coaching into one premium product experience.

The current repository contains both backend and frontend applications for web access, with mobile coming soon.

## Current Stack

**Backend:**
- NestJS + Fastify + TypeScript
- MongoDB Atlas (primary database)
- PostgreSQL + Neon (subscriptions/billing)
- Redis + BullMQ (background jobs)
- JWT authentication with refresh tokens
- Gemini AI integration for coaching

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router v7 (routing)
- Zustand (state management)
- Axios (API client)

**Infrastructure:**
- Stripe (payments)
- MongoDB Atlas (NoSQL database)
- Neon PostgreSQL (relational database)

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
├─ backend/                    # NestJS + Fastify backend
│  ├─ src/
│  │  ├─ common/              # Shared utilities, configs, decorators
│  │  └─ modules/
│  │     ├─ ai/               # AI coaching and plan generation
│  │     ├─ auth/             # JWT auth + refresh tokens
│  │     ├─ diet/             # Diet planning module
│  │     ├─ progress/         # Progress tracking
│  │     ├─ queue/            # Background jobs (Redis/BullMQ)
│  │     ├─ subscriptions/     # Stripe + PostgreSQL billing
│  │     ├─ system/           # Health & metadata
│  │     ├─ users/            # User profiles & dashboard
│  │     └─ workouts/         # Workout planning module
│  ├─ database/               # Database schemas
│  ├─ package.json
│  └─ .env.example
│
├─ frontend/                   # React + TypeScript web app
│  ├─ src/
│  │  ├─ pages/              # Page components
│  │  ├─ components/         # Reusable components
│  │  ├─ services/           # API client
│  │  ├─ stores/             # Zustand state
│  │  ├─ hooks/              # Custom hooks
│  │  ├─ types/              # TypeScript types
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ tailwind.config.js
│  └─ .env.example
│
├─ README.md                   # This file
└─ TODO.md                    # Project roadmap
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas (cloud) or local MongoDB instance
- (Optional) Neon PostgreSQL for subscriptions
- (Optional) Redis for background jobs
- (Optional) Gemini or OpenAI API key for AI features

### Backend Setup

```bash
cd backend
npm install
npm run start:dev
```

**Available Commands:**
```bash
npm run build          # TypeScript build with alias resolution
npm start              # Run compiled backend
npm run start:dev      # Development mode with watch
npm run lint           # Fix ESLint issues
npm test               # Run Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:cov      # Generate coverage reports
```

**Access Points:**
- API root: `http://localhost:4000/api/v1`
- Swagger docs: `http://localhost:4000/api/v1/docs`
- Health check: `http://localhost:4000/api/v1/health`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Available Commands:**
```bash
npm run dev            # Start Vite dev server
npm run build          # Production TypeScript build
npm run lint           # Run ESLint checks
npm run preview        # Preview production build locally
```

**Access Point:**
- App: `http://localhost:5173`

### Environment Configuration

Create `.env.local` files in both directories (or `.env`). Examples provided in `.env.example` files.

## Environment Variables

### Backend Configuration (`backend/.env`)

**Database & Auth:**
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/fitnova
JWT_ACCESS_SECRET=your_secure_access_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=your_secure_refresh_secret
JWT_REFRESH_TTL=30d
BCRYPT_SALT_ROUNDS=12
```

**Application:**
```env
PORT=4000
APP_NAME=FitNova AI
APP_ORIGIN=http://localhost:3000,http://localhost:5173
```

**AI Provider (choose one):**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# OR
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview
```

**Optional - Queue & Cache (currently scaffold):**
```env
REDIS_ENABLED=false
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**Optional - Billing (not yet wired):**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
POSTGRES_URL=postgresql://user:password@localhost/fitnova
```

### Frontend Configuration (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api/v1
```

## Implemented Features

**✅ Backend:**
- Secure JWT authentication with refresh token rotation (15m access, 30d refresh)
- User profile management and dashboard aggregation
- Workout planning with plan activation and session tracking
- Diet planning with meal tracking
- Progress check-in history
- AI-powered coaching via Gemini/OpenAI
- Adaptive plan generation
- Coach chat with streaming responses
- Swagger API documentation
- Health check and system metadata endpoints
- Global exception handling and validation

**✅ Frontend:**
- React 19 with TypeScript strict mode
- Protected routes with authentication guards
- JWT token refresh interceptors
- Persistent auth state with localStorage
- Dashboard with aggregated user data
- Workout plan management with pagination
- Diet plan management with pagination
- AI-powered coaching chat
- Responsive dark-mode Tailwind design
- ESLint + TypeScript build pipeline
- Vite optimized dev experience

## Known Limitations & Roadmap

**Current Status:**
- ⚠️ Runtime QA in progress (see TODO.md)
- ⚠️ Billing enabled but not connected to Stripe
- ⚠️ Background jobs scaffolded but not activated
- ⚠️ Mobile app not started (coming post-launch)

**Priority Next Steps:**
1. Complete end-to-end runtime testing across all flows
2. Add structured logging and error tracking
3. Implement toast notifications for user feedback
4. Complete styling polish on detail pages
5. Add rate limiting and security hardening
6. Activate background job workers
7. Wire Stripe checkout and PostgreSQL billing
8. Add comprehensive test coverage

Full roadmap in [TODO.md](./TODO.md)

## Design Direction

- Background: `#0B0B0B`
- Primary: `#00FF88`
- Accent: `#FF6B00`
- Tone: premium, athletic, startup-grade

## Development & Testing

### Testing

**Backend Tests:**
```bash
cd backend
npm test              # Run all tests
npm run test:watch   # Watch mode with coverage
npm run test:cov     # Coverage report
```

**Frontend Tests:**
Unit and integration tests to be added.

### Code Quality

**Backend Linting:**
```bash
cd backend
npm run lint          # Run ESLint with automatic fixes
```

**Frontend Linting:**
```bash
cd frontend
npm run lint          # Run ESLint checks
```

### Type Checking

The project uses TypeScript strict mode. Ensure all code passes type checks:

**Backend:**
```bash
cd backend
npm run build         # Includes type checking
```

**Frontend:**
```bash
cd frontend
npm run build         # Includes type checking
```

## Deployment

### Docker Deployment

Backend includes a production-ready setup. Create a `Dockerfile` for each service:

```bash
# Backend
docker build -t fitnova-api .
docker run -p 4000:4000 --env-file .env fitnova-api

# Frontend (static hosting)
docker build -t fitnova-web .
docker run -p 3000:3000 fitnova-web
```

### Environment for Production

1. Use strong secrets for JWT tokens
2. Enable HTTPS (use reverse proxy like nginx)
3. Setup Redis for background jobs
4. Configure database backups
5. Enable webhook verification for Stripe

## Contributing

1. Follow the existing folder structure and naming conventions
2. Use TypeScript strict mode
3. Add tests for new features
4. Ensure linting passes before pushing
5. Update TODO.md if adding new work items

## Security Notes

- Never commit `.env` files (use `.env.example` templates)
- Keep dependencies updated: `npm audit fix`
- JWT secrets should be unique and strong (30+ characters)
- CORS configured for specific origins (update in backend config)
- Refresh tokens stored in secure cookies (production: httpOnly + Secure flags)

## Troubleshooting

**Backend won't start:**
- Check MongoDB connection string
- Verify port 4000 is available
- Ensure all env variables are set

**Frontend can't connect to API:**
- Check VITE_API_URL environment variable
- Verify backend is running on port 4000
- Check browser console for CORS errors

**JWT token errors:**
- Access tokens expire after 15 minutes (normal)
- Use refresh endpoint to get new access token
- Clear localStorage and login again if issues persist

**Missing dependencies:**
```bash
# Backend
cd backend && npm install && npm install --save-dev @types/node @nestjs/testing jest

# Frontend
cd frontend && npm install
```

## License

Private repository - contact team for access

## Support

For issues or questions:
1. Check [TODO.md](./TODO.md) for known issues
2. Review Swagger docs at `/api/v1/docs`
3. Check browser console for frontend errors
4. Review backend logs in console output

## Note

GitHub README files do not support true custom font installation, so the visual style here uses SVG banner assets and animated text to achieve that bold branded look while staying GitHub-compatible.
