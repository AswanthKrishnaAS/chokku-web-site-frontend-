import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminUser, isAdmin } = useAuth();

  const isUserAdmin = isAdmin && adminUser && adminUser.role === 'admin';

  if (!isUserAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};
