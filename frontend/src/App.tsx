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
import { ProfilePage } from './pages/Profile';

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
            // Default options
            duration: 3000,
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
