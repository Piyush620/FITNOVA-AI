import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, hasSession, hasHydrated, getCurrentUser, isLoading } = useAuth();

  useEffect(() => {
    if (hasHydrated && hasSession && !isAuthenticated && !isLoading) {
      void getCurrentUser();
    }
  }, [getCurrentUser, hasHydrated, hasSession, isAuthenticated, isLoading]);

  if (!hasHydrated || isLoading || (hasSession && !isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#070710_0%,#0b0d17_100%)]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="absolute h-24 w-24 rounded-full bg-[#8ef7c7]/12 blur-2xl motion-safe:[animation:pulseHalo_2.4s_ease-in-out_infinite]" />
          <div className="animate-spin">
            <div className="h-12 w-12 rounded-full border-4 border-[#8ef7c7] border-t-transparent shadow-[0_0_30px_rgba(142,247,199,0.24)]"></div>
          </div>
          <p className="text-sm uppercase tracking-[0.24em] text-[#c7d3eb]">Loading your space</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
