import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./pages/Home";
import Post from "./pages/Post";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout"; // Import the Layout component

const App = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute element={Home} /> // Protect the Home route to render posts
          } 
        />
        <Route 
          path="/post" 
          element={
            <ProtectedRoute element={Post} /> // Protect the Post route for creating posts
          } 
        />
        <Route 
          path="/search" 
          element={
            <ProtectedRoute element={Search} /> // Protect the Search route
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute element={Profile} /> // Protect the Profile route
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} /> {/* Redirect to login by default */}
      </Routes>
    </Layout>
  </Router>
);

export default App;
