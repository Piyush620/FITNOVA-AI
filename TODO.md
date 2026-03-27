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
- [x] Backend local Fastify startup fixed for exception handling, request logging, and Redis-disabled queue boot
- [x] Backend build and targeted auth/users unit tests passing
- [x] Frontend protected-route Vitest coverage added and passing
- [x] End-to-end runtime QA across all main user flows
- [x] Delete actions added for workout and diet plans
- [x] Completed workout/diet plans can be restarted as fresh active cycles
- [x] Gender is captured in signup and used in AI workout/diet generation context
- [x] Age is captured in signup and used in AI generation context
- [x] Workout AI generator supports training-days-per-week input
- [x] Dedicated profile page with editable profile data and avatar support
- [x] Header profile/avatar links into the profile screen
- [x] Diet detail view upgraded with calorie/macro summaries and clearer day progress
- [x] Dashboard and workout detail views received a consistency polish pass
- [x] Shared `Textarea` component added and wired into profile/coach flows
- [x] Frontend smoke coverage added for header profile navigation and profile page rendering
- [x] README refreshed to match current app capabilities
- [x] Landing, login, dashboard, profile, workouts, and diet pages now share a stronger bold visual direction
- [x] Image-backed hero sections are used across key frontend surfaces
- [x] Live calorie tracking with AI food estimation, confirm-and-save flow, daily totals, monthly summaries, and recommendations
- [x] AI structured-output guardrails and coach chat history hydration
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
- [x] AI calorie estimation endpoint for natural-language meal logging
- [x] AI normalization/guardrails for malformed structured workout, diet, and calorie responses

### Frontend

- [x] Real auth flow wiring
- [x] Dashboard connected to backend summary
- [x] Workout plans page with pagination, activation, completion, deep-linking, and AI create/save
- [x] Diet plans page with pagination, activation, meal completion, deep-linking, and AI create/save
- [x] Coach chat page with live AI responses
- [x] Coach chat history hydration from saved AI interactions
- [x] Profile page with progress snapshot, editable user fields, and avatar upload
- [x] Shared button, input, card, pagination, and layout refactor
- [x] Shared textarea component in the same design system
- [x] Consistent hover behavior for shared buttons
- [x] Landing page visual redesign and footer cleanup
- [x] Dashboard/profile/workout/diet pages visually aligned with the newer premium art direction
- [x] Tailwind source detection / utility generation fixed
- [x] Live calorie tracker for AI-estimated food logging with manual fallback and daily/monthly review

## Remaining High-Priority Work

### 1. Runtime QA

- [x] Unblock runtime QA by allowing this machine/IP to access the MongoDB Atlas cluster, or switch `MONGODB_URI` to a reachable local database
- [x] Test signup end to end against live backend
- [x] Test login and refresh-token behavior
- [x] Test protected route behavior after token expiry
- [x] Test dashboard with real seeded data
- [x] Test workout AI generate/save -> activate -> complete-day flow
- [x] Test diet AI generate/save -> activate -> complete-meal flow
- [x] Test coach chat with realistic prompts and error states

### 2. Frontend Polish
- [x] Complete the calorie tracker detail experience on the diet page
- [x] Improve navbar hover/active behavior
- [x] Fix refresh persistence for signed-in users
- [x] Replace manual calorie input in the diet generator with beginner-friendly weight/timeline inputs
- [x] Add profile editing flow with visible avatar in the header/home layout
- [x] Finish visual refactor for dashboard, workouts, and diet detail sections where older styling still remains
- [x] Do one more landing-page polish pass for typography scale and section density after live review
- [x] Replace remaining native `select` styling with a shared select pattern
- [x] Improve empty-state copy and guidance on dashboard
- [x] Add success feedback/toasts for activate, complete, and generate actions
- [x] Add skeleton/loading polish where appropriate
- [x] Add tasteful motion/animation polish across key frontend surfaces

### 3. AI Product Layer

- [x] Add focused backend coverage for wider malformed/edge-case AI payloads across workout, diet, calorie, and coach flows
- [x] Improve validation/guardrails for malformed AI structured output
- [x] Decide on coach chat message history hydration instead of conversation threads and ship it
- [x] Generate end-of-month calorie intake recommendations based on actual logged intake vs user goal
- [x] Add AI calorie estimation flow for natural-language food logging before saving to DB

### 4. Live Calorie Tracking

- [x] Add backend calorie log module/schema for manual daily intake entries
- [x] Add create/list/update/delete APIs for calorie log entries by date
- [x] Add daily calorie tracker UI for AI-estimated food logging with manual fallback
- [x] Show daily totals vs target calories with optional protein/carbs/fats tracking
- [x] Add monthly calorie summary view with averages, trends, and goal comparison
- [x] Connect monthly calorie review and adjustment suggestions
- [x] Save raw food input, parsed AI items, source, and confidence alongside calorie logs

### 5. Billing

- [ ] Connect real Stripe SDK checkout session creation
- [ ] Persist customers/subscriptions to PostgreSQL
- [ ] Verify Stripe webhook signatures
- [ ] Update subscription status from webhook events
- [ ] Add premium feature gating in backend and frontend

### 6. Queue / Async Jobs

- [ ] Turn queue scaffold into real BullMQ workers
- [ ] Add retry and failure logging
- [ ] Decide which AI flows should be queued versus synchronous

### 7. Testing and Hardening

- [ ] Add backend integration tests for auth, users, workouts, diet, and AI
- [x] Fix Fastify compatibility in global exception and request-logging paths
- [x] Realign stale auth/users unit tests with current service contracts
- [x] Add frontend smoke tests for auth and protected/profile flows
- [ ] Expand frontend integration tests for login, profile save, workout generation, and diet generation flows
- [x] Add backend/frontend coverage for calorie log creation, daily totals, and monthly summaries
- [ ] Add rate limiting and security hardening
- [ ] Improve logging and monitoring
- [ ] Review production-safe CORS and environment handling

### 8. DevOps and Docs

- [ ] Add backend Dockerfile
- [ ] Add `docker-compose` if local services are needed
- [x] Update README to match the actual app status and frontend architecture
- [ ] Verify `.env.example` coverage and variable names
- [ ] Add setup notes for MongoDB, PostgreSQL, Redis, and Stripe

### 9. Mobile

- [ ] Create `mobile/` Expo app
- [ ] Add auth flow
- [ ] Add dashboard/workout/diet/coach/calorie-tracker screens
- [ ] Add notifications once backend flows are stable

## Immediate Candidate Tasks

- [x] Run full manual QA with backend + frontend running together
- [x] Add training-days-per-week input to the workout generator and use it in AI generation
- [x] Add cuisine/region and richer macro detail polish to the diet detail experience
- [x] Clean up older styling in dashboard/workout/diet detail views to fully match the refactored landing/auth/chat screens
- [x] Add shared `Textarea` component in the same design system style
- [x] Add toasts or inline success states for plan actions
- [x] Design and build the live calorie tracker MVP flow
- [x] Add monthly calorie insights and recommendation cards
- [x] Replace manual-first calorie logging with AI estimate -> review -> save flow
- [x] Add AI history filtering and hydrate coach chat from persisted coach interactions
- [x] Add premium motion polish to cards, page transitions, and AI coach interactions
- [x] Test subscriptions scaffold routes in Swagger
- [x] Update README screenshots or usage notes

## Definition Of "Web App Ready"

- [x] User can sign up, sign in, refresh session, and log out reliably
- [x] Dashboard loads real summary data
- [x] User can generate, save, activate, view, and progress workout plans
- [x] User can generate, save, activate, view, and progress diet plans
- [x] User can send and receive real coach chat messages
- [x] User can log meals in plain language, confirm AI estimates, and review monthly calorie summaries
- [x] Protected routes behave correctly on auth loss
- [x] Main web flows have been manually QA tested against live backend

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
- Visual styling is now much stronger across the app, but motion/animation polish is still a remaining frontend quality pass
- `.env` files should remain untracked
