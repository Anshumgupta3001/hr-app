import apiClient, { apiErrorMessage } from './apiClient';

export function defaultProfileFields() {
  return {
    dateOfBirth: null,
    dateOfJoining: null,
    previousCompanyName: '',
    totalExperienceYears: null,
    previousRoleNotes: '',
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
    },
    aadharNumber: '',
    panNumber: '',
    passportNumber: '',
  };
}

export const employeeService = {
  async getAllEmployees() {
    const { data } = await apiClient.get('/employees');
    return data;
  },

  async getEmployeeById(id) {
    if (!id) return null;
    try {
      const { data } = await apiClient.get(`/employees/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  async getEmployeesByCompany(companyId) {
    if (!companyId) return [];
    const { data } = await apiClient.get('/employees', { params: { companyId } });
    return data;
  },

  async createEmployee({
    companyId,
    name,
    email,
    password,
    role,
    departmentId = null,
    designation = '',
    managerId = null,
    probationEndDate = null,
    profile = {},
  }) {
    try {
      const { data } = await apiClient.post('/employees', {
        companyId,
        name,
        email,
        password,
        role,
        departmentId,
        designation,
        managerId,
        probationEndDate,
        profile,
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to create employee.'));
    }
  },

  async updateEmployee(id, updates) {
    try {
      const { data } = await apiClient.patch(`/employees/${id}`, updates);
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to update employee.'));
    }
  },

  async removeEmployee(id) {
    await apiClient.delete(`/employees/${id}`);
  },

  async markExited(id) {
    const { data } = await apiClient.post(`/employees/${id}/mark-exited`);
    return data;
  },

  async updatePassword(employeeId, newPassword) {
    const { data } = await apiClient.patch(`/employees/${employeeId}`, {
      password: newPassword,
    });
    return data;
  },
};

export default employeeService;
