/**
 * Custom hook for authentication operations
 */

import { useSelector, useDispatch } from 'react-redux';
import { login as loginAction, logout as logoutAction, clearError } from '../features/authSlice';
import * as authService from '../services/authService';

/**
 * Hook for managing authentication
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, error } = useSelector((state) => state.auth);

  const loginUser = async (credentials) => {
    dispatch(clearError());
    const result = await authService.login(credentials);
    
    if (result.success) {
      dispatch(loginAction(credentials));
      return { success: true };
    } else {
      dispatch(loginAction(credentials)); // This will set the error in the slice
      return { success: false, error: result.error };
    }
  };

  const logoutUser = async () => {
    await authService.logout();
    dispatch(logoutAction());
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    isAuthenticated,
    user,
    error,
    login: loginUser,
    logout: logoutUser,
    clearError: clearAuthError,
  };
};
