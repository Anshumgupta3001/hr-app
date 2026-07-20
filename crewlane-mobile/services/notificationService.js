import apiClient from './apiClient';

export const notificationService = {
  async create() {
    // Created server-side alongside the action that triggers it (leave
    // requests, expense claims, praise, announcements, resignations) —
    // nothing to do client-side.
  },

  async getAdminNotifications(companyId) {
    const { data } = await apiClient.get('/notifications', {
      params: { audience: 'admin', companyId },
    });
    return data;
  },

  async getEmployeeNotifications() {
    const { data } = await apiClient.get('/notifications');
    return data;
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },

  async markRead(id) {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return data;
  },
};

export default notificationService;
