export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-black tracking-tighter ${light ? 'bg-white text-steel-900' : 'bg-steel-900 text-white'}`}>
        T
      </span>
      <span className={`text-lg font-black tracking-[0.18em] ${light ? 'text-white' : 'text-steel-900'}`}>
        TRONIX
        <span className="text-brand-500">.</span>
      </span>
    </span>
  );
}
