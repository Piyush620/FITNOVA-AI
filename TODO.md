# FitNova AI TODO

## Current Status

- [x] Backend foundation with NestJS + Fastify
- [x] MongoDB Atlas connection
- [x] Auth module
- [x] Users module
- [x] Workouts module
- [x] Diet module
- [x] Progress module
- [x] Swagger docs
- [x] GitHub repo setup
- [x] Gemini AI provider integrated and tested
- [x] AI interaction history persistence
- [x] Adaptive AI endpoint
- [x] Real dashboard aggregation from backend data
- [x] Stripe + PostgreSQL + Redis scaffolding/config setup
- [ ] Frontend web app
- [ ] Mobile app
- [ ] Live billing integration

## Next Decision

Choose one of these next:

- [ ] Start `frontend` web app
- [ ] Store AI-generated workout and diet plans directly into collections
- [ ] Turn Stripe/PostgreSQL scaffolding into live billing
- [ ] Turn Redis/BullMQ scaffolding into live workers

## Recommended Next Order

### 1. Backend Core

- [x] Connect dashboard summary to real workout/diet/progress data
- [x] Add pagination and better response shaping
- [x] Add better error handling and logging polish

### 2. AI Layer

- [x] Decide AI strategy
- [x] Use `Gemini` for development
- [x] Store AI-generated interaction history in MongoDB
- [x] Add adaptive weekly recommendations
- [ ] Add fallback provider strategy if needed later
- [ ] Store generated workout/diet plans directly into workout and diet collections

### 3. Payments

- [x] Add PostgreSQL setup scaffolding
- [x] Create subscription tables
- [x] Add Stripe checkout flow scaffolding
- [x] Add Stripe webhook handling scaffolding
- [ ] Add premium feature gating
- [ ] Connect real Stripe SDK checkout session creation
- [ ] Persist subscriptions into PostgreSQL

### 4. Frontend

- [ ] Create `frontend/` React app
- [ ] Add Tailwind CSS
- [ ] Add shadcn/ui
- [ ] Add Framer Motion
- [ ] Build landing page
- [ ] Build login/signup
- [ ] Build dashboard
- [ ] Build workouts page
- [ ] Build diet page
- [ ] Build AI coach chat page

### 5. Mobile

- [ ] Create `mobile/` Expo app
- [ ] Add auth flow
- [ ] Add dashboard screen
- [ ] Add workout tracker
- [ ] Add diet tracker
- [ ] Add AI coach chat
- [ ] Add push notifications

### 6. DevOps

- [ ] Add Dockerfile for backend
- [ ] Add docker-compose setup
- [ ] Add environment docs
- [ ] Add deployment notes

## Immediate Candidate Tasks

- [ ] Store AI-generated plans into workouts/diet collections
- [ ] Test the latest AI save endpoints in Swagger
- [ ] Test subscriptions scaffold routes in Swagger
- [ ] Start `frontend` app scaffold
- [ ] README update with full API route list
- [ ] Postman collection or exported Swagger workflow
- [ ] Seed/demo data generator

## Backend Completion Checklist

Use this section as the final definition of "backend fully complete".

### Live Billing

- [ ] Integrate real Stripe SDK checkout session creation
- [ ] Verify Stripe webhook signatures with `STRIPE_WEBHOOK_SECRET`
- [ ] Handle subscription lifecycle events

### PostgreSQL Persistence

- [ ] Connect live PostgreSQL persistence using `POSTGRES_URL`
- [ ] Save Stripe customer records
- [ ] Save subscription records
- [ ] Update subscription status from webhook events

### Redis / BullMQ

- [ ] Add real BullMQ workers
- [ ] Process queued AI/background jobs
- [ ] Add retry handling and job failure logging

### AI Persistence

- [ ] Save structured AI workout plans directly into workout collections
- [ ] Save structured AI diet plans directly into diet collections
- [ ] Improve structured JSON parsing and validation safeguards

### Testing

- [ ] Add module-level tests
- [ ] Add integration tests
- [ ] Add end-to-end flow tests

### Production Hardening

- [ ] Add rate limiting
- [ ] Improve logging and monitoring hooks
- [ ] Finalize production secret handling
- [ ] Review CORS and deployment-safe config

### DevOps

- [ ] Add backend Dockerfile
- [ ] Add docker-compose setup
- [ ] Add deployment-ready environment documentation

## Notes

- `.env` must stay untracked
- Rotate exposed secrets before real deployment
- Keep MongoDB for product data
- Add PostgreSQL only when subscription/billing work starts
