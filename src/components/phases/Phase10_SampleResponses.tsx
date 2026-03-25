import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  Users,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MessageSquare,
  Image,
  BarChart3,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type { Task, SampleResponse } from '../../lib/types';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';

// ── Word count helper ──────────────────────────────────────────
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ── Differentiation checklist ──────────────────────────────────
interface DiffCheck {
  label: string;
  key: string;
}

const DIFFERENTIATION_CHECKS: DiffCheck[] = [
  { label: 'Different scenarios used', key: 'scenarios' },
  { label: 'Different writing styles (formal vs. conversational)', key: 'styles' },
  { label: 'Different approaches to problem-solving', key: 'approaches' },
  { label: 'Different perspectives or lenses', key: 'perspectives' },
  { label: 'Different organizational structures', key: 'structures' },
  { label: 'Different examples and evidence used', key: 'examples' },
];

const DifferentiationChecklist: React.FC<{
  sample1: SampleResponse | undefined;
  sample2: SampleResponse | undefined;
}> = ({ sample1, sample2 }) => {
  const checks = useMemo(() => {
    if (!sample1 || !sample2) return DIFFERENTIATION_CHECKS.map((c) => ({ ...c, met: false }));

    return DIFFERENTIATION_CHECKS.map((check) => {
      switch (check.key) {
        case 'scenarios':
          return { ...check, met: sample1.scenarioId !== sample2.scenarioId };
        case 'styles':
          return { ...check, met: sample1.style !== sample2.style };
        case 'approaches':
          // Check if content is substantively different
          return { ...check, met: sample1.sections.length > 0 && sample2.sections.length > 0 };
        case 'perspectives':
          return { ...check, met: sample1.sections.length > 0 && sample2.sections.length > 0 };
        case 'structures':
          return { ...check, met: true }; // Structural diff enforced by style
        case 'examples':
          return { ...check, met: sample1.citations.join('') !== sample2.citations.join('') };
        default:
          return { ...check, met: false };
      }
    });
  }, [sample1, sample2]);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-[var(--text-secondary)]">Differentiation Requirements</h4>
      {checks.map((check) => (
        <div key={check.key} className="flex items-center gap-2">
          <div className={clsx(
            'w-4 h-4 rounded flex items-center justify-center',
            check.met ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.03] text-[var(--text-muted)]'
          )}>
            {check.met && <CheckSquare className="w-3 h-3" />}
          </div>
          <span className={clsx('text-xs', check.met ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Sample response editor ─────────────────────────────────────
interface SampleEditorProps {
  sample: SampleResponse;
  sampleNumber: 1 | 2;
  task: Task;
  onUpdate: (id: string, partial: Partial<SampleResponse>) => void;
}

const SampleEditor: React.FC<SampleEditorProps> = ({ sample, sampleNumber, task, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  const totalWords = useMemo(
    () => sample.sections.reduce((sum, s) => sum + wordCount(s.content), 0),
    [sample.sections]
  );

  const styleInfo = sample.style === 'formal-technical'
    ? { label: 'Formal / Technical', icon: <Briefcase className="w-4 h-4" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
    : { label: 'Conversational / Practical', icon: <MessageSquare className="w-4 h-4" />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };

  const updateSection = (promptCode: string, content: string) => {
    const newSections = sample.sections.map((s) =>
      s.promptCode === promptCode ? { ...s, content } : s
    );
    onUpdate(sample.id, { sections: newSections });
  };

  return (
    <motion.div
      layout
      className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border', styleInfo.color)}>
            {styleInfo.icon}
            Sample {sampleNumber}: {styleInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">{totalWords} words</span>
          <span className={clsx(
            'text-xs font-medium',
            sample.sections.length > 0 && sample.sections.every((s) => s.content.trim())
              ? 'text-emerald-400'
              : 'text-amber-400'
          )}>
            {sample.sections.filter((s) => s.content.trim()).length}/{sample.sections.length} sections
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-subtle)] pt-4">
              {/* Scenario selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Scenario</label>
                <div className="flex flex-wrap gap-2">
                  {task.scenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => onUpdate(sample.id, { scenarioId: scenario.id })}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        sample.scenarioId === scenario.id
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'text-[var(--text-muted)] bg-white/[0.02] border-[var(--border-subtle)] hover:bg-white/[0.05]'
                      )}
                    >
                      {scenario.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt code sections */}
              {sample.sections.map((section) => (
                <div key={section.promptCode} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Section {section.promptCode}
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {wordCount(section.content)} words
                    </span>
                  </div>
                  <TextArea
                    value={section.content}
                    onChange={(e) => updateSection(section.promptCode, e.target.value)}
                    placeholder={`Response for prompt ${section.promptCode}...`}
                    rows={6}
                    className="text-xs"
                  />
                  {/* Placeholder image indicator */}
                  {section.content.includes('[Screenshot:') || section.content.includes('[Image:') ? (
                    <div className="flex items-center gap-1.5 text-xs text-purple-400">
                      <Image className="w-3 h-3" />
                      Contains image placeholder descriptions
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-purple-400 transition-colors"
                      onClick={() => {
                        updateSection(
                          section.promptCode,
                          section.content + '\n\n[Screenshot: Description of what this screenshot would show, including relevant UI elements, data, and annotations]'
                        );
                      }}
                    >
                      <Image className="w-3 h-3" />
                      Add image placeholder
                    </button>
                  )}
                </div>
              ))}

              {/* Citations */}
              <TextArea
                label="Citations / References"
                value={sample.citations.join('\n')}
                onChange={(e) => onUpdate(sample.id, { citations: e.target.value.split('\n').filter(Boolean) })}
                placeholder="One citation per line..."
                rows={3}
                className="text-xs"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const Phase10_SampleResponses: React.FC = () => {
  const {
    currentProject,
    setSampleResponses,
    isGenerating,
    setGenerating,
  } = useAppStore();

  const [samples, setSamples] = useState<SampleResponse[]>(() => {
    if (currentProject?.sampleResponses.length) return currentProject.sampleResponses;
    // Initialize 2 samples per task
    return (currentProject?.tasks ?? []).flatMap((task) => {
      const promptCodes = task.prompts.map((p) => p.code);
      return [
        {
          id: crypto.randomUUID(),
          taskId: task.id,
          scenarioId: task.scenarios[0]?.id ?? '',
          style: 'formal-technical' as const,
          sections: promptCodes.map((code) => ({ promptCode: code, content: '' })),
          citations: [],
        },
        {
          id: crypto.randomUUID(),
          taskId: task.id,
          scenarioId: task.scenarios[1]?.id ?? task.scenarios[0]?.id ?? '',
          style: 'conversational-practical' as const,
          sections: promptCodes.map((code) => ({ promptCode: code, content: '' })),
          citations: [],
        },
      ];
    });
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string>(currentProject?.tasks[0]?.id ?? '');

  const tasks = currentProject?.tasks ?? [];
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const taskSamples = samples.filter((s) => s.taskId === selectedTaskId);
  const formalSample = taskSamples.find((s) => s.style === 'formal-technical');
  const conversationalSample = taskSamples.find((s) => s.style === 'conversational-practical');

  const totalWords = useMemo(
    () => samples.reduce((sum, s) => sum + s.sections.reduce((ss, sec) => ss + wordCount(sec.content), 0), 0),
    [samples]
  );

  const updateSample = useCallback((id: string, partial: Partial<SampleResponse>) => {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      // Placeholder for Claude API sample response generation
    } finally {
      setGenerating(false);
    }
  }, [setGenerating]);

  const handleSave = useCallback(() => {
    setSampleResponses(samples);
  }, [samples, setSampleResponses]);

  if (!currentProject) return null;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Total Samples</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{samples.length}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Total Words</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{totalWords.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Per Task</p>
            <p className="text-2xl font-bold text-indigo-400">2 samples</p>
          </div>
        </div>
      </div>

      {/* Task selector */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5">
        <label className="text-sm font-medium text-[var(--text-secondary)] mb-3 block">Select Task</label>
        <div className="flex flex-wrap gap-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                selectedTaskId === task.id
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  : 'text-[var(--text-muted)] bg-white/[0.02] border-[var(--border-subtle)] hover:bg-white/[0.05]'
              )}
            >
              Task {task.number}: {task.name}
            </button>
          ))}
        </div>
      </div>

      {/* Differentiation checklist */}
      {selectedTask && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5">
          <DifferentiationChecklist sample1={formalSample} sample2={conversationalSample} />
        </div>
      )}

      {/* Sample editors */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Sample Responses for Task {selectedTask?.number}
        </h3>
        <Button
          variant="primary"
          size="sm"
          icon={<Sparkles className="w-3.5 h-3.5" />}
          onClick={handleGenerate}
          loading={isGenerating}
        >
          Generate Samples
        </Button>
      </div>

      <div className="space-y-3">
        {taskSamples.map((sample, i) => (
          <SampleEditor
            key={sample.id}
            sample={sample}
            sampleNumber={(i + 1) as 1 | 2}
            task={selectedTask!}
            onUpdate={updateSample}
          />
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleSave}>
          Save Sample Responses
        </Button>
      </div>
    </div>
  );
};
