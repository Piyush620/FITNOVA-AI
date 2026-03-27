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
      <div className="flex items-center justify-center min-h-screen bg-[#0B0B0B]">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-[#00FF88] border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
