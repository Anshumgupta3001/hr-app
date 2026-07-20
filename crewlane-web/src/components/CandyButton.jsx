const FILLS = {
  primary: 'bg-gradient-to-br from-[#A78BFA] to-violet text-white',
  secondary: 'bg-white text-ink',
  teal: 'bg-gradient-to-br from-emerald-400 to-teal text-white',
  mustard: 'bg-gradient-to-br from-amber-400 to-mustard text-white',
};

export default function CandyButton({
  variant = 'primary',
  small = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const size = small
    ? 'px-5 py-2.5 text-sm rounded-btn'
    : 'px-7 py-3.5 text-base min-h-[56px] rounded-btn';
  const motion = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'hover:-translate-y-1 hover:shadow-clayCardHover active:scale-[0.92] active:shadow-clayPressed';

  return (
    <button
      disabled={disabled}
      className={`font-body font-bold ${FILLS[variant]} ${size} shadow-clayButton ${motion} transition-all duration-150 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
