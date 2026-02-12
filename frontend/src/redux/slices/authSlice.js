import { createSlice } from "@reduxjs/toolkit";

const storedToken = localStorage.getItem("token");
const storedUserId = localStorage.getItem("userId");
const storedUser = localStorage.getItem("user");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: storedToken || null,
    userId: storedUserId || null,
    user: storedUser ? JSON.parse(storedUser) : null,
    isAuthenticated: !!storedToken,
  },

  reducers: {
    setUser: (state, action) => {
      const userData = action.payload;

      state.token = userData.token;
      state.userId = userData.userId;
      state.user = userData.user; // only store the user object
      state.isAuthenticated = true;

      localStorage.setItem("token", userData.token);
      localStorage.setItem("userId", userData.userId);
      localStorage.setItem("user", JSON.stringify(userData.user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userId = null;
      state.isAuthenticated = false;

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
