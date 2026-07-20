import apiClient, { apiErrorMessage } from './apiClient';

export const EXPENSE_CATEGORIES = [
  'Travel',
  'Food',
  'Accommodation',
  'Office Supplies',
  'Other',
];

export const expenseService = {
  async createClaim({ category, amount, dateIncurred, description }) {
    try {
      const { data } = await apiClient.post('/expense-claims', {
        category,
        amount,
        dateIncurred,
        description,
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to submit expense claim.'));
    }
  },

  async getClaimsByEmployee(employeeId) {
    const { data } = await apiClient.get('/expense-claims', { params: { employeeId } });
    return data;
  },

  async getClaimsByCompany(companyId) {
    const { data } = await apiClient.get('/expense-claims', { params: { companyId } });
    return data;
  },

  async decideClaim(claimId, decision) {
    const path = decision === 'approved' ? 'approve' : 'deny';
    const { data } = await apiClient.post(`/expense-claims/${claimId}/${path}`);
    return data;
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },
};

export default expenseService;
