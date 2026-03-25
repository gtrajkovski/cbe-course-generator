import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Brain,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type {
  KnowledgeCheck,
  KnowledgeCheckOption,
  CognitiveLevel,
  SSDSection,
  SSDLesson,
} from '../../lib/types';
import { COGNITIVE_LEVEL_LABELS } from '../../lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';

// ── Cognitive level badge ──────────────────────────────────────
const CognitiveBadge: React.FC<{ level: CognitiveLevel }> = ({ level }) => {
  const colors: Record<CognitiveLevel, string> = {
    1: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
    2: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    3: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    4: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    5: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    6: 'bg-red-500/15 text-red-400 border-red-500/25',
  };
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border', colors[level])}>
      <Brain className="w-3 h-3" />
      L{level}: {COGNITIVE_LEVEL_LABELS[level]}
    </span>
  );
};

// ── Single KC card ─────────────────────────────────────────────
interface KCCardProps {
  kc: KnowledgeCheck;
  index: number;
  onUpdate: (id: string, partial: Partial<KnowledgeCheck>) => void;
  onRemove: (id: string) => void;
}

const KCCard: React.FC<KCCardProps> = ({ kc, index, onUpdate, onRemove }) => {
  const [expanded, setExpanded] = useState(false);

  const updateOption = (optIndex: number, partial: Partial<KnowledgeCheckOption>) => {
    const newOptions = kc.options.map((opt, i) => (i === optIndex ? { ...opt, ...partial } : opt));
    onUpdate(kc.id, { options: newOptions });
  };

  const setCorrect = (optIndex: number) => {
    const newOptions = kc.options.map((opt, i) => ({ ...opt, isCorrect: i === optIndex }));
    onUpdate(kc.id, { options: newOptions });
  };

  const correctIndex = kc.options.findIndex((o) => o.isCorrect);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
            Q{index + 1}
          </span>
          <p className="text-sm text-[var(--text-primary)] truncate">{kc.stem || 'New question...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <CognitiveBadge level={kc.cognitiveLevel} />
          {correctIndex >= 0 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
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
              {/* Question stem */}
              <TextArea
                label="Question Stem"
                value={kc.stem}
                onChange={(e) => onUpdate(kc.id, { stem: e.target.value })}
                placeholder="Enter the question..."
                rows={2}
              />

              {/* Cognitive level selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Cognitive Level</label>
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5, 6] as CognitiveLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => onUpdate(kc.id, { cognitiveLevel: level })}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                        kc.cognitiveLevel === level
                          ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                          : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:bg-white/[0.03]'
                      )}
                    >
                      L{level}
                    </button>
                  ))}
                </div>
              </div>

              {/* ES Alignment */}
              <Input
                label="ES Alignment Code"
                value={kc.esAlignment}
                onChange={(e) => onUpdate(kc.id, { esAlignment: e.target.value })}
                placeholder="e.g., ES1.1"
              />

              {/* Options with radio preview */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Answer Options</label>
                {kc.options.map((opt, i) => (
                  <div key={i} className={clsx(
                    'p-3 rounded-xl border transition-all',
                    opt.isCorrect
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-white/[0.01] border-[var(--border-subtle)]'
                  )}>
                    <div className="flex items-start gap-3">
                      {/* Radio button preview */}
                      <button
                        onClick={() => setCorrect(i)}
                        className="mt-1 flex-shrink-0"
                      >
                        <div className={clsx(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                          opt.isCorrect ? 'border-emerald-400' : 'border-[var(--text-muted)]'
                        )}>
                          {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                        </div>
                      </button>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={opt.text}
                          onChange={(e) => updateOption(i, { text: e.target.value })}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className="text-sm"
                        />
                        <TextArea
                          value={opt.feedback}
                          onChange={(e) => updateOption(i, { feedback: e.target.value })}
                          placeholder={opt.isCorrect ? 'Correct! Explain why this is right...' : 'Explain why this is incorrect...'}
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    </div>
                    {opt.isCorrect && (
                      <div className="mt-2 ml-7 flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Correct Answer
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => onRemove(kc.id)}>
                  Remove Question
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Audit runner ───────────────────────────────────────────────
interface AuditResult {
  label: string;
  passed: boolean;
  details: string;
}

function runKCAudit(kcs: KnowledgeCheck[], sections: SSDSection[]): AuditResult[] {
  const results: AuditResult[] = [];
  const allLessons = sections.flatMap((s) => s.lessons);

  // Pass 1: 4 questions per lesson
  const lessonCounts = new Map<string, number>();
  for (const kc of kcs) {
    lessonCounts.set(kc.lessonId, (lessonCounts.get(kc.lessonId) || 0) + 1);
  }
  const lessonsWithout4 = allLessons.filter((l) => (lessonCounts.get(l.id) || 0) < 4);
  results.push({
    label: '4 questions per lesson',
    passed: lessonsWithout4.length === 0,
    details: lessonsWithout4.length > 0
      ? `${lessonsWithout4.length} lessons have fewer than 4 questions`
      : 'All lessons have 4+ questions',
  });

  // Pass 2: 4 options per question
  const under4Options = kcs.filter((kc) => kc.options.length < 4);
  results.push({
    label: '4 options per question',
    passed: under4Options.length === 0,
    details: under4Options.length > 0
      ? `${under4Options.length} questions have fewer than 4 options`
      : 'All questions have 4 options',
  });

  // Pass 3: Exactly 1 correct answer
  const badCorrect = kcs.filter((kc) => kc.options.filter((o) => o.isCorrect).length !== 1);
  results.push({
    label: 'Exactly 1 correct answer per question',
    passed: badCorrect.length === 0,
    details: badCorrect.length > 0
      ? `${badCorrect.length} questions don't have exactly 1 correct answer`
      : 'All questions have exactly 1 correct answer',
  });

  // Pass 4: All options have feedback
  const missingFeedback = kcs.filter((kc) => kc.options.some((o) => !o.feedback.trim()));
  results.push({
    label: 'All options have feedback',
    passed: missingFeedback.length === 0,
    details: missingFeedback.length > 0
      ? `${missingFeedback.length} questions have options missing feedback`
      : 'All options have feedback text',
  });

  // Pass 5: Correct answer feedback starts with "Correct!"
  const badCorrectFeedback = kcs.filter((kc) => {
    const correct = kc.options.find((o) => o.isCorrect);
    return correct && !correct.feedback.startsWith('Correct!');
  });
  results.push({
    label: 'Correct feedback starts with "Correct!"',
    passed: badCorrectFeedback.length === 0,
    details: badCorrectFeedback.length > 0
      ? `${badCorrectFeedback.length} correct answers don't start with "Correct!"`
      : 'All correct feedbacks properly formatted',
  });

  // Pass 6: ES alignment present
  const missingES = kcs.filter((kc) => !kc.esAlignment.trim());
  results.push({
    label: 'ES alignment specified',
    passed: missingES.length === 0,
    details: missingES.length > 0
      ? `${missingES.length} questions missing ES alignment`
      : 'All questions aligned to an ES',
  });

  // Pass 7: Cognitive levels assigned
  const missingLevel = kcs.filter((kc) => !kc.cognitiveLevel);
  results.push({
    label: 'Cognitive levels assigned',
    passed: missingLevel.length === 0,
    details: missingLevel.length > 0
      ? `${missingLevel.length} questions missing cognitive level`
      : 'All questions have cognitive levels',
  });

  return results;
}

// ── Main component ─────────────────────────────────────────────
export const Phase8_KnowledgeChecks: React.FC = () => {
  const {
    currentProject,
    setKnowledgeChecks,
    isGenerating,
    setGenerating,
  } = useAppStore();

  const [kcs, setKCs] = useState<KnowledgeCheck[]>(currentProject?.knowledgeChecks ?? []);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [auditResults, setAuditResults] = useState<AuditResult[] | null>(null);

  const sections = currentProject?.ssdSections ?? [];
  const allLessons = sections.flatMap((s) => s.lessons);

  // Default to first lesson
  const activeLessonId = selectedLessonId || allLessons[0]?.id || '';
  const lessonKCs = kcs.filter((kc) => kc.lessonId === activeLessonId);
  const activeLesson = allLessons.find((l) => l.id === activeLessonId);

  const addKC = useCallback(() => {
    const newKC: KnowledgeCheck = {
      id: crypto.randomUUID(),
      lessonId: activeLessonId,
      stem: '',
      cognitiveLevel: 2,
      options: [
        { text: '', isCorrect: true, feedback: 'Correct! ' },
        { text: '', isCorrect: false, feedback: '' },
        { text: '', isCorrect: false, feedback: '' },
        { text: '', isCorrect: false, feedback: '' },
      ],
      esAlignment: '',
    };
    setKCs((prev) => [...prev, newKC]);
  }, [activeLessonId]);

  const updateKC = useCallback((id: string, partial: Partial<KnowledgeCheck>) => {
    setKCs((prev) => prev.map((kc) => (kc.id === id ? { ...kc, ...partial } : kc)));
  }, []);

  const removeKC = useCallback((id: string) => {
    setKCs((prev) => prev.filter((kc) => kc.id !== id));
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      // Placeholder for Claude API KC generation
    } finally {
      setGenerating(false);
    }
  }, [setGenerating]);

  const runAudit = useCallback(() => {
    setAuditResults(runKCAudit(kcs, sections));
  }, [kcs, sections]);

  const handleExport = useCallback(() => {
    // Export as .txt in OEX spec format
    let output = '';
    for (const section of sections) {
      output += `=== ${section.title} ===\n\n`;
      for (const lesson of section.lessons) {
        output += `--- ${lesson.title} ---\n\n`;
        const lessonChecks = kcs.filter((kc) => kc.lessonId === lesson.id);
        for (let q = 0; q < lessonChecks.length; q++) {
          const kc = lessonChecks[q];
          output += `Question ${q + 1}:\n`;
          output += `${kc.stem}\n\n`;
          for (let o = 0; o < kc.options.length; o++) {
            const opt = kc.options[o];
            const letter = String.fromCharCode(65 + o);
            output += `  ${letter}. ${opt.text}${opt.isCorrect ? ' *' : ''}\n`;
            output += `     Feedback: ${opt.feedback}\n`;
          }
          output += `\n  Cognitive Level: ${COGNITIVE_LEVEL_LABELS[kc.cognitiveLevel]}\n`;
          output += `  ES Alignment: ${kc.esAlignment}\n\n`;
        }
      }
    }

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge_checks.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [kcs, sections]);

  const handleSave = useCallback(() => {
    setKnowledgeChecks(kcs);
  }, [kcs, setKnowledgeChecks]);

  if (!currentProject) return null;

  return (
    <div className="space-y-6">
      {/* Lesson selector */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5">
        <label className="text-sm font-medium text-[var(--text-secondary)] mb-3 block">Select Lesson</label>
        <div className="flex flex-wrap gap-2">
          {sections.map((section) =>
            section.lessons.map((lesson) => {
              const count = kcs.filter((k) => k.lessonId === lesson.id).length;
              return (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                    activeLessonId === lesson.id
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'text-[var(--text-muted)] bg-white/[0.02] border-[var(--border-subtle)] hover:bg-white/[0.05]'
                  )}
                >
                  {lesson.title}
                  <span className={clsx('ml-1.5', count >= 4 ? 'text-emerald-400' : 'text-amber-400')}>
                    ({count}/4)
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {activeLesson?.title ?? 'Select a lesson'} &mdash; Knowledge Checks ({lessonKCs.length}/4)
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Shield className="w-3.5 h-3.5" />} onClick={runAudit}>
            7-Pass Audit
          </Button>
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExport}>
            Export .txt
          </Button>
          <Button variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />} onClick={handleGenerate} loading={isGenerating}>
            Generate KCs
          </Button>
        </div>
      </div>

      {/* KC cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {lessonKCs.map((kc, i) => (
            <KCCard key={kc.id} kc={kc} index={i} onUpdate={updateKC} onRemove={removeKC} />
          ))}
        </AnimatePresence>

        <Button variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addKC}>
          Add Question
        </Button>
      </div>

      {/* Audit results */}
      <AnimatePresence>
        {auditResults && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5 space-y-3"
          >
            <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              7-Pass Audit Results
            </h4>
            {auditResults.map((result, i) => (
              <div
                key={i}
                className={clsx(
                  'flex items-center justify-between p-3 rounded-xl border',
                  result.passed
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                )}
              >
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm text-[var(--text-primary)]">{result.label}</span>
                </div>
                <span className={clsx('text-xs', result.passed ? 'text-emerald-400' : 'text-red-400')}>
                  {result.details}
                </span>
              </div>
            ))}
            <div className="text-right">
              <span className={clsx(
                'text-sm font-bold',
                auditResults.every((r) => r.passed) ? 'text-emerald-400' : 'text-amber-400'
              )}>
                {auditResults.filter((r) => r.passed).length}/{auditResults.length} checks passed
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleSave}>
          Save Knowledge Checks
        </Button>
      </div>
    </div>
  );
};
