export default function MarkerHighlight({ children, gradient = false }) {
  if (gradient) {
    return (
      <span
        className="bg-gradient-to-br from-ink from-20% via-violet via-60% to-coral bg-clip-text text-transparent"
      >
        {children}
      </span>
    );
  }
  return <span className="text-violet">{children}</span>;
}
