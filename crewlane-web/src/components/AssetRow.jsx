import OutlinedCard from './OutlinedCard.jsx';

const STATUS_STYLES = {
  available: 'bg-teal text-white',
  assigned: 'bg-violet text-white',
};

export default function AssetRow({ asset, assignedName = null, needsReturn = false, actions = null }) {
  return (
    <OutlinedCard className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-display font-bold text-base">
            {asset.name}{' '}
            <span className="text-muted font-body text-sm font-bold">
              · {asset.assetType}
            </span>
          </p>
          <p className="text-xs text-muted mt-0.5">S/N: {asset.serialNumber || '—'}</p>
          {assignedName && (
            <p className="text-sm text-ink mt-1 font-bold">Assigned to {assignedName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {needsReturn && (
            <span className="rounded-full bg-mustard text-white px-3 py-1 text-xs font-bold shadow-clayButton">
              Needs Return
            </span>
          )}
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${STATUS_STYLES[asset.status] || 'bg-clay-input text-muted'}`}
          >
            {asset.status}
          </span>
        </div>
      </div>
      {actions && <div className="mt-4 flex items-center gap-3 flex-wrap">{actions}</div>}
    </OutlinedCard>
  );
}
