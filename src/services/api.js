/**
 * Centralized API service layer
 * This layer abstracts all data operations and makes it easy to integrate with backend APIs
 * Currently uses in-memory/localStorage, but can be easily swapped for real API calls
 */

/**
 * Base API configuration
 * Update this when integrating with real backend
 */
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 30000,
  // Add other config as needed
};

/**
 * Generic API request handler
 * Replace this with actual fetch/axios calls when integrating backend
 */
const apiRequest = async (endpoint, options = {}) => {
  // TODO: Replace with actual API call
  // For now, this is a placeholder that will be replaced with real API integration
  // Example:
  // return fetch(`${API_CONFIG.baseURL}${endpoint}`, {
  //   ...options,
  //   headers: {
  //     'Content-Type': 'application/json',
  //     ...options.headers,
  //   },
  // }).then(res => res.json());
  
  // Current implementation: return mock data or use localStorage
  return Promise.resolve(null);
};

/**
 * API methods for different resources
 */
export const api = {
  // Projects endpoints
  projects: {
    getAll: () => apiRequest('/projects'),
    getById: (id) => apiRequest(`/projects/${id}`),
    create: (data) => apiRequest('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/projects/${id}`, { method: 'DELETE' }),
  },
  
  // Members endpoints
  members: {
    getAll: (projectId) => apiRequest(`/projects/${projectId}/members`),
    getById: (projectId, memberId) => apiRequest(`/projects/${projectId}/members/${memberId}`),
    create: (projectId, data) => apiRequest(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(data) }),
    update: (projectId, memberId, data) => apiRequest(`/projects/${projectId}/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (projectId, memberId) => apiRequest(`/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),
    bulkCreate: (projectId, data) => apiRequest(`/projects/${projectId}/members/bulk`, { method: 'POST', body: JSON.stringify(data) }),
  },
  
  // Leaves endpoints
  leaves: {
    getByMember: (projectId, memberId) => apiRequest(`/projects/${projectId}/members/${memberId}/leaves`),
    setLeave: (projectId, memberId, date, value) => apiRequest(`/projects/${projectId}/members/${memberId}/leaves/${date}`, { method: 'PUT', body: JSON.stringify({ value }) }),
    bulkUpdate: (projectId, memberId, leaves) => apiRequest(`/projects/${projectId}/members/${memberId}/leaves`, { method: 'PUT', body: JSON.stringify({ leaves }) }),
  },
  
  // Holidays endpoints
  holidays: {
    getAll: () => apiRequest('/holidays'),
    getByLocation: (location) => apiRequest(`/holidays?location=${location}`),
    create: (data) => apiRequest('/holidays', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/holidays/${id}`, { method: 'DELETE' }),
  },
  
  // Auth endpoints
  auth: {
    login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
    getCurrentUser: () => apiRequest('/auth/me'),
  },
};

export default api;
