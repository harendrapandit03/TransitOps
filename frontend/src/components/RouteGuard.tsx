import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import type { UserRole } from '../services/types';

interface GuardProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const RouteGuard: React.FC<GuardProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but unauthorized, redirect to safe space or dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
