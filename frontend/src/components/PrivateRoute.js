import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const auth = useAuth() || {};
  const token = auth?.token || localStorage.getItem('token');
  const role = auth?.role || localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={
      role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'
    } replace />;
  }

  return children;
};

export default PrivateRoute;
