import apiClient, { apiErrorMessage } from './apiClient';

export const praiseService = {
  async createPraise({ toEmployeeId, message }) {
    try {
      const { data } = await apiClient.post('/praise', { toEmployeeId, message });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to send praise.'));
    }
  },

  async getPraisesByCompany(companyId) {
    const { data } = await apiClient.get('/praise', { params: { companyId } });
    return data;
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },
};

export default praiseService;
