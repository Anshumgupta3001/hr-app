import apiClient, { setToken, clearToken, getToken, apiErrorMessage } from './apiClient.js';

export const authService = {
  async login(email, password) {
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      setToken(data.token);
      return data.employee;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Invalid email or password.'));
    }
  },

  async logout() {
    clearToken();
  },

  async getCurrentUser() {
    if (!getToken()) return null;
    try {
      const { data } = await apiClient.get('/auth/me');
      return data.employee;
    } catch {
      clearToken();
      return null;
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      const { data } = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return data.employee;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to change password.'));
    }
  },
};

export default authService;
