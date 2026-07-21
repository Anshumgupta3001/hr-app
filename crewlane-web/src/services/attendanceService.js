import apiClient, { apiErrorMessage } from './apiClient.js';

export const attendanceService = {
  // Locations
  async getLocations() {
    const { data } = await apiClient.get('/attendance/locations');
    return data;
  },
  async addLocation({ name, latitude, longitude, radiusMeters }) {
    try {
      const { data } = await apiClient.post('/attendance/locations', {
        name,
        latitude,
        longitude,
        radiusMeters,
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to add location.'));
    }
  },
  async removeLocation(id) {
    await apiClient.delete(`/attendance/locations/${id}`);
  },

  // Shift policy
  async getShiftPolicy() {
    const { data } = await apiClient.get('/attendance/shift-policy');
    return data;
  },
  async updateShiftPolicy(updates) {
    try {
      const { data } = await apiClient.put('/attendance/shift-policy', updates);
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to save shift policy.'));
    }
  },

  // Clock in / out
  async clockIn({ latitude, longitude }) {
    try {
      const { data } = await apiClient.post('/attendance/clock-in', { latitude, longitude });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to clock in.'));
    }
  },
  async clockOut({ latitude, longitude }) {
    try {
      const { data } = await apiClient.post('/attendance/clock-out', { latitude, longitude });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to clock out.'));
    }
  },

  // Reading attendance
  async getMyAttendance() {
    const { data } = await apiClient.get('/attendance/me');
    return data;
  },
  async getTeamForDate(date) {
    const { data } = await apiClient.get('/attendance/team', { params: { date } });
    return data;
  },
  async getSummary({ employeeId, month }) {
    const { data } = await apiClient.get('/attendance/summary', {
      params: { employeeId, month },
    });
    return data;
  },
  async getCurrentlyIn() {
    const { data } = await apiClient.get('/attendance/currently-in');
    return data;
  },

  // Regularizations
  async createRegularization({ date, requestedClockInTime, requestedClockOutTime, reason }) {
    try {
      const { data } = await apiClient.post('/attendance/regularizations', {
        date,
        requestedClockInTime,
        requestedClockOutTime,
        reason,
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to submit correction request.'));
    }
  },
  async getRegularizations() {
    const { data } = await apiClient.get('/attendance/regularizations');
    return data;
  },
  async approveRegularization(id) {
    const { data } = await apiClient.post(`/attendance/regularizations/${id}/approve`);
    return data;
  },
  async denyRegularization(id) {
    const { data } = await apiClient.post(`/attendance/regularizations/${id}/deny`);
    return data;
  },

  // Exemptions
  async getExemptions() {
    const { data } = await apiClient.get('/attendance/exemptions');
    return data;
  },
  async createExemption({ employeeId, date, reason }) {
    try {
      const { data } = await apiClient.post('/attendance/exemptions', {
        employeeId,
        date,
        reason,
      });
      return data;
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to add exception.'));
    }
  },
  async removeExemption(id) {
    await apiClient.delete(`/attendance/exemptions/${id}`);
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany.
  },
};

export default attendanceService;
