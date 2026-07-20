export default function OutlinedCard({ children, className = '' }) {
  return (
    <div
      className={`bg-white/70 backdrop-blur-xl rounded-card shadow-clayCard ${className}`}
    >
      {children}
    </div>
  );
}
