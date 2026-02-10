// components/Authorized.jsx
// import React from 'react';
import { hasPermission } from '../utils/permission';
// import { useAuth } from '../context/AuthContext';

export default function Authorized({ permission, children, fallback = null }) {
//   const { user, loading } = useAuth();
  const staffUserToken = localStorage.getItem('staffUserToken');
  const staffUser = localStorage.getItem('staffUserData')
//   if (loading) return null; // or spinner
  // if (!permission) return children;
  return hasPermission(staffUser , permission) ? children : fallback;
}
