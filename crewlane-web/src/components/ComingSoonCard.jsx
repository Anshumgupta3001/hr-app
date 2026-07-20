const ACCENTS = {
  coral: 'bg-coral',
  teal: 'bg-teal',
  violet: 'bg-violet',
  mustard: 'bg-mustard',
  sky: 'bg-sky',
};

export default function ComingSoonCard({ icon, accent = 'coral', title, description }) {
  return (
    <div
      aria-disabled="true"
      className="relative bg-white/70 backdrop-blur-xl rounded-card shadow-clayCard p-6 cursor-not-allowed select-none"
    >
      <span className="absolute top-5 right-5 rounded-full bg-clay-input text-muted text-[11px] font-bold px-3 py-1">
        Coming Soon
      </span>
      <div className="opacity-50">
        <div
          className={`w-11 h-11 rounded-icon flex items-center justify-center ${ACCENTS[accent]} shadow-clayButton`}
        >
          {icon}
        </div>
        <h3 className="font-display font-extrabold text-lg mt-4">{title}</h3>
        <p className="text-sm mt-1 text-muted">{description}</p>
      </div>
    </div>
  );
}
