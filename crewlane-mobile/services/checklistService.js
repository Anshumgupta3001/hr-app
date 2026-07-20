import apiClient from './apiClient';

export const checklistService = {
  async seedOnboarding() {
    // Seeded server-side by employeeController.createEmployee — nothing to
    // do client-side.
  },

  async seedOffboarding() {
    // Seeded server-side by employeeController.markExited — nothing to do
    // client-side.
  },

  async addTask({ companyId, employeeId, type, title }) {
    const { data } = await apiClient.post('/checklist-tasks', {
      companyId,
      employeeId,
      type,
      title,
    });
    return data;
  },

  async toggleTask(taskId) {
    const { data } = await apiClient.patch(`/checklist-tasks/${taskId}`, { toggle: true });
    return data;
  },

  async getTasksForEmployee(employeeId) {
    const { data } = await apiClient.get('/checklist-tasks', { params: { employeeId } });
    return data;
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },
};

export default checklistService;
