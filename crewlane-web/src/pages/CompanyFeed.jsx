import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import AnnouncementCard from '../components/AnnouncementCard.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { announcementService } from '../services/announcementService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function CompanyFeed() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const loadFeed = useCallback(async () => {
    setAnnouncements(await announcementService.getByCompany(companyId));
  }, [companyId]);

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
        navigate(`/feed/${current.companyId}`, { replace: true });
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
      await loadFeed();
    }
    load();
  }, [navigate, companyId, loadFeed]);

  if (!user || !company) return null;

  function posterName(postedBy) {
    if (postedBy === user.id) return user.name;
    const emp = employees.find((e) => e.id === postedBy);
    return emp ? emp.name : 'Former employee';
  }

  const canSubmit = title.trim() && message.trim();

  async function handlePost(e) {
    e.preventDefault();
    if (!canSubmit) return;
    await announcementService.createAnnouncement({
      companyId,
      postedBy: user.id,
      title,
      message,
    });
    setTitle('');
    setMessage('');
    setShowForm(false);
    await loadFeed();
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Company Feed</h1>
        {user.role === 'admin' && (
          <CandyButton variant="primary" onClick={() => setShowForm((v) => !v)}>
            + New Announcement
          </CandyButton>
        )}
      </div>

      {showForm && (
        <OutlinedCard className="p-6 mt-6 max-w-xl">
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label htmlFor="title" className="block font-bold text-sm mb-1.5">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Office closed on Friday"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="message" className="block font-bold text-sm mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What does everyone need to know?"
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
            <CandyButton type="submit" variant="primary" disabled={!canSubmit} className="w-full">
              Post Announcement
            </CandyButton>
          </form>
        </OutlinedCard>
      )}

      <div className="mt-8 space-y-4 pb-10">
        {announcements.length === 0 ? (
          <p className="text-muted font-bold">No announcements yet.</p>
        ) : (
          announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} posterName={posterName(a.postedBy)} />
          ))
        )}
      </div>
    </CompanyAppShell>
  );
}
