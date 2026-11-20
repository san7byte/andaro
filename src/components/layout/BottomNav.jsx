import { Timer, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl select-none">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Tab 1: Timer Lari */}
        <button
          type="button"
          onClick={() => onTabChange('timer')}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-all duration-200 active:scale-95',
            activeTab === 'timer'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200',
              activeTab === 'timer' ? 'bg-primary/10 shadow-2xs' : 'bg-transparent'
            )}
          >
            <Timer className={cn('h-5 w-5', activeTab === 'timer' ? 'stroke-[2.5]' : 'stroke-[1.8]')} />
          </div>
          <span className="text-[11px] leading-none tracking-tight">Timer Lari</span>
        </button>

        {/* Tab 2: Riwayat */}
        <button
          type="button"
          onClick={() => onTabChange('history')}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-all duration-200 active:scale-95',
            activeTab === 'history'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200',
              activeTab === 'history' ? 'bg-primary/10 shadow-2xs' : 'bg-transparent'
            )}
          >
            <History className={cn('h-5 w-5', activeTab === 'history' ? 'stroke-[2.5]' : 'stroke-[1.8]')} />
          </div>
          <span className="text-[11px] leading-none tracking-tight">Riwayat</span>
        </button>
      </div>
    </nav>
  );
}
