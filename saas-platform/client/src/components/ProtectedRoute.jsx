import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ requiredRoles = [] }) => {
  const { isAuthenticated, loading, currentUser } = useContext(AuthContext);

  // Show loading indicator while checking authentication
  console.log("user", currentUser);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If requiredRoles is provided and not empty, check if user has required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(currentUser.role)) {
    // Redirect to unauthorized page or a page they have access to based on their role
    return <Navigate to="/unauthorized" />;
  }

  // User is authenticated and has required role (or no specific role is required)
  return <Outlet />;
};

export default ProtectedRoute;
