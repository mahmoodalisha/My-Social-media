import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element: Element }) => {
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!token; // Return true if token exists
  };

  return isAuthenticated() ? <Element /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
