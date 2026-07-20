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

export default function NotificationPanel({ notifications, onSelect }) {
  return (
    <div className="max-h-[360px] overflow-y-auto">
      {notifications.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted font-bold text-center">
          No notifications yet.
        </p>
      ) : (
        notifications.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => onSelect(n)}
            className="w-full flex items-start gap-3 text-left px-4 py-3 border-b-2 border-ink/5 last:border-b-0 hover:bg-clay-input/60"
          >
            {n.targetEmployeeId && (
              <Avatar
                employeeId={n.targetEmployeeId}
                name=""
                className="w-8 h-8 rounded-full shrink-0"
                textClassName="text-xs"
              />
            )}
            <div className="min-w-0">
              <p
                className={`text-sm leading-snug ${
                  n.isRead ? 'text-muted' : 'font-bold text-ink'
                }`}
              >
                {n.message}
              </p>
              <p className="text-xs text-muted mt-1">{timeAgo(n.createdAt)}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
