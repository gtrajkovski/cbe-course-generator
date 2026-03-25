import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Lock,
  ArrowRight,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type { FeedbackComment } from '../../lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';

// ── Verdict badge ──────────────────────────────────────────────
const VERDICT_META: Record<FeedbackComment['verdict'], { label: string; icon: React.ReactNode; color: string }> = {
  ACCEPT: { label: 'Accept', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  PARTIAL: { label: 'Partial', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  DECLINE: { label: 'Decline', icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  NOTE: { label: 'Note', icon: <Info className="w-3.5 h-3.5" />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

// ── Three-lens evaluation display ──────────────────────────────
interface ThreeLensEvalProps {
  feedback: FeedbackComment;
}

const ThreeLensEval: React.FC<ThreeLensEvalProps> = ({ feedback }) => {
  const lenses = [
    {
      name: 'Substantive Merit',
      description: 'Does the feedback improve learning outcomes?',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-emerald-400',
    },
    {
      name: 'CCW Scope Alignment',
      description: 'Does it align with approved competency framework?',
      icon: <Lock className="w-4 h-4" />,
      color: 'text-amber-400',
    },
    {
      name: 'Cognitive Methodology',
      description: 'Does it respect Bloom\'s taxonomy ceiling rules?',
      icon: <RefreshCw className="w-4 h-4" />,
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {lenses.map((lens) => (
        <div
          key={lens.name}
          className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)]"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={lens.color}>{lens.icon}</span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">{lens.name}</span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">{lens.description}</p>
        </div>
      ))}
    </div>
  );
};

// ── Non-negotiable constraints ─────────────────────────────────
const NonNegotiableConstraints: React.FC = () => {
  const constraints = [
    'Competency titles cannot be modified (locked by CCW)',
    'Bloom\'s verb ceiling rules must be maintained',
    'ES scope boundaries are fixed',
    'Assessment modality cannot change',
    'Credit unit allocation is locked',
  ];

  return (
    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-2">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-red-400" />
        <span className="text-xs font-semibold text-red-400">Non-Negotiable Constraints</span>
      </div>
      {constraints.map((c, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-red-300/80">
          <span className="w-1 h-1 rounded-full bg-red-400" />
          {c}
        </div>
      ))}
    </div>
  );
};

// ── Feedback card ──────────────────────────────────────────────
interface FeedbackCardProps {
  feedback: FeedbackComment;
  onUpdate: (id: string, partial: Partial<FeedbackComment>) => void;
  onRemove: (id: string) => void;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, onUpdate, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = VERDICT_META[feedback.verdict];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border', meta.color)}>
            {meta.icon}
            {meta.label}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-[var(--text-primary)] truncate">{feedback.comment.substring(0, 80)}...</p>
            <p className="text-xs text-[var(--text-muted)]">
              {feedback.source} &mdash; {feedback.documentSection}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {feedback.cascadeActions && feedback.cascadeActions.length > 0 && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {feedback.cascadeActions.length} cascades
            </span>
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
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Reviewer"
                  value={feedback.source}
                  onChange={(e) => onUpdate(feedback.id, { source: e.target.value })}
                />
                <Input
                  label="Document Section"
                  value={feedback.documentSection}
                  onChange={(e) => onUpdate(feedback.id, { documentSection: e.target.value })}
                />
              </div>

              <TextArea
                label="Comment"
                value={feedback.comment}
                onChange={(e) => onUpdate(feedback.id, { comment: e.target.value })}
                rows={3}
              />

              {/* Verdict selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Verdict</label>
                <div className="flex gap-2">
                  {(Object.keys(VERDICT_META) as FeedbackComment['verdict'][]).map((v) => {
                    const m = VERDICT_META[v];
                    return (
                      <button
                        key={v}
                        onClick={() => onUpdate(feedback.id, { verdict: v })}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          feedback.verdict === v ? m.color : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:bg-white/[0.03]'
                        )}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <TextArea
                label="Rationale"
                value={feedback.rationale}
                onChange={(e) => onUpdate(feedback.id, { rationale: e.target.value })}
                placeholder="Explain why this verdict was chosen..."
                rows={3}
              />

              {/* Three-lens evaluation */}
              <ThreeLensEval feedback={feedback} />

              {/* Cascade actions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Cascade Actions</label>
                {(feedback.cascadeActions ?? []).map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/15 rounded-lg p-2">
                    <ArrowRight className="w-3 h-3" />
                    {action}
                  </div>
                ))}
                <Input
                  placeholder="Add cascade action (Enter to add)"
                  className="text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        onUpdate(feedback.id, {
                          cascadeActions: [...(feedback.cascadeActions ?? []), val],
                        });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>

              <div className="flex justify-end">
                <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => onRemove(feedback.id)}>
                  Remove
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Parking lot preview ────────────────────────────────────────
const ParkingLotPreview: React.FC<{ feedbacks: FeedbackComment[] }> = ({ feedbacks }) => {
  const declined = feedbacks.filter((f) => f.verdict === 'DECLINE');
  const partial = feedbacks.filter((f) => f.verdict === 'PARTIAL');
  const notes = feedbacks.filter((f) => f.verdict === 'NOTE');

  const sections = [
    { title: 'Section 1: Declined Items (with rationale)', items: declined },
    { title: 'Section 2: Partially Accepted (scope for future revision)', items: partial },
    { title: 'Section 3: Notes for Future Iterations', items: notes },
    { title: 'Section 4: Out-of-Scope Suggestions', items: [] as FeedbackComment[] },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Eye className="w-4 h-4 text-indigo-400" />
        Parking Lot Document Preview
      </h4>
      {sections.map((section) => (
        <div key={section.title} className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)]">
          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">{section.title}</p>
          {section.items.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic">No items</p>
          ) : (
            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.id} className="text-xs text-[var(--text-primary)]">
                  &bull; {item.comment.substring(0, 100)}{item.comment.length > 100 ? '...' : ''}
                  <span className="text-[var(--text-muted)] ml-2">&mdash; {item.source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Cascade tracker ────────────────────────────────────────────
const CascadeTracker: React.FC<{ feedbacks: FeedbackComment[] }> = ({ feedbacks }) => {
  const allCascades = feedbacks.flatMap((f) =>
    (f.cascadeActions ?? []).map((a) => ({ action: a, source: f.source, verdict: f.verdict }))
  );

  const docTypes = ['PA Task', 'SSD', 'Knowledge Checks', 'Sample Responses', 'Supporting Docs'];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-amber-400" />
        Cascade Tracker &mdash; Downstream Updates Needed
      </h4>
      {docTypes.map((doc) => {
        const relevant = allCascades.filter((c) => c.action.toLowerCase().includes(doc.toLowerCase()));
        return (
          <div key={doc} className={clsx(
            'flex items-center justify-between p-3 rounded-xl border',
            relevant.length > 0
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-white/[0.02] border-[var(--border-subtle)]'
          )}>
            <span className="text-xs font-medium text-[var(--text-primary)]">{doc}</span>
            <span className={clsx('text-xs', relevant.length > 0 ? 'text-amber-400' : 'text-emerald-400')}>
              {relevant.length > 0 ? `${relevant.length} updates needed` : 'No changes'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const Phase11_Feedback: React.FC = () => {
  const {
    currentProject,
    addFeedback,
    updateFeedback,
    isGenerating,
    setGenerating,
  } = useAppStore();

  const [feedbacks, setFeedbacks] = useState<FeedbackComment[]>(currentProject?.feedbackComments ?? []);
  const [bulkInput, setBulkInput] = useState('');

  const addNewFeedback = useCallback(() => {
    const newFeedback: FeedbackComment = {
      id: crypto.randomUUID(),
      source: '',
      documentSection: '',
      comment: '',
      verdict: 'NOTE',
      rationale: '',
      cascadeActions: [],
    };
    setFeedbacks((prev) => [...prev, newFeedback]);
  }, []);

  const handleUpdate = useCallback((id: string, partial: Partial<FeedbackComment>) => {
    setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, ...partial } : f)));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleAutoTriage = useCallback(async () => {
    if (!bulkInput.trim()) return;
    setGenerating(true);
    try {
      // Parse bulk input into individual comments and auto-triage using Claude
      const lines = bulkInput.split('\n').filter((l) => l.trim());
      const newFeedbacks: FeedbackComment[] = lines.map((line) => ({
        id: crypto.randomUUID(),
        source: 'SME Review',
        documentSection: '',
        comment: line.trim(),
        verdict: 'NOTE' as const,
        rationale: 'Auto-triaged - review needed',
        cascadeActions: [],
      }));
      setFeedbacks((prev) => [...prev, ...newFeedbacks]);
      setBulkInput('');
    } finally {
      setGenerating(false);
    }
  }, [bulkInput, setGenerating]);

  const handleSave = useCallback(() => {
    // Sync all feedbacks to the store
    for (const fb of feedbacks) {
      const existing = currentProject?.feedbackComments.find((f) => f.id === fb.id);
      if (existing) {
        updateFeedback(fb.id, fb);
      } else {
        addFeedback(fb);
      }
    }
  }, [feedbacks, currentProject, addFeedback, updateFeedback]);

  if (!currentProject) return null;

  const verdictCounts = useMemo(() => {
    const counts = { ACCEPT: 0, PARTIAL: 0, DECLINE: 0, NOTE: 0 };
    for (const f of feedbacks) counts[f.verdict]++;
    return counts;
  }, [feedbacks]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Total Comments</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{feedbacks.length}</p>
          </div>
          {(Object.keys(VERDICT_META) as FeedbackComment['verdict'][]).map((v) => {
            const m = VERDICT_META[v];
            return (
              <div key={v}>
                <p className="text-xs text-[var(--text-muted)] mb-1">{m.label}</p>
                <p className={clsx('text-2xl font-bold', m.color.split(' ')[1])}>{verdictCounts[v]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Non-negotiable constraints */}
      <NonNegotiableConstraints />

      {/* Bulk input */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Paste SME Feedback</h4>
        <TextArea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          placeholder="Paste feedback comments here (one per line). Claude will auto-triage each comment."
          rows={5}
        />
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={handleAutoTriage}
            loading={isGenerating}
            disabled={!bulkInput.trim()}
          >
            Auto-Triage with Claude
          </Button>
        </div>
      </div>

      {/* Feedback cards */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Feedback Comments ({feedbacks.length})</h3>
        <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addNewFeedback}>
          Add Comment
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {feedbacks.map((fb) => (
            <FeedbackCard key={fb.id} feedback={fb} onUpdate={handleUpdate} onRemove={handleRemove} />
          ))}
        </AnimatePresence>
      </div>

      {/* Parking lot & cascade tracker */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5">
          <ParkingLotPreview feedbacks={feedbacks} />
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5">
          <CascadeTracker feedbacks={feedbacks} />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleSave}>
          Save Feedback
        </Button>
      </div>
    </div>
  );
};
