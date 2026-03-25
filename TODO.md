# FitNova AI TODO

## Current Status

- [x] Backend foundation with NestJS + Fastify
- [x] MongoDB Atlas connection
- [x] Auth module
- [x] Users module
- [x] Workouts module
- [x] Diet module
- [x] Swagger docs
- [x] GitHub repo setup
- [x] Gemini AI provider integrated and tested
- [ ] Frontend web app
- [ ] Mobile app
- [ ] Billing/subscriptions

## Next Decision

Choose one of these next:

- [ ] Build `progress` module
- [ ] Start `frontend` web app
- [ ] Store AI-generated plans into MongoDB
- [ ] Add `Stripe + PostgreSQL`
- [ ] Add `Redis + BullMQ` real job processing

## Recommended Next Order

### 1. Backend Core

- [ ] Build `progress` module
- [ ] Connect dashboard summary to real workout/diet/progress data
- [ ] Add pagination and better response shaping
- [ ] Add better error handling and logging polish

### 2. AI Layer

- [x] Decide AI strategy
- [x] Use `Gemini` for development
- [ ] Add fallback provider strategy if needed later
- [ ] Store generated workout/diet plans in MongoDB
- [ ] Add adaptive weekly recommendations

### 3. Payments

- [ ] Add PostgreSQL setup
- [ ] Create subscription tables
- [ ] Add Stripe checkout flow
- [ ] Add Stripe webhook handling
- [ ] Add premium feature gating

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

- [ ] Connect dashboard to real workout/diet/progress data
- [ ] Store AI-generated plans into workouts/diet collections
- [ ] README update with full API route list
- [ ] Postman collection or exported Swagger workflow
- [ ] Seed/demo data generator

## Notes

- `.env` must stay untracked
- Rotate exposed secrets before real deployment
- Keep MongoDB for product data
- Add PostgreSQL only when subscription/billing work starts
