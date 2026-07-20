import { useNavigate } from 'react-router-dom';

export default function BackButton({ onClick, className = '' }) {
  const navigate = useNavigate();

  function handleClick() {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      className={`w-10 h-10 rounded-full bg-white shadow-clayButton flex items-center justify-center hover:-translate-y-0.5 active:scale-[0.92] transition-all duration-150 ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#332F3A"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
