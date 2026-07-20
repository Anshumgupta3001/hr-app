const FULL_BLOBS = [
  {
    cls: 'bg-violet/10 -top-[10%] -left-[10%] animate-clay-float',
  },
  {
    cls: 'bg-coral/10 -right-[10%] top-[20%] animate-clay-float-delayed',
  },
  {
    cls: 'bg-sky/10 -bottom-[20%] left-[30%] animate-clay-float-late',
  },
  {
    cls: 'bg-violet/10 -bottom-[25%] -right-[15%] animate-clay-float',
  },
];

const CALM_BLOBS = [
  {
    cls: 'bg-violet/10 -top-[15%] -right-[10%] animate-clay-float',
  },
  {
    cls: 'bg-sky/10 -bottom-[20%] -left-[10%] animate-clay-float-delayed',
  },
  {
    cls: 'bg-coral/10 top-[40%] -right-[20%] animate-clay-float-late',
  },
];

export default function ConfettiBackground({ calm = false }) {
  const blobs = calm ? CALM_BLOBS : FULL_BLOBS;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
    >
      {blobs.map((blob, i) => (
        <div
          key={i}
          className={`absolute w-[60vh] h-[60vh] rounded-full blur-3xl ${blob.cls}`}
        />
      ))}
    </div>
  );
}
