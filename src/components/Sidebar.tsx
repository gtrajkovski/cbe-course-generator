import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, Check, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../store';

export const Sidebar: React.FC = () => {
  const { phases, currentPhase, setCurrentPhase, currentProject, openSettings } = useAppStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'locked':
        return <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
      case 'in-progress':
        return <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />;
      case 'completed':
        return <Check className="w-3.5 h-3.5 text-[var(--success)]" />;
      case 'active':
        return <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-60 h-full flex flex-col bg-[var(--bg-secondary)]/50 border-r border-[var(--border-subtle)]">
      {/* Phase list */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] px-3 mb-2 font-semibold">
          Phases
        </div>
        <nav className="flex flex-col gap-0.5">
          {phases.map((phase) => {
            const isActive = phase.id === currentPhase;
            const isLocked = phase.status === 'locked';

            return (
              <motion.button
                key={phase.id}
                onClick={() => !isLocked && setCurrentPhase(phase.id)}
                whileHover={!isLocked ? { x: 2 } : undefined}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200',
                  'group cursor-pointer',
                  isActive && [
                    'bg-[var(--accent)]/10',
                    'border-l-2 border-[var(--accent)]',
                    'shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]',
                  ],
                  !isActive && !isLocked && 'hover:bg-white/[0.03]',
                  isLocked && 'opacity-60 cursor-not-allowed'
                )}
                disabled={isLocked}
              >
                {/* Phase number badge */}
                <span
                  className={clsx(
                    'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold',
                    isActive
                      ? 'bg-[var(--accent)] text-white'
                      : phase.status === 'completed'
                      ? 'bg-[var(--success)]/20 text-[var(--success)]'
                      : 'bg-white/10 text-[var(--text-secondary)]'
                  )}
                >
                  {phase.id}
                </span>

                {/* Phase name */}
                <span
                  className={clsx(
                    'flex-1 text-[13px] truncate',
                    isActive
                      ? 'text-white font-medium'
                      : 'text-[var(--text-primary)]'
                  )}
                >
                  {phase.name}
                </span>

                {/* Status icon */}
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
                  {getStatusIcon(phase.status)}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        {currentProject && (
          <div className="text-xs text-[var(--text-muted)] truncate mb-2 px-1">
            {currentProject.name}
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openSettings}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
            'text-[var(--text-secondary)] text-sm',
            'hover:bg-white/[0.03] hover:text-[var(--text-primary)]',
            'transition-all duration-200 cursor-pointer'
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </motion.button>
      </div>
    </div>
  );
};
