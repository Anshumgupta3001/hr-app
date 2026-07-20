import apiClient from './apiClient';

export const holidayService = {
  async getHolidaysByCompany(companyId) {
    if (!companyId) return [];
    const { data } = await apiClient.get('/holidays', { params: { companyId } });
    return data;
  },

  async createHoliday({ companyId, name, date }) {
    const { data } = await apiClient.post('/holidays', { companyId, name, date });
    return data;
  },

  async removeHoliday(id) {
    await apiClient.delete(`/holidays/${id}`);
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },
};

export default holidayService;
