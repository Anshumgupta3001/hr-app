import OutlinedCard from './OutlinedCard.jsx';
import Avatar from './Avatar.jsx';

export function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function PraiseCard({ praise, fromName, toName }) {
  return (
    <OutlinedCard className="p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            employeeId={praise.fromEmployeeId}
            name={fromName}
            className="w-9 h-9 rounded-full shadow-clayButton"
            textClassName="text-sm"
          />
          <p className="font-display font-bold text-base truncate">
            {fromName} <span className="text-violet">→</span> {toName}
          </p>
        </div>
        <span className="text-xs font-bold text-muted shrink-0">
          {timeAgo(praise.createdAt)}
        </span>
      </div>
      <p className="text-sm text-ink mt-2">“{praise.message}”</p>
    </OutlinedCard>
  );
}
