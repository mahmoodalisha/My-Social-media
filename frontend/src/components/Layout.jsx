import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <>
      {/* Conditionally render the Navbar based on the route */}
      {location.pathname !== "/login" && 
        location.pathname !== "/register" && 
        location.pathname !== "/forgot-password" && 
        !location.pathname.startsWith("/reset-password") && 
        <Navbar />}
      
      <div className="content" style={{ paddingTop: '60px' }}>
        {children} {/* Main content area */}
      </div>
    </>
  );
};

export default Layout;
