# FitNova AI TODO

## Current Status

- [x] Backend foundation with NestJS + Fastify
- [x] MongoDB-backed modules for auth, users, workouts, diet, progress, and AI
- [x] Swagger docs and health/system endpoints
- [x] JWT auth with refresh-token flow
- [x] Dashboard aggregation from real workout, diet, and progress data
- [x] AI history persistence and coach chat backend
- [x] AI generate-and-save endpoints for workouts and diet
- [x] Frontend routing, protected routes, auth store, and API client
- [x] Landing, login, signup, dashboard, workouts, diet, and coach pages
- [x] Workouts connected to real backend data and actions
- [x] Diet connected to real backend data and actions
- [x] Coach chat connected to real backend AI
- [x] AI generate-and-save flow for workouts
- [x] AI generate-and-save flow for diet
- [x] Pagination on workout and diet plan lists
- [x] Shared frontend component refactor with cleaner shadcn-style patterns
- [x] Landing page rebuilt with cleaner layout, spacing, and CTA hierarchy
- [x] Tailwind frontend styling pipeline fixed so utilities generate correctly
- [x] Shared card styles corrected to render proper dark translucent surfaces
- [x] Frontend TypeScript, lint, and build passing
- [ ] End-to-end runtime QA across all main user flows
- [ ] Billing is still scaffold-only
- [ ] Queue workers are still scaffold-only
- [ ] Mobile app not started

## What Is Actually Done

### Backend

- [x] Auth: register, login, refresh, current user
- [x] Users: get profile, update profile, dashboard snapshot
- [x] Workouts: list plans, active plan, get by id, activate plan, complete session
- [x] Diet: list plans, active plan, get by id, activate plan, complete meal
- [x] Progress: check-ins and history
- [x] AI: status, history, workout generation, diet generation, coach chat, adaptive plan, queue endpoint
- [x] AI structured save for workout plans
- [x] AI structured save for diet plans

### Frontend

- [x] Real auth flow wiring
- [x] Dashboard connected to backend summary
- [x] Workout plans page with pagination, activation, completion, deep-linking, and AI create/save
- [x] Diet plans page with pagination, activation, meal completion, deep-linking, and AI create/save
- [x] Coach chat page with live AI responses
- [x] Shared button, input, card, pagination, and layout refactor
- [x] Consistent hover behavior for shared buttons
- [x] Landing page visual redesign and footer cleanup
- [x] Tailwind source detection / utility generation fixed

## Remaining High-Priority Work

### 1. Runtime QA

- [ ] Test signup end to end against live backend
- [ ] Test login and refresh-token behavior
- [ ] Test protected route behavior after token expiry
- [ ] Test dashboard with real seeded data
- [ ] Test workout AI generate/save -> activate -> complete-day flow
- [ ] Test diet AI generate/save -> activate -> complete-meal flow
- [ ] Test coach chat with realistic prompts and error states

### 2. Frontend Polish

- [ ] Finish visual refactor for dashboard, workouts, and diet detail sections where older styling still remains
- [ ] Do one more landing-page polish pass for typography scale and section density after live review
- [ ] Replace remaining native `select` styling with a shared select pattern
- [ ] Improve empty-state copy and guidance on dashboard
- [ ] Add success feedback/toasts for activate, complete, and generate actions
- [ ] Add skeleton/loading polish where appropriate

### 3. AI Product Layer

- [ ] Test AI responses with a wider range of real payloads in Swagger and UI
- [ ] Improve validation/guardrails for malformed AI structured output
- [ ] Decide whether coach chat should support conversation threads or message history hydration

### 4. Billing

- [ ] Connect real Stripe SDK checkout session creation
- [ ] Persist customers/subscriptions to PostgreSQL
- [ ] Verify Stripe webhook signatures
- [ ] Update subscription status from webhook events
- [ ] Add premium feature gating in backend and frontend

### 5. Queue / Async Jobs

- [ ] Turn queue scaffold into real BullMQ workers
- [ ] Add retry and failure logging
- [ ] Decide which AI flows should be queued versus synchronous

### 6. Testing and Hardening

- [ ] Add backend integration tests for auth, users, workouts, diet, and AI
- [ ] Add frontend smoke/integration tests for auth and protected flows
- [ ] Add rate limiting and security hardening
- [ ] Improve logging and monitoring
- [ ] Review production-safe CORS and environment handling

### 7. DevOps and Docs

- [ ] Add backend Dockerfile
- [ ] Add `docker-compose` if local services are needed
- [ ] Update README to match the actual app status and frontend architecture
- [ ] Verify `.env.example` coverage and variable names
- [ ] Add setup notes for MongoDB, PostgreSQL, Redis, and Stripe

### 8. Mobile

- [ ] Create `mobile/` Expo app
- [ ] Add auth flow
- [ ] Add dashboard/workout/diet/coach screens
- [ ] Add notifications once backend flows are stable

## Immediate Candidate Tasks

- [ ] Run full manual QA with backend + frontend running together
- [ ] Clean up older styling in dashboard/workout/diet detail views to fully match the refactored landing/auth/chat screens
- [ ] Add shared `Select` and `Textarea` components in the same design system style
- [ ] Add toasts or inline success states for plan actions
- [ ] Test subscriptions scaffold routes in Swagger
- [ ] Update README screenshots or usage notes

## Definition Of "Web App Ready"

- [ ] User can sign up, sign in, refresh session, and log out reliably
- [ ] Dashboard loads real summary data
- [ ] User can generate, save, activate, view, and progress workout plans
- [ ] User can generate, save, activate, view, and progress diet plans
- [ ] User can send and receive real coach chat messages
- [ ] Protected routes behave correctly on auth loss
- [ ] Main web flows have been manually QA tested against live backend

## Definition Of "Backend Production Ready"

- [ ] Stripe billing is live, verified, and persisted
- [ ] PostgreSQL persistence is real, not scaffold-only
- [ ] Redis/BullMQ workers are real, not scaffold-only
- [ ] Integration tests cover critical flows
- [ ] Secrets, CORS, and environment handling are production-safe
- [ ] Logging and failure paths are observable

## Known Blockers / Scope Notes

- There is currently no `course` or `usercourse` module in this repository
- Real-time course progress/Q&A cannot be implemented here until that backend model and API surface exist
- Billing and queue modules exist in the codebase, but they are still scaffolds rather than live product features
- The recent landing-page redesign fixed the worst visual issues, but dashboard/workout/diet screens still need a final consistency pass
- `.env` files should remain untracked
