export function Header({ activity = { status: 'idle', label: 'Siap Lari', phase: '' } }) {
  const { status = 'idle', label = 'Siap Lari', phase = '' } = activity;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-center px-4 pt-3 pb-2 bg-transparent select-none">
      {/* Floating Dynamic Island / Notch Capsule */}
      <div className="flex items-center gap-3 rounded-full bg-neutral-950 text-white px-3.5 py-1.5 shadow-xl border border-neutral-800/90 backdrop-blur-md transition-all duration-300 hover:scale-[1.02]">
        {/* Logo App */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden bg-neutral-900 border border-neutral-700/60 shadow-inner">
          <img
            src="/logo.png"
            alt="Andaro Logo"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Brand & Dynamic Live Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-tight text-white leading-none">
            Andaro
          </span>
          <span className="h-1 w-1 rounded-full bg-neutral-600"></span>

          {/* Teks Status Dinamis Berdasarkan Aktivitas Lari */}
          {status === 'running' && (
            <span
              className={`text-[11px] font-semibold leading-none flex items-center gap-1 ${
                phase === 'walk' ? 'text-sky-400' : 'text-amber-400'
              }`}
            >
              <span>{phase === 'walk' ? '🚶' : '🏃'}</span>
              <span>{label || (phase === 'walk' ? 'Jalan' : 'Berlari')}</span>
            </span>
          )}

          {status === 'paused' && (
            <span className="text-[11px] text-amber-300 font-medium leading-none flex items-center gap-1">
              <span>⏸️</span>
              <span>{label || 'Dijeda'}</span>
            </span>
          )}

          {status === 'finished' && (
            <span className="text-[11px] text-emerald-400 font-semibold leading-none flex items-center gap-1">
              <span>🎉</span>
              <span>{label || 'Selesai'}</span>
            </span>
          )}

          {status === 'idle' && (
            <span className="text-[11px] text-neutral-400 font-medium leading-none">
              {label || 'Siap Lari'}
            </span>
          )}
        </div>

        {/* Dynamic Indicator Dot / Badge */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-neutral-800">
          {status === 'running' ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-tight leading-none">
                LIVE
              </span>
            </>
          ) : status === 'paused' ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span className="text-[10px] font-medium text-amber-400 tracking-tight leading-none">
                PAUSE
              </span>
            </>
          ) : status === 'finished' ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] font-medium text-emerald-400 tracking-tight leading-none">
                DONE
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500/80"></span>
              <span className="text-[10px] font-medium text-neutral-400 tracking-tight leading-none">
                READY
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
