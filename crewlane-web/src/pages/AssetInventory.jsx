import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import AssetRow from '../components/AssetRow.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { assetService, ASSET_TYPES } from '../services/assetService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function AssetInventory() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [assetType, setAssetType] = useState(ASSET_TYPES[0]);
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  const loadAssets = useCallback(async () => {
    setAssets(await assetService.getAssetsByCompany(companyId));
  }, [companyId]);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (!['admin', 'hr'].includes(current.role)) {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/my-assets/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/assets/${current.companyId}`, { replace: true });
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
      await loadAssets();
    }
    load();
  }, [navigate, companyId, loadAssets]);

  if (!user || !company) return null;

  const canAdd = name.trim();

  async function handleAdd(e) {
    e.preventDefault();
    if (!canAdd) return;
    await assetService.createAsset({ companyId, assetType, name, serialNumber });
    setName('');
    setSerialNumber('');
    await loadAssets();
  }

  async function handleAssign(assetId, employeeId) {
    if (!employeeId) return;
    await assetService.assignAsset(assetId, employeeId);
    await loadAssets();
  }

  async function handleReturn(assetId) {
    await assetService.returnAsset(assetId);
    await loadAssets();
  }

  function assigneeOf(asset) {
    return employees.find((e) => e.id === asset.assignedToEmployeeId) || null;
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-8">
        Asset Inventory
      </h1>

      <div className="max-w-2xl space-y-6 pb-10">
        <OutlinedCard className="p-6">
          <p className="font-display font-bold text-lg mb-4">+ Add Asset</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-sm mb-1.5">Type</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-sm mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="MacBook Air M2"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-sm mb-1.5">Serial Number</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="C02XR4..."
                className={INPUT_CLASS}
              />
            </div>
            <CandyButton type="submit" variant="primary" disabled={!canAdd} className="w-full">
              Add Asset
            </CandyButton>
          </form>
        </OutlinedCard>

        {assets.length === 0 ? (
          <p className="text-muted font-bold">No assets tracked yet.</p>
        ) : (
          assets.map((asset) => {
            const assignee = assigneeOf(asset);
            const needsReturn = Boolean(
              assignee && ['on_notice', 'exited'].includes(assignee.employmentStatus)
            );
            return (
              <AssetRow
                key={asset.id}
                asset={asset}
                assignedName={assignee ? assignee.name : null}
                needsReturn={needsReturn}
                actions={
                  asset.status === 'available' ? (
                    <select
                      value=""
                      onChange={(e) => handleAssign(asset.id, e.target.value)}
                      className="rounded-btn bg-clay-input shadow-clayPressed px-3 py-2 font-body font-bold text-sm text-ink focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20"
                    >
                      <option value="">Assign to…</option>
                      {employees
                        .filter((e) => e.employmentStatus !== 'exited')
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <CandyButton
                      variant="secondary"
                      small
                      onClick={() => handleReturn(asset.id)}
                    >
                      Mark Returned
                    </CandyButton>
                  )
                }
              />
            );
          })
        )}
      </div>
    </CompanyAppShell>
  );
}
