import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  user: null,
  error: null,
  hardcoded: {
    email: "admin@example.com",
    password: "password123",
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action) {
      const { email, password } = action.payload;
      if (
        email === state.hardcoded.email &&
        password === state.hardcoded.password
      ) {
        state.isAuthenticated = true;
        state.user = { email };
        state.error = null;
      } else {
        state.error = "Invalid email or password";
      }
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { login, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
