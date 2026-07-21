import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { attendanceService } from '../services/attendanceService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Location permission was denied.')),
      { enableHighAccuracy: true }
    );
  });
}

function LocationsSection({ locations, onReload }) {
  const [pendingCoords, setPendingCoords] = useState(null);
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('500');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleUseCurrentLocation() {
    setError('');
    try {
      const coords = await getLocation();
      setPendingCoords(coords);
      setName('');
      setRadius('500');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!pendingCoords || !name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await attendanceService.addLocation({
        name: name.trim(),
        latitude: pendingCoords.latitude,
        longitude: pendingCoords.longitude,
        radiusMeters: Number(radius) || 500,
      });
      setPendingCoords(null);
      await onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    await attendanceService.removeLocation(id);
    await onReload();
  }

  return (
    <OutlinedCard className="p-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="font-display font-bold text-xl">Locations</h2>
        <CandyButton variant="primary" small onClick={handleUseCurrentLocation}>
          Use my current location
        </CandyButton>
      </div>

      {pendingCoords && (
        <form
          onSubmit={handleSave}
          className="flex flex-col sm:flex-row gap-3 items-end mb-6 bg-clay-input rounded-card p-4"
        >
          <div className="flex-1 w-full">
            <label className="block font-bold text-sm mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Office"
              className={INPUT_CLASS}
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="block font-bold text-sm mb-1.5">Radius (m)</label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <CandyButton type="submit" variant="teal" disabled={!name.trim() || saving}>
            Save
          </CandyButton>
        </form>
      )}
      {error && <p className="text-coral font-bold text-sm mb-4">{error}</p>}

      {locations.length === 0 ? (
        <p className="text-muted font-bold">No locations configured yet.</p>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between gap-4 bg-clay-input rounded-btn px-5 py-4"
            >
              <div>
                <p className="font-display font-bold">{loc.name}</p>
                <p className="text-xs text-muted mt-0.5">
                  {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · {loc.radiusMeters}m
                  radius
                </p>
              </div>
              <CandyButton variant="primary" small onClick={() => handleRemove(loc.id)}>
                Remove
              </CandyButton>
            </div>
          ))}
        </div>
      )}
    </OutlinedCard>
  );
}

function ShiftTimingSection({ policy, onReload }) {
  const [form, setForm] = useState(policy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setForm(policy), [policy]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await attendanceService.updateShiftPolicy({
        expectedWorkHours: Number(form.expectedWorkHours),
      });
      await onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <OutlinedCard className="p-8">
      <h2 className="font-display font-bold text-xl mb-6">Shift Timing</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="w-full sm:w-48">
          <label className="block font-bold text-sm mb-1.5">Expected Work Hours</label>
          <input
            type="number"
            value={form.expectedWorkHours}
            onChange={(e) => update('expectedWorkHours', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        {error && <p className="text-coral font-bold text-sm">{error}</p>}
        <CandyButton type="submit" variant="teal" disabled={saving}>
          Save Shift Policy
        </CandyButton>
      </form>
    </OutlinedCard>
  );
}

function ExemptionsSection({ exemptions, employees, onReload }) {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function employeeName(id) {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : 'Former employee';
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!employeeId || !date) return;
    setError('');
    try {
      await attendanceService.createExemption({ employeeId, date, reason: reason.trim() });
      setEmployeeId('');
      setDate('');
      setReason('');
      await onReload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    await attendanceService.removeExemption(id);
    await onReload();
  }

  return (
    <OutlinedCard className="p-8">
      <h2 className="font-display font-bold text-xl mb-6">Remote Day Exceptions</h2>
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end mb-6">
        <div className="flex-1 w-full">
          <label className="block font-bold text-sm mb-1.5">Employee</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label className="block font-bold text-sm mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block font-bold text-sm mb-1.5">Reason</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="WFH"
            className={INPUT_CLASS}
          />
        </div>
        <CandyButton type="submit" variant="mustard" disabled={!employeeId || !date}>
          + Add Exception
        </CandyButton>
      </form>
      {error && <p className="text-coral font-bold text-sm mb-4">{error}</p>}

      {exemptions.length === 0 ? (
        <p className="text-muted font-bold">No exceptions recorded.</p>
      ) : (
        <div className="space-y-3">
          {exemptions.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between gap-4 bg-clay-input rounded-btn px-5 py-4"
            >
              <div>
                <p className="font-display font-bold">{employeeName(ex.employeeId)}</p>
                <p className="text-xs text-muted mt-0.5">
                  {ex.date}
                  {ex.reason && ` · ${ex.reason}`}
                </p>
              </div>
              <CandyButton variant="primary" small onClick={() => handleRemove(ex.id)}>
                Remove
              </CandyButton>
            </div>
          ))}
        </div>
      )}
    </OutlinedCard>
  );
}

export default function AttendanceSettings() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [exemptions, setExemptions] = useState([]);

  const loadAll = useCallback(async () => {
    setLocations(await attendanceService.getLocations());
    setPolicy(await attendanceService.getShiftPolicy());
    setExemptions(await attendanceService.getExemptions());
  }, []);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (current.role !== 'admin') {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/dashboard/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/attendance-settings/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      setEmployees(await employeeService.getEmployeesByCompany(companyId));
      await loadAll();
    }
    load();
  }, [navigate, companyId, loadAll]);

  if (!user || !company || !policy) return null;

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <div className="max-w-3xl space-y-8 pb-10">
        <BackButton />
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Attendance Settings</h1>
        <LocationsSection locations={locations} onReload={loadAll} />
        <ShiftTimingSection policy={policy} onReload={loadAll} />
        <ExemptionsSection exemptions={exemptions} employees={employees} onReload={loadAll} />
      </div>
    </CompanyAppShell>
  );
}
