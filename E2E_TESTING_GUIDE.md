# FitNova AI - End-to-End Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing all critical user flows in the FitNova AI application.

**Total Test Duration:** ~45 minutes
**Prerequisites:** Both backend and frontend running locally

---

## Setup

### Start Backend
```bash
cd backend
npm run start:dev
# Should show: "Listening at http://0.0.0.0:4000"
```

### Start Frontend
```bash
cd frontend
npm run dev
# Should show: "Local: http://localhost:5173"
```

### Clear Data (Optional)
To start fresh, clear browser localStorage:
```javascript
// In browser console
localStorage.clear()
```

---

## Test Suite 1: Authentication Flow (10 min)

### T1.1 - Signup Flow
**Steps:**
1. Navigate to `http://localhost:5173`
2. Click "Get Started" or navigate to `/signup`
3. Fill signup form:
   - Email: `testuser@fitnova.test`
   - Password: `SecurePass123!`
   - Full Name: `Test User`
   - Height: `180` cm
   - Weight: `80` kg
   - Goal: `muscle-gain`
   - Activity Level: `moderate`
4. Click "Create Account"

**Expected Results:**
- ✅ Toast: "Account created! Welcome to FitNova 💪"
- ✅ Redirect to dashboard
- ✅ User profile visible with provided data
- ✅ localStorage contains `accessToken` and `refreshToken`

**Test Command:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@fitnova.test",
    "password":"SecurePass123!",
    "fullName":"Test User",
    "heightCm":180,
    "weightKg":80,
    "goal":"muscle-gain",
    "activityLevel":"moderate"
  }'
```

### T1.2 - Login Flow
**Steps:**
1. Navigate to `/login`
2. Enter email: `testuser@fitnova.test`
3. Enter password: `SecurePass123!`
4. Click "Sign In"

**Expected Results:**
- ✅ Toast: "Welcome back! 🎉"
- ✅ Redirect to dashboard
- ✅ User info displays correctly
- ✅ Tokens updated in localStorage

### T1.3 - Token Refresh
**Steps:**
1. In browser DevTools, go to Storage → Cookies
2. Open `http://localhost:4000` to see the refresh token cookie
3. Wait 1 minute (to trigger token age)
4. Make any API call (navigate to /workouts)
5. Check Network tab for automatic refresh request

**Expected Results:**
- ✅ New access token issued
- ✅ API call succeeds without logout
- ✅ No user sees token expiration

### T1.4 - Protected Route Guards
**Steps:**
1. Open DevTools → Storage → localStorage
2. Delete the `accessToken` entry
3. Try to navigate to `/dashboard`

**Expected Results:**
- ✅ Auto-redirect to `/login`
- ✅ Cannot access protected routes without valid token

### T1.5 - Logout
**Steps:**
1. On dashboard, click logout (if button visible) or delete tokens
2. Try to navigate to `/dashboard`

**Expected Results:**
- ✅ Redirect to login
- ✅ localStorage cleared
- ✅ Toast: "Logged out successfully"

---

## Test Suite 2: Workout Plans (12 min)

### T2.1 - AI Workout Generation
**Steps:**
1. Navigate to `/workouts`
2. Click "Generate New Plan"
3. Fill the form:
   - Weight: `80` kg
   - Goal: `muscle-gain`
   - Experience: `intermediate`
   - Equipment: `dumbbells, bench`
   - Duration: `12`
4. Click "Generate And Save Plan"

**Expected Results:**
- ✅ Loading state shows
- ✅ Toast: "AI workout plan generated and saved! 🤖💪"
- ✅ New plan appears in the list
- ✅ Plan marked as "AI Generated"
- ✅ Redirect to plan detail page

**API Test:**
```bash
curl -X POST http://localhost:4000/api/v1/ai/generate-and-save-workout-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "weight":80,
    "goal":"muscle-gain",
    "experience":"intermediate",
    "equipment":"dumbbells, bench",
    "durationWeeks":12
  }'
```

### T2.2 - Activate Workout Plan
**Steps:**
1. From plan list, click on a generated plan
2. Click "Activate Plan" button
3. Confirm action

**Expected Results:**
- ✅ Toast: "Workout plan activated! 💪"
- ✅ Plan status changes to "active"
- ✅ Dashboard updates to show active plan
- ✅ Redirect to plan detail page

### T2.3 - Complete Workout Day
**Steps:**
1. On active plan detail page
2. Click "Mark Complete" on Day 1
3. Confirm action

**Expected Results:**
- ✅ Toast: "Workout completed! Great job! 🎉"
- ✅ Day shows completed indicator
- ✅ Progress bar updates
- ✅ Plan status may change based on completion

### T2.4 - View Plan Details
**Steps:**
1. Click on any plan to view details
2. Verify all sections load:
   - Plan title and goal
   - Status badge
   - Completion progress
   - Days section with exercises
   - Notes section

**Expected Results:**
- ✅ All data displays correctly
- ✅ No loading errors
- ✅ Responsive on mobile (test with DevTools)

### T2.5 - Pagination
**Steps:**
1. On `/workouts` list page
2. Create 5+ workout plans manually or via API
3. Test pagination controls

**Expected Results:**
- ✅ Only 3-5 items per page
- ✅ Next/previous buttons work
- ✅ Page indicator accurate

---

## Test Suite 3: Diet Plans (12 min)

### T3.1 - AI Diet Generation
**Steps:**
1. Navigate to `/diet`
2. Click "Generate New Plan"
3. Fill form:
   - Goal: `weight-loss`
   - Calories: `2000`
   - Preference: `veg`
   - Budget: `medium`
4. Click "Generate And Save Plan"

**Expected Results:**
- ✅ Toast: "AI diet plan generated and saved! 🤖🥗"
- ✅ Plan appears in list with "AI Generated" badge
- ✅ Redirect to detail page
- ✅ Plan shows all meals and nutrition info

### T3.2 - Activate Diet Plan
**Steps:**
1. Click on a diet plan
2. Click "Activate Plan"

**Expected Results:**
- ✅ Toast: "Diet plan activated! 🥗"
- ✅ Status changes to "active"
- ✅ Dashboard updates

### T3.3 - Complete Meal
**Steps:**
1. On active diet plan
2. Click "Complete" on a meal (breakfast, lunch, etc.)

**Expected Results:**
- ✅ Toast: "Meal logged! Nutritional goals on track! 🎯"
- ✅ Meal shows completed indicator
- ✅ Calorie counter updates

### T3.4 - View Meal Details
**Steps:**
1. Click on any meal card to expand
2. Verify all fields display

**Expected Results:**
- ✅ Ingredients list visible
- ✅ Nutritional info (calories, macro breakdown) displays
- ✅ Completion time shows if completed

---

## Test Suite 4: Coach Chat (5 min)

### T4.1 - Send Message
**Steps:**
1. Navigate to `/coach`
2. Type message: "What workout should I do for chest?"
3. Press send or click Send button

**Expected Results:**
- ✅ Message appears in chat
- ✅ Loading indicator shows while waiting
- ✅ AI response streams in (if implemented)
- ✅ Response appears in chat

### T4.2 - Multiple Messages
**Steps:**
1. Send 3-5 messages in conversation

**Expected Results:**
- ✅ Full conversation history displays
- ✅ No data loss
- ✅ Messages maintain order

### T4.3 - Error Handling
**Steps:**
1. Send very long message (>5000 chars)
2. Or try to send without internet

**Expected Results:**
- ✅ Toast shows error: "Failed to send message"
- ✅ No crash or page break
- ✅ Can retry

---

## Test Suite 5: Dashboard (3 min)

### T5.1 - Data Aggregation
**Steps:**
1. Navigate to `/dashboard`
2. Verify all stats display:
   - Weekly Consistency %
   - Meal Completion %
   - Current Weight
   - Weight Change
   - Active Workout Plan card
   - Active Diet Plan card
   - Goal, Activity Level, Next Check-in

**Expected Results:**
- ✅ All cards load without errors
- ✅ Data matches actual user progress
- ✅ Numbers are reasonable (0-100% for percentages, etc.)

### T5.2 - Quick Actions
**Steps:**
1. On dashboard, click "View Details" on Active Workout Plan

**Expected Results:**
- ✅ Routes to `/workouts/:id` with correct plan
- ✅ Plan data matches dashboard

---

## Test Suite 6: Error Handling & Edge Cases (3 min)

### T6.1 - Network Error
**Steps:**
1. Stop backend server
2. Try to load `/dashboard`

**Expected Results:**
- ✅ Error toast shows
- ✅ Page shows error message (not blank)
- ✅ Backend restart recovers gracefully

### T6.2 - Invalid Plan ID
**Steps:**
1. Navigate to `/workouts/invalid-id-12345`

**Expected Results:**
- ✅ 404 or error message displays
- ✅ Can navigate back

### T6.3 - Session Timeout
**Steps:**
1. Login, then manually set `accessToken` in localStorage to invalid value
2. Try to access `/dashboard`

**Expected Results:**
- ✅ Auto-redirect to `/login`
- ✅ Clear error message (not cryptic)

### T6.4 - Empty States
**Steps:**
1. Create new account with no plans
2. Navigate to `/workouts` and `/diet`

**Expected Results:**
- ✅ Helpful empty state message
- ✅ CTA to create first plan
- ✅ Not blank/confusing

---

## Test Suite 7: Performance & Load (Optional)

### T7.1 - Load Times
**Test with:** DevTools Network tab + Performance tab
- `GET /api/v1/users/profile` - should be < 200ms
- `GET /api/v1/workouts/list` - should be < 500ms
- `POST /api/v1/ai/generate-and-save-workout-plan` - should be < 10s

### T7.2 - Memory Leaks
**Steps:**
1. In DevTools Memory tab, take a heap snapshot
2. Navigate to 5 different pages
3. Take another heap snapshot
4. Compare sizes - should not grow unbounded

---

## Automated Tests (Bonus)

### Run Backend Tests
```bash
cd backend
npm test
npm run test:cov
```

**Expected:** All tests pass with good coverage

### Run Frontend Type Check
```bash
cd frontend
npm run build
```

**Expected:** No TypeScript errors

---

## Sign-Off Checklist

- [ ] All T1.x (Auth) tests pass
- [ ] All T2.x (Workouts) tests pass
- [ ] All T3.x (Diet) tests pass
- [ ] All T4.x (Coach) tests pass
- [ ] All T5.x (Dashboard) tests pass
- [ ] All T6.x (Error handling) tests pass
- [ ] No console errors (check DevTools)
- [ ] No toast notifications left visible
- [ ] All toasts appear correctly
- [ ] Mobile responsive verified
- [ ] API responses logged to console appropriately
- [ ] Rate limiting tested (rapid requests get throttled)

---

## Troubleshooting

**Issue: "Bearer token is missing"**
- Solution: Ensure you're authenticated, check localStorage for `accessToken`

**Issue: "Origin not allowed"**
- Solution: Check backend `.env` - `APP_ORIGIN` should include frontend URL

**Issue: "Database connection failed"**
- Solution: Check MongoDB connection string in backend `.env`

**Issue: "Cannot find module"**
- Solution: Run `npm install` in both backend and frontend directories

---

## Report Template

```markdown
## E2E Test Results - [DATE]

**Tester:** [Your Name]
**Duration:** [Time taken]
**Date:** [YYYY-MM-DD]

### Summary
- Total Tests: 21
- Passed: [ ]
- Failed: [ ]
- Blocked: [ ]

### Failed Tests
[List any failures here with error messages]

### Notes
[Any observations, improvements, or issues]

### Recommendation
[ ] Ready for production
[ ] Ready for staging with noted issues
[ ] Needs fixes before shipping
```

---

**Last Updated:** March 26, 2026
