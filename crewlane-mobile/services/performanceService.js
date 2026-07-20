import apiClient from './apiClient';

export const performanceService = {
  async createCycle({ name, startDate, endDate }) {
    const { data } = await apiClient.post('/review-cycles', { name, startDate, endDate });
    return data;
  },

  async closeCycle(cycleId) {
    const { data } = await apiClient.patch(`/review-cycles/${cycleId}`, { status: 'closed' });
    return data;
  },

  async getCyclesByCompany(companyId) {
    const { data } = await apiClient.get('/review-cycles', { params: { companyId } });
    return data;
  },

  async getActiveCycle(companyId) {
    const cycles = await this.getCyclesByCompany(companyId);
    return cycles.find((c) => c.status === 'active') || null;
  },

  async addGoal({ cycleId, title, description }) {
    const { data } = await apiClient.post('/goals', { cycleId, title, description });
    return data;
  },

  async updateGoal(goalId, updates) {
    const { data } = await apiClient.patch(`/goals/${goalId}`, updates);
    return data;
  },

  async getGoals(employeeId, cycleId) {
    const { data } = await apiClient.get('/goals', { params: { employeeId, cycleId } });
    return data;
  },

  async getOrCreateReview(companyId, cycleId, employeeId) {
    const { data } = await apiClient.post('/reviews/get-or-create', { cycleId, employeeId });
    return data;
  },

  async submitSelfReview(reviewId, { selfRating, selfComments }) {
    const { data } = await apiClient.patch(`/reviews/${reviewId}/self`, {
      selfRating,
      selfComments,
    });
    return data;
  },

  async submitManagerReview(reviewId, { managerRating, managerComments }) {
    const { data } = await apiClient.patch(`/reviews/${reviewId}/manager`, {
      managerRating,
      managerComments,
    });
    return data;
  },

  async getReviewsByCycle(companyId, cycleId) {
    const { data } = await apiClient.get('/reviews', { params: { cycleId } });
    return data;
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },
};

export default performanceService;
