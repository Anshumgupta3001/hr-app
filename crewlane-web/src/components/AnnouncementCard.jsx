import OutlinedCard from './OutlinedCard.jsx';
import { timeAgo } from './NotificationPanel.jsx';

export default function AnnouncementCard({ announcement, posterName }) {
  return (
    <OutlinedCard className="p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-extrabold text-lg">{announcement.title}</h3>
        <span className="text-xs font-bold text-muted">{timeAgo(announcement.createdAt)}</span>
      </div>
      <p className="text-sm text-ink mt-2 whitespace-pre-wrap">{announcement.message}</p>
      <p className="text-xs font-bold text-muted mt-3">Posted by {posterName}</p>
    </OutlinedCard>
  );
}
