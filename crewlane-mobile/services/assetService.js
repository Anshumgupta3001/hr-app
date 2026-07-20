import apiClient from './apiClient';

export const ASSET_TYPES = ['Laptop', 'Phone', 'ID Card', 'Other'];

export const assetService = {
  async createAsset({ companyId, assetType, name, serialNumber }) {
    const { data } = await apiClient.post('/assets', {
      companyId,
      assetType,
      name,
      serialNumber,
    });
    return data;
  },

  async assignAsset(assetId, employeeId) {
    const { data } = await apiClient.post(`/assets/${assetId}/assign`, { employeeId });
    return data;
  },

  async returnAsset(assetId) {
    const { data } = await apiClient.post(`/assets/${assetId}/return`);
    return data;
  },

  async getAssetsByCompany(companyId) {
    const { data } = await apiClient.get('/assets', { params: { companyId } });
    return data;
  },

  async getAssetsByEmployee(employeeId) {
    const { data } = await apiClient.get('/assets', { params: { employeeId } });
    return data;
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },
};

export default assetService;
