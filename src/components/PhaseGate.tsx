import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../store';
import { Button } from './ui/Button';

export const PhaseGate: React.FC = () => {
  const { phaseGateOpen, phaseGateChecks, closePhaseGate, goNextPhase, currentPhase, phases } =
    useAppStore();

  const allPassed = phaseGateChecks.every((c) => c.passed);

  const handleContinue = () => {
    closePhaseGate();
    goNextPhase();
  };

  return (
    <AnimatePresence>
      {phaseGateOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closePhaseGate}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card p-6 w-full max-w-md mx-4"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-[var(--accent)]/10">
                <ShieldCheck className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Phase Gate Check
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Phase {currentPhase}: {phases[currentPhase]?.name}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 mb-6">
              {phaseGateChecks.map((check, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl',
                    'bg-white/[0.02] border',
                    check.passed
                      ? 'border-green-500/20'
                      : 'border-red-500/20'
                  )}
                >
                  {check.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
                  )}
                  <span
                    className={clsx(
                      'text-sm',
                      check.passed ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    )}
                  >
                    {check.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={closePhaseGate}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleContinue}
                disabled={!allPassed}
              >
                {allPassed ? 'Continue to Next Phase' : 'Checks Incomplete'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
