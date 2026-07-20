import apiClient, { apiErrorMessage } from './apiClient';

export const resignationService = {
  async submitResignation({ proposedLastWorkingDay, reason }) {
    try {
      const { data } = await apiClient.post('/resignations', {
        proposedLastWorkingDay,
        reason,
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to submit resignation.'));
    }
  },

  async acknowledgeResignation(resignationId) {
    const { data } = await apiClient.post(`/resignations/${resignationId}/acknowledge`);
    return data;
  },

  async getByCompany(companyId) {
    const { data } = await apiClient.get('/resignations', { params: { companyId } });
    return data;
  },

  async getByEmployee(employeeId) {
    const { data } = await apiClient.get('/resignations', { params: { employeeId } });
    return data;
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },
};

export default resignationService;
