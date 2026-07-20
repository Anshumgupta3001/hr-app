import apiClient, { apiErrorMessage } from './apiClient.js';

// Only forward a leave type's real Mongo `id` (present when it already
// exists on the server); anything else — including any client-only key used
// to render an unsaved row — is never sent, so the backend always mints a
// fresh ObjectId for brand-new leave types.
function sanitizeLeaveTypes(leaveTypes) {
  return (leaveTypes || []).map((t) =>
    t.id
      ? { id: t.id, name: t.name, annualQuota: t.annualQuota }
      : { name: t.name, annualQuota: t.annualQuota }
  );
}

export const leavePolicyService = {
  async seedGlobalPolicy() {
    // Seeded server-side once on backend startup (utils/seedDefaults.js) —
    // nothing to do on app boot.
  },

  async getGlobalPolicy() {
    const { data } = await apiClient.get('/leave-policy/global');
    return data;
  },

  async updateGlobalPolicy(leaveTypes) {
    try {
      const { data } = await apiClient.patch('/leave-policy/global', {
        leaveTypes: sanitizeLeaveTypes(leaveTypes),
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to update global leave policy.'));
    }
  },

  async cloneGlobalForCompany(companyId) {
    // Cloned server-side automatically the first time a company's policy is
    // read (leaveController.getOrCloneCompanyPolicy) — kept as a thin alias
    // so any lingering caller still resolves the policy.
    const { data } = await apiClient.get(`/leave-policy/company/${companyId}`);
    return data;
  },

  async getCompanyPolicy(companyId) {
    const { data } = await apiClient.get(`/leave-policy/company/${companyId}`);
    return data;
  },

  async deleteCompanyPolicy() {
    // Deleted server-side as part of companyController.deleteCompany.
  },

  async updateCompanyPolicy(companyId, leaveTypes) {
    try {
      const { data } = await apiClient.patch(`/leave-policy/company/${companyId}`, {
        leaveTypes: sanitizeLeaveTypes(leaveTypes),
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to update company leave policy.'));
    }
  },
};

export default leavePolicyService;
