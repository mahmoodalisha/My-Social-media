import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./pages/Home";
import Post from "./pages/Post";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import UserDetail from "./components/UserDetail";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute"; 

const App = () => {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/post" 
            element={
              <ProtectedRoute>
                <Post />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user/:userId" 
            element={
              <ProtectedRoute>
                <UserDetail />
              </ProtectedRoute>
            } 
          />

          {/* Root Path */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
