import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminUser, isAdmin } = useAuth();

  const isUserAdmin = Boolean(
    adminUser &&
      (isAdmin ||
        adminUser.role?.toLowerCase() === 'admin' ||
        adminUser.role?.toLowerCase() === 'superadmin' ||
        adminUser.role === 'ADMIN' ||
        adminUser.role === 'SUPER_ADMIN')
  );

  if (!isUserAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};
