import { useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { DashboardPage } from './pages/Dashboard';
import { WorkoutsPage } from './pages/Workouts';
import { DietPage } from './pages/Diet';
import { CoachChatPage } from './pages/CoachChat';
import { CaloriesPage } from './pages/Calories';
import { ProfilePage } from './pages/Profile';
import { BillingPage } from './pages/Billing';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';

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
      </Router>
    </ErrorBoundary>
  );
}

export default App;
