import apiClient, { apiErrorMessage } from './apiClient.js';

// Only forward a department's real Mongo `id` (present when it already
// exists on the server); anything else — including any client-only key used
// to render an unsaved chip — is never sent, so the backend always mints a
// fresh ObjectId for brand-new departments.
function sanitizeDepartments(departments) {
  return (departments || []).map((d) =>
    d.id ? { id: d.id, name: d.name } : { name: d.name }
  );
}

export const companyService = {
  async createCompany(companyData, adminData) {
    try {
      const { data } = await apiClient.post('/companies', {
        name: companyData.name,
        industry: companyData.industry,
        departments: sanitizeDepartments(companyData.departments),
        admin: {
          name: adminData.name,
          email: adminData.email,
          password: adminData.password,
          designation: adminData.designation || 'Company Admin',
        },
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to create company.'));
    }
  },

  async seedDefaultHolidays() {
    // Default holidays are now seeded server-side when a company is created
    // (companyController.createCompany) — nothing to do on app boot.
  },

  async getAllCompanies() {
    const { data } = await apiClient.get('/companies');
    return data;
  },

  async getCompanyById(id) {
    if (!id) return null;
    try {
      const { data } = await apiClient.get(`/companies/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  async updateCompany(id, updates) {
    try {
      const body =
        updates.departments !== undefined
          ? { ...updates, departments: sanitizeDepartments(updates.departments) }
          : updates;
      const { data } = await apiClient.patch(`/companies/${id}`, body);
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to update company.'));
    }
  },

  async deleteCompany(companyId) {
    await apiClient.delete(`/companies/${companyId}`);
  },
};

export default companyService;
