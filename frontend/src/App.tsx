import { Suspense, lazy, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/Landing').then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('./pages/Login').then((module) => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/Signup').then((module) => ({ default: module.SignupPage })));
const DashboardPage = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.DashboardPage })),
);
const WorkoutsPage = lazy(() => import('./pages/Workouts').then((module) => ({ default: module.WorkoutsPage })));
const DietPage = lazy(() => import('./pages/Diet').then((module) => ({ default: module.DietPage })));
const CoachChatPage = lazy(() =>
  import('./pages/CoachChat').then((module) => ({ default: module.CoachChatPage })),
);
const CaloriesPage = lazy(() => import('./pages/Calories').then((module) => ({ default: module.CaloriesPage })));
const ProfilePage = lazy(() => import('./pages/Profile').then((module) => ({ default: module.ProfilePage })));
const BillingPage = lazy(() => import('./pages/Billing').then((module) => ({ default: module.BillingPage })));

function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.key]);

  return null;
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] px-6 text-center">
      <div className="space-y-3">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-[#11131d]" />
        <p className="text-sm uppercase tracking-[0.24em] text-[#00FF88]">Loading FitNova</p>
      </div>
    </div>
  );
}

function App() {
  const { getCurrentUser, hasHydrated, hasSession, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (hasHydrated && hasSession && !isAuthenticated && !isLoading) {
      void getCurrentUser();
    }
  }, [getCurrentUser, hasHydrated, hasSession, isAuthenticated, isLoading]);

  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background:
                'linear-gradient(180deg, rgba(24,26,42,0.96) 0%, rgba(16,18,31,0.98) 100%)',
              color: '#f7f7f7',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '18px',
              boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
              backdropFilter: 'blur(16px)',
            },
          }}
        />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts"
              element={
                <ProtectedRoute>
                  <WorkoutsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts/:id"
              element={
                <ProtectedRoute>
                  <WorkoutsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diet"
              element={
                <ProtectedRoute>
                  <DietPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diet/:id"
              element={
                <ProtectedRoute>
                  <DietPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calories"
              element={
                <ProtectedRoute>
                  <CaloriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach"
              element={
                <ProtectedRoute>
                  <CoachChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
