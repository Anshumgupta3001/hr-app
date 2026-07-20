import OutlinedCard from './OutlinedCard.jsx';
import CandyButton from './CandyButton.jsx';

export default function CompanyCard({ company, employeeCount, admin, onEdit, onDelete }) {
  return (
    <OutlinedCard className="p-6 flex flex-col hover:-translate-y-2 hover:shadow-clayCardHover transition-all duration-150">
      <h3 className="font-display font-extrabold text-xl">{company.name}</h3>
      <p className="text-sm text-muted mt-0.5">{company.industry || '—'}</p>
      <span className="inline-flex self-start items-center rounded-full bg-clay-input text-muted px-3 py-1 text-xs font-bold mt-3">
        {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}
      </span>
      <div className="mt-4 pt-4 border-t-2 border-ink/5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Admin</p>
        {admin ? (
          <>
            <p className="font-bold text-sm mt-1">{admin.name}</p>
            <p className="text-xs text-muted truncate">{admin.email}</p>
          </>
        ) : (
          <p className="text-sm text-muted mt-1">No admin assigned</p>
        )}
      </div>
      <div className="mt-5 flex gap-3">
        <CandyButton variant="secondary" small onClick={onEdit}>
          Edit
        </CandyButton>
        <CandyButton variant="primary" small onClick={onDelete}>
          Delete
        </CandyButton>
      </div>
    </OutlinedCard>
  );
}
