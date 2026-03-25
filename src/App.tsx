import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Square, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from './store';
import { ProjectHome } from './components/ProjectHome';
import { Wizard } from './components/Wizard';
import { SettingsDialog } from './components/SettingsDialog';

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    window.electron?.minimize?.();
  };
  const handleMaximize = () => {
    window.electron?.maximize?.();
  };
  const handleClose = () => {
    window.electron?.close?.();
  };

  return (
    <div className="titlebar-drag h-10 flex items-center justify-between px-4 bg-[var(--bg-secondary)]/60 border-b border-[var(--border-subtle)] select-none flex-shrink-0">
      {/* App title */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
        <span className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
          CBE Generator
        </span>
      </div>

      {/* Window controls */}
      <div className="titlebar-no-drag flex items-center gap-1">
        {[
          { icon: Minus, action: handleMinimize, hoverBg: 'hover:bg-white/10' },
          { icon: Square, action: handleMaximize, hoverBg: 'hover:bg-white/10' },
          { icon: X, action: handleClose, hoverBg: 'hover:bg-red-500/80' },
        ].map(({ icon: Icon, action, hoverBg }, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={action}
            className={clsx(
              'p-1.5 rounded-md text-[var(--text-muted)]',
              'hover:text-white transition-colors cursor-pointer',
              hoverBg
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Extend window for Electron IPC
declare global {
  interface Window {
    electron?: {
      minimize?: () => void;
      maximize?: () => void;
      close?: () => void;
    };
  }
}

const App: React.FC = () => {
  const { currentProject } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      <TitleBar />
      <div className="flex-1 overflow-hidden">
        {currentProject ? <Wizard /> : <ProjectHome />}
      </div>
      <SettingsDialog />
    </div>
  );
};

export default App;
