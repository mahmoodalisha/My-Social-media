import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux"; // Redux Provider
import { AuthProvider } from "./context/AuthContext"; // Auth Context Provider
import store from "./redux/store"; // Redux store
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./pages/Home";
import Post from "./pages/Post";
import Profile from "./pages/Profile";
import UserDetail from "./components/UserDetail";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    // Wrapping App with Redux Provider and Auth Context Provider
    <Provider store={store}>
      <AuthProvider>
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
              <Route
                path="/"
                element={
                  !!localStorage.getItem("token") ? (
                    <Navigate to="/home" />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </Provider>
  );
};

export default App;
