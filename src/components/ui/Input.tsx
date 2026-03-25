import React, { forwardRef } from 'react';
import { Mic } from 'lucide-react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showVoice?: boolean;
  onVoiceClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, showVoice, onVoiceClick, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-2.5 rounded-xl text-sm',
              'bg-white/[0.03] backdrop-blur-sm',
              'border border-[var(--border-subtle)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'focus:outline-none focus:border-[var(--border-active)]',
              'focus:ring-2 focus:ring-[var(--accent)]/20',
              'transition-all duration-200',
              showVoice && 'pr-10',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {showVoice && (
            <button
              type="button"
              onClick={onVoiceClick}
              className={clsx(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'p-1.5 rounded-lg',
                'text-[var(--text-muted)] hover:text-[var(--accent)]',
                'hover:bg-[var(--accent)]/10',
                'transition-all duration-200'
              )}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
