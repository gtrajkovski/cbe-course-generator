import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../store';
import { Sidebar } from './Sidebar';
import { PhaseGate } from './PhaseGate';
import { VoiceInput } from './VoiceInput';
import { Button } from './ui/Button';

// Phase components
import { Phase0_CCWIntake } from './phases/Phase0_CCWIntake';
import { Phase1_CourseDesign } from './phases/Phase1_CourseDesign';
import { Phase2_EvidenceStatements } from './phases/Phase2_EvidenceStatements';
import { Phase3_TaskSplitting } from './phases/Phase3_TaskSplitting';
import { Phase4_TaskModel } from './phases/Phase4_TaskModel';
import { Phase5_PATasks } from './phases/Phase5_PATasks';
import { Phase6_SupportingDocs } from './phases/Phase6_SupportingDocs';
import { Phase7_SSD } from './phases/Phase7_SSD';
import { Phase8_KnowledgeChecks } from './phases/Phase8_KnowledgeChecks';
import { Phase9_CourseContent } from './phases/Phase9_CourseContent';
import { Phase10_SampleResponses } from './phases/Phase10_SampleResponses';
import { Phase11_Feedback } from './phases/Phase11_Feedback';
import { Phase12_Versioning } from './phases/Phase12_Versioning';
import { Phase13_Audit } from './phases/Phase13_Audit';

const PHASE_COMPONENTS: Record<number, React.FC> = {
  0: Phase0_CCWIntake,
  1: Phase1_CourseDesign,
  2: Phase2_EvidenceStatements,
  3: Phase3_TaskSplitting,
  4: Phase4_TaskModel,
  5: Phase5_PATasks,
  6: Phase6_SupportingDocs,
  7: Phase7_SSD,
  8: Phase8_KnowledgeChecks,
  9: Phase9_CourseContent,
  10: Phase10_SampleResponses,
  11: Phase11_Feedback,
  12: Phase12_Versioning,
  13: Phase13_Audit,
};

const PhaseContent: React.FC<{ phase: number }> = ({ phase }) => {
  const { phases } = useAppStore();
  const currentPhaseData = phases[phase];
  const PhaseComponent = PHASE_COMPONENTS[phase];

  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-1 p-8 overflow-y-auto"
    >
      <div className="max-w-3xl mx-auto">
        {/* Phase header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              Phase {phase}
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">
              {phase + 1} of {phases.length}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {currentPhaseData?.name}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {phase <= 5
              ? 'Complete the fields below to progress through this phase. Use AI generation or voice input for faster completion.'
              : 'This phase is coming soon. Complete earlier phases to unlock more features.'}
          </p>
        </div>

        {/* Phase-specific content */}
        {PhaseComponent ? (
          <PhaseComponent />
        ) : (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="text-sm text-[var(--text-secondary)] mb-4 font-medium">
                Phase {phase}: {currentPhaseData?.name} — coming soon.
              </div>
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const Wizard: React.FC = () => {
  const {
    currentPhase,
    phases,
    goNextPhase,
    goPrevPhase,
    openPhaseGate,
    validatePhase,
    settings,
  } = useAppStore();

  const isFirstPhase = currentPhase === 0;
  const isLastPhase = currentPhase === phases.length - 1;
  const hasApiKey = settings.apiKey.length > 0;

  const handleNext = () => {
    // Run validation via store
    const errors = validatePhase(currentPhase);
    const checks = errors.length === 0
      ? [
          { label: 'All required fields completed', passed: true },
          { label: 'Data validated against schema', passed: true },
          { label: 'Ready to proceed', passed: true },
        ]
      : errors.map((err) => ({ label: err, passed: false }));

    openPhaseGate(checks);
  };

  const handleGenerate = () => {
    console.log('AI Generation triggered for phase', currentPhase);
  };

  const handleExport = () => {
    console.log('Export triggered');
  };

  const handleVoiceTranscript = (text: string) => {
    console.log('Voice transcript:', text);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col relative">
        {/* Phase content with transitions */}
        <AnimatePresence mode="wait">
          <PhaseContent phase={currentPhase} />
        </AnimatePresence>

        {/* Floating action bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={clsx(
              'flex items-center justify-between gap-4',
              'px-5 py-3 rounded-2xl',
              'bg-[var(--bg-secondary)]/80 backdrop-blur-xl',
              'border border-[var(--border-subtle)]',
              'shadow-2xl shadow-black/20'
            )}
          >
            {/* Left: Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
                onClick={goPrevPhase}
                disabled={isFirstPhase}
              >
                Back
              </Button>
              <span className="text-xs text-[var(--text-muted)] px-2">
                {currentPhase + 1} / {phases.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={isLastPhase}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Center: Voice input */}
            {settings.voiceEnabled && (
              <VoiceInput onTranscript={handleVoiceTranscript} />
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<FileDown className="w-4 h-4" />}
                onClick={handleExport}
              >
                Export .docx
              </Button>
              <motion.div
                animate={
                  hasApiKey
                    ? {
                        boxShadow: [
                          '0 0 0px rgba(99,102,241,0)',
                          '0 0 20px rgba(99,102,241,0.3)',
                          '0 0 0px rgba(99,102,241,0)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-xl"
              >
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={handleGenerate}
                >
                  Generate with AI
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Phase Gate overlay */}
      <PhaseGate />
    </div>
  );
};
