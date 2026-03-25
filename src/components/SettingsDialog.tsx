import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../store';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const SettingsDialog: React.FC = () => {
  const { settingsOpen, closeSettings, settings, updateSettings } = useAppStore();
  const [showKey, setShowKey] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleOpen = () => {
    setLocalSettings(settings);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    closeSettings();
  };

  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationStart={handleOpen}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeSettings}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card p-6 w-full max-w-lg mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--accent)]/10">
                  <Settings className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeSettings}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* API Key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Claude API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={localSettings.apiKey}
                    onChange={(e) =>
                      setLocalSettings((s) => ({ ...s, apiKey: e.target.value }))
                    }
                    placeholder="sk-ant-..."
                    className={clsx(
                      'w-full px-4 py-2.5 pr-10 rounded-xl text-sm',
                      'bg-white/[0.03] backdrop-blur-sm',
                      'border border-[var(--border-subtle)]',
                      'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                      'focus:outline-none focus:border-[var(--border-active)]',
                      'focus:ring-2 focus:ring-[var(--accent)]/20',
                      'transition-all duration-200 font-mono'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Model
                </label>
                <select
                  value={localSettings.model}
                  onChange={(e) =>
                    setLocalSettings((s) => ({ ...s, model: e.target.value }))
                  }
                  className={clsx(
                    'w-full px-4 py-2.5 rounded-xl text-sm appearance-none',
                    'bg-white/[0.03] backdrop-blur-sm',
                    'border border-[var(--border-subtle)]',
                    'text-[var(--text-primary)]',
                    'focus:outline-none focus:border-[var(--border-active)]',
                    'focus:ring-2 focus:ring-[var(--accent)]/20',
                    'transition-all duration-200 cursor-pointer'
                  )}
                >
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                  <option value="claude-opus-4-20250514">Claude Opus 4</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                </select>
              </div>

              {/* Export directory */}
              <Input
                label="Export Directory"
                value={localSettings.exportDir}
                onChange={(e) =>
                  setLocalSettings((s) => ({ ...s, exportDir: e.target.value }))
                }
                placeholder="C:\exports\cbe-courses"
              />

              {/* Voice toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-[var(--text-secondary)]">
                    Voice Commands
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Use microphone to dictate into fields
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setLocalSettings((s) => ({ ...s, voiceEnabled: !s.voiceEnabled }))
                  }
                  className={clsx(
                    'w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer relative',
                    localSettings.voiceEnabled ? 'bg-[var(--accent)]' : 'bg-white/10'
                  )}
                >
                  <motion.div
                    layout
                    className="absolute top-1 w-4 h-4 rounded-full bg-white"
                    style={{
                      left: localSettings.voiceEnabled ? 'calc(100% - 20px)' : '4px',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <Button variant="ghost" onClick={closeSettings}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save Settings
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
