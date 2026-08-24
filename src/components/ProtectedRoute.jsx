import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeRedirectPath } from '../utils/appPaths';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f5d31]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnPath = `${location.pathname}${location.search}`;
    const redirect = encodeURIComponent(returnPath);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
};

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f5d31]" />
      </div>
    );
  }

  if (isAuthenticated) {
    const redirect = sanitizeRedirectPath(searchParams.get('redirect'));
    return <Navigate to={redirect || '/dashboard'} replace />;
  }

  return children;
};
