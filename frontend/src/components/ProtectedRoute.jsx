import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isStudent, isTeacher, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // Check role requirement
  if (requiredRole === 'student' && !isStudent()) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'teacher' && !isTeacher()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;