import apiClient, { setToken, clearToken, getToken, apiErrorMessage } from './apiClient';

export const authService = {
  async login(email, password) {
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      await setToken(data.token);
      return data.employee;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Invalid email or password.'));
    }
  },

  async logout() {
    await clearToken();
  },

  async getCurrentUser() {
    if (!(await getToken())) return null;
    try {
      const { data } = await apiClient.get('/auth/me');
      return data.employee;
    } catch {
      await clearToken();
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
