import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import ConfettiBackground from '../components/ConfettiBackground.jsx';
import MarkerHighlight from '../components/MarkerHighlight.jsx';
import { authService } from '../services/authService.js';
import { APP_NAME } from '../theme.js';

function LogoMark() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="w-11 h-11 rounded-icon bg-gradient-to-br from-[#A78BFA] to-violet shadow-clayButton flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 14">
          <rect x="0" y="0" width="6" height="6" rx="1" fill="#ffffff" />
          <rect x="8" y="0" width="6" height="6" rx="1" fill="#ffffff" />
          <rect x="0" y="8" width="6" height="6" rx="1" fill="#ffffff" />
          <rect x="8" y="8" width="6" height="6" rx="1" fill="#ffffff" />
        </svg>
      </div>
      <span className="font-display font-black text-2xl tracking-tight">{APP_NAME}</span>
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

function destinationFor(user) {
  return user.role === 'superadmin' ? '/super-admin' : `/dashboard/${user.companyId}`;
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (!user) return;
      navigate(destinationFor(user), { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await authService.login(email, password);
      navigate(destinationFor(user));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <ConfettiBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <LogoMark />
          <h2 className="font-display font-extrabold text-[28px] leading-tight mt-6">
            Run your people ops with <MarkerHighlight>real discipline</MarkerHighlight>.
          </h2>
          <p className="font-body text-base text-muted max-w-[380px] mx-auto mt-6">
            Attendance, leave, payroll, and your entire org, in one structured system
            instead of five scattered tools.
          </p>
        </div>
        <OutlinedCard className="p-8 !rounded-shell">
          <h1 className="font-display font-extrabold text-3xl mb-6">Log in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-bold text-sm mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-bold text-sm mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={INPUT_CLASS}
              />
            </div>
            {error && <p className="text-coral font-bold text-sm">{error}</p>}
            <CandyButton type="submit" variant="primary" className="w-full mt-2">
              Log in
            </CandyButton>
          </form>
          <p className="text-sm mt-6 text-center text-muted">
            Forgot your password? Contact your admin.
          </p>
        </OutlinedCard>
      </div>
    </div>
  );
}
