import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import ChecklistItem from '../components/ChecklistItem.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { checklistService } from '../services/checklistService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-2.5 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

function TaskSection({ title, tasks, onToggle, onAdd }) {
  const [newTitle, setNewTitle] = useState('');
  const done = tasks.filter((t) => t.isCompleted).length;

  return (
    <OutlinedCard className="p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="font-display font-extrabold text-lg">{title}</h2>
        <span className="text-xs font-bold text-muted">
          {done}/{tasks.length} done
        </span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <ChecklistItem key={task.id} task={task} onToggle={onToggle} />
        ))}
      </div>
      <div className="flex gap-3 mt-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTitle.trim()) {
              e.preventDefault();
              onAdd(newTitle);
              setNewTitle('');
            }
          }}
          placeholder="Add a custom task"
          className={INPUT_CLASS}
        />
        <CandyButton
          type="button"
          variant="mustard"
          small
          className="rounded-full whitespace-nowrap"
          disabled={!newTitle.trim()}
          onClick={() => {
            onAdd(newTitle);
            setNewTitle('');
          }}
        >
          + Add
        </CandyButton>
      </div>
    </OutlinedCard>
  );
}

export default function EmployeeChecklist() {
  const navigate = useNavigate();
  const { companyId, employeeId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);

  const loadTasks = useCallback(async () => {
    setTasks(await checklistService.getTasksForEmployee(employeeId));
  }, [employeeId]);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (!['admin', 'hr'].includes(current.role)) {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/dashboard/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/employees/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      const emp = await employeeService.getEmployeeById(employeeId);
      if (!found || !emp || emp.companyId !== companyId) {
        navigate(`/employees/${companyId}`, { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      setEmployee(emp);
      await loadTasks();
    }
    load();
  }, [navigate, companyId, employeeId, loadTasks]);

  if (!user || !company || !employee) return null;

  const onboarding = tasks.filter((t) => t.type === 'onboarding');
  const offboarding = tasks.filter((t) => t.type === 'offboarding');

  async function handleToggle(taskId) {
    await checklistService.toggleTask(taskId);
    await loadTasks();
  }

  async function handleAdd(type, title) {
    await checklistService.addTask({ companyId, employeeId, type, title });
    await loadTasks();
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
        {employee.name}
        <span className="text-muted text-2xl"> — Checklist</span>
      </h1>

      <div className="max-w-2xl space-y-6 mt-8 pb-10">
        {onboarding.length > 0 && (
          <TaskSection
            title="Onboarding"
            tasks={onboarding}
            onToggle={handleToggle}
            onAdd={(title) => handleAdd('onboarding', title)}
          />
        )}
        {offboarding.length > 0 && (
          <TaskSection
            title="Offboarding"
            tasks={offboarding}
            onToggle={handleToggle}
            onAdd={(title) => handleAdd('offboarding', title)}
          />
        )}
        {onboarding.length === 0 && offboarding.length === 0 && (
          <p className="text-muted font-bold">No checklist tasks for this employee yet.</p>
        )}
      </div>
    </CompanyAppShell>
  );
}
