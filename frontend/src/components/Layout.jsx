// src/components/Layout.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <>
      {/* Conditionally render the Navbar based on the route */}
      {location.pathname !== "/login" && location.pathname !== "/register" && <Navbar />}
      <div className="content" style={{ paddingTop: '60px' }}> {/* Adjust padding based on your navbar height */}
        {children} {/* Main content area */}
      </div>
    </>
  );
};

export default Layout;