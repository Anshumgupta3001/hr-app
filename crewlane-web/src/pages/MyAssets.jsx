import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import AssetRow from '../components/AssetRow.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { assetService } from '../services/assetService.js';

export default function MyAssets() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (current.role === 'superadmin') {
        navigate('/super-admin', { replace: true });
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/my-assets/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      setAssets(await assetService.getAssetsByEmployee(current.id));
    }
    load();
  }, [navigate, companyId]);

  if (!user || !company) return null;

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-8">My Assets</h1>
      <div className="max-w-2xl space-y-4 pb-10">
        {assets.length === 0 ? (
          <p className="text-muted font-bold">No assets assigned to you.</p>
        ) : (
          assets.map((asset) => <AssetRow key={asset.id} asset={asset} />)
        )}
      </div>
    </CompanyAppShell>
  );
}
