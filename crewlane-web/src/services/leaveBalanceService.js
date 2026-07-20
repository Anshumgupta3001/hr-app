import apiClient from './apiClient.js';
import { leavePolicyService } from './leavePolicyService.js';

export const leaveBalanceService = {
  async addUsage() {
    // Applied server-side when a leave request is approved
    // (leaveController.approveRequest) — nothing to do client-side.
  },

  async getUsedDays(employeeId, leaveTypeId) {
    const { data } = await apiClient.get('/leave-usage', { params: { employeeId } });
    return data
      .filter((u) => u.leaveTypeId === leaveTypeId)
      .reduce((sum, u) => sum + u.usedDays, 0);
  },

  async removeUsageForEmployees() {
    // Cleaned up server-side as part of companyController.deleteCompany.
  },

  async getBalances(employeeId, companyId) {
    const policy = await leavePolicyService.getCompanyPolicy(companyId);
    const { data: usage } = await apiClient.get('/leave-usage', { params: { employeeId } });
    return policy.leaveTypes.map((type) => {
      const used = usage
        .filter((u) => u.leaveTypeId === type.id)
        .reduce((sum, u) => sum + u.usedDays, 0);
      return {
        leaveTypeId: type.id,
        name: type.name,
        annualQuota: type.annualQuota,
        usedDays: used,
        remaining: type.annualQuota - used,
      };
    });
  },
};

export default leaveBalanceService;
