/**
 * Auth Service
 * Centralized service for all authentication-related operations
 */

/**
 * Login user
 * TODO: Replace with actual API call: return api.auth.login(credentials)
 */
export const login = async (credentials) => {
  // const response = await api.auth.login(credentials);
  // return response;
  
  // Current implementation: hardcoded validation
  const { email, password } = credentials;
  const hardcoded = {
    email: "admin@example.com",
    password: "password123",
  };
  
  if (email === hardcoded.email && password === hardcoded.password) {
    return { success: true, user: { email } };
  }
  
  return { success: false, error: "Invalid email or password" };
};

/**
 * Logout user
 * TODO: Replace with actual API call
 */
export const logout = async () => {
  // return await api.auth.logout();
  return { success: true };
};

/**
 * Get current user
 * TODO: Replace with actual API call
 */
export const getCurrentUser = async () => {
  // return await api.auth.getCurrentUser();
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  // This could check localStorage, cookies, or make an API call
  // return localStorage.getItem('authToken') !== null;
  return false;
};
