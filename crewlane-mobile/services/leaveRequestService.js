import apiClient, { apiErrorMessage } from './apiClient';

export const leaveRequestService = {
  async createRequest({ leaveTypeId, startDate, endDate, totalDays, reason }) {
    try {
      const { data } = await apiClient.post('/leave-requests', {
        leaveTypeId,
        startDate,
        endDate,
        totalDays,
        reason,
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to submit leave request.'));
    }
  },

  async getRequestsByEmployee(employeeId) {
    const { data } = await apiClient.get('/leave-requests', { params: { employeeId } });
    return data;
  },

  async getRequestsByCompany(companyId) {
    const { data } = await apiClient.get('/leave-requests', { params: { companyId } });
    return data;
  },

  async deleteRequestsByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },

  async approveRequest(requestId) {
    const { data } = await apiClient.post(`/leave-requests/${requestId}/approve`);
    return data;
  },

  async denyRequest(requestId) {
    const { data } = await apiClient.post(`/leave-requests/${requestId}/deny`);
    return data;
  },
};

export default leaveRequestService;
