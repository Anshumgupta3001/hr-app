import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import ConfettiBackground from '../components/ConfettiBackground.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then((current) => {
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
    });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    if (!newPassword) {
      setError('Enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    try {
      const updated = await authService.changePassword(currentPassword, newPassword);
      setUser(updated);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <ConfettiBackground calm />
      <div className="relative z-10 w-full max-w-md">
        <OutlinedCard className="p-8">
          <BackButton className="mb-4" />
          <h1 className="font-display font-extrabold text-3xl mb-6">Change Password</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block font-bold text-sm mb-1.5">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block font-bold text-sm mb-1.5">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block font-bold text-sm mb-1.5">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            {error && <p className="text-coral font-bold text-sm">{error}</p>}
            {saved && <p className="text-teal font-bold text-sm">Password updated.</p>}
            <CandyButton type="submit" variant="primary" className="w-full mt-2">
              Update Password
            </CandyButton>
          </form>
        </OutlinedCard>
      </div>
    </div>
  );
}
