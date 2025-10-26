import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { checkAdminStatus } from '../lib/api/admin';

const ProtectedAdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const { isAdmin: adminStatus } = await checkAdminStatus();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error verifying admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-lg">Verifying admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    // Redirect to home page if not admin
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedAdminRoute; 