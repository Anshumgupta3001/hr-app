import apiClient, { apiErrorMessage } from './apiClient.js';

export const announcementService = {
  async createAnnouncement({ title, message }) {
    try {
      const { data } = await apiClient.post('/announcements', { title, message });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to post announcement.'));
    }
  },

  async getByCompany(companyId) {
    const { data } = await apiClient.get('/announcements', { params: { companyId } });
    return data;
  },

  async getLatest(companyId) {
    const list = await this.getByCompany(companyId);
    return list[0] || null;
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },
};

export default announcementService;
