import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Download,
  BookOpen,
  FileCode,
  FileSpreadsheet,
  Users,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type { Task } from '../../lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';

// ── Supporting document types ──────────────────────────────────
type SupportingDocType =
  | 'case-study'
  | 'template'
  | 'starter-file'
  | 'technical-reference'
  | 'scenario-profile';

const DOC_TYPE_META: Record<SupportingDocType, { label: string; icon: React.ReactNode; color: string }> = {
  'case-study': { label: 'Case Study', icon: <BookOpen className="w-4 h-4" />, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  'template': { label: 'Template', icon: <FileSpreadsheet className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  'starter-file': { label: 'Starter File', icon: <FileCode className="w-4 h-4" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'technical-reference': { label: 'Technical Reference', icon: <ClipboardList className="w-4 h-4" />, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  'scenario-profile': { label: 'Scenario Profile', icon: <Users className="w-4 h-4" />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

interface SupportingDoc {
  id: string;
  title: string;
  type: SupportingDocType;
  description: string;
  content: string;
  taskId: string;
}

// ── Single document card ───────────────────────────────────────
interface DocCardProps {
  doc: SupportingDoc;
  onUpdate: (id: string, partial: Partial<SupportingDoc>) => void;
  onRemove: (id: string) => void;
  onGenerate: (id: string) => void;
  onExport: (id: string) => void;
  isGenerating: boolean;
}

const DocCard: React.FC<DocCardProps> = ({ doc, onUpdate, onRemove, onGenerate, onExport, isGenerating }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = DOC_TYPE_META[doc.type];

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
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={clsx('flex items-center justify-center w-8 h-8 rounded-lg border', meta.color)}>
            {meta.icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.title || 'Untitled Document'}</p>
            <p className="text-xs text-[var(--text-muted)]">{meta.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {doc.content.length > 0 && (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {doc.content.split(/\s+/).filter(Boolean).length} words
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-subtle)] pt-4">
              <Input
                label="Title"
                value={doc.title}
                onChange={(e) => onUpdate(doc.id, { title: e.target.value })}
                placeholder="Document title"
              />

              {/* Type selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(DOC_TYPE_META) as SupportingDocType[]).map((t) => {
                    const m = DOC_TYPE_META[t];
                    const active = doc.type === t;
                    return (
                      <button
                        key={t}
                        onClick={() => onUpdate(doc.id, { type: t })}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          active ? m.color : 'text-[var(--text-muted)] bg-white/[0.02] border-[var(--border-subtle)] hover:bg-white/[0.05]'
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
                label="Description"
                value={doc.description}
                onChange={(e) => onUpdate(doc.id, { description: e.target.value })}
                placeholder="Brief description of what this document provides to the student"
                rows={2}
              />

              <TextArea
                label="Content"
                value={doc.content}
                onChange={(e) => onUpdate(doc.id, { content: e.target.value })}
                placeholder="Full document content..."
                rows={10}
                autoResize={false}
                className="min-h-[200px] font-mono text-xs"
              />

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => onRemove(doc.id)}
                >
                  Remove
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => onExport(doc.id)}
                    disabled={doc.content.length === 0}
                  >
                    Export
                  </Button>
                  {doc.type === 'case-study' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                      onClick={() => onGenerate(doc.id)}
                      loading={isGenerating}
                    >
                      Generate Case Study
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const Phase6_SupportingDocs: React.FC = () => {
  const { currentProject, updateTask, isGenerating, setGenerating, apiKey } = useAppStore();
  const [docs, setDocs] = useState<SupportingDoc[]>(() => {
    if (!currentProject) return [];
    return currentProject.tasks.flatMap((task) =>
      task.supportingDocs.map((sd, i) => ({
        id: `${task.id}-doc-${i}`,
        title: sd.name,
        type: 'case-study' as SupportingDocType,
        description: sd.description,
        content: '',
        taskId: task.id,
      }))
    );
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    currentProject?.tasks[0]?.id ?? ''
  );
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const tasks = currentProject?.tasks ?? [];
  const filteredDocs = docs.filter((d) => d.taskId === selectedTaskId);

  const addDoc = useCallback(() => {
    const newDoc: SupportingDoc = {
      id: crypto.randomUUID(),
      title: '',
      type: 'case-study',
      description: '',
      content: '',
      taskId: selectedTaskId,
    };
    setDocs((prev) => [...prev, newDoc]);
  }, [selectedTaskId]);

  const updateDoc = useCallback((id: string, partial: Partial<SupportingDoc>) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...partial } : d)));
  }, []);

  const removeDoc = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleGenerate = useCallback(
    async (docId: string) => {
      if (!apiKey || !currentProject) return;
      setGeneratingId(docId);
      setGenerating(true);
      try {
        const doc = docs.find((d) => d.id === docId);
        if (!doc) return;
        const task = currentProject.tasks.find((t) => t.id === doc.taskId);
        if (!task) return;

        // Claude API call placeholder - generates a 2+ page narrative case study
        const prompt = `Generate a detailed case study document for a CBE course assessment.

Task: ${task.name}
Document Title: ${doc.title || 'Untitled Case Study'}
Description: ${doc.description}

Rules:
- 2+ pages of narrative content (minimum 800 words)
- Use fictional company and character names
- Include MORE detail than strictly needed so students must discern relevant information
- Include organizational context, stakeholder perspectives, data/metrics, and challenges
- Write in a professional business narrative style
- Include at least one data table or structured dataset within the narrative

Return ONLY the case study text content, no JSON wrapping.`;

        // Simulated generation for now - replace with actual API call
        const generatedContent = `[Case study content would be generated here via Claude API]\n\nTitle: ${doc.title}\n\nThis case study would contain 2+ pages of detailed narrative with fictional names, organizational context, and more detail than strictly needed for the assessment.`;

        updateDoc(docId, { content: generatedContent });
      } finally {
        setGeneratingId(null);
        setGenerating(false);
      }
    },
    [apiKey, currentProject, docs, updateDoc, setGenerating]
  );

  const handleExport = useCallback(
    (docId: string) => {
      const doc = docs.find((d) => d.id === docId);
      if (!doc || !doc.content) return;

      const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title || 'document'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [docs]
  );

  // Sync docs back to store
  const syncToStore = useCallback(() => {
    if (!currentProject) return;
    for (const task of currentProject.tasks) {
      const taskDocs = docs.filter((d) => d.taskId === task.id);
      updateTask(task.id, {
        supportingDocs: taskDocs.map((d) => ({
          name: d.title,
          description: d.description,
          filename: `${d.title || 'doc'}.txt`,
        })),
      });
    }
  }, [currentProject, docs, updateTask]);

  if (!currentProject) return null;

  return (
    <div className="space-y-6">
      {/* Task selector */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5">
        <label className="text-sm font-medium text-[var(--text-secondary)] mb-3 block">Select Task</label>
        <div className="flex flex-wrap gap-2">
          {tasks.map((task: Task) => (
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

      {/* Document list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Supporting Documents ({filteredDocs.length})
          </h3>
          <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addDoc}>
            Add Document
          </Button>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredDocs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <FileText className="w-10 h-10 text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-muted)]">No supporting documents for this task yet.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Add case studies, templates, starter files, and more.</p>
            </motion.div>
          ) : (
            filteredDocs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onUpdate={updateDoc}
                onRemove={removeDoc}
                onGenerate={handleGenerate}
                onExport={handleExport}
                isGenerating={generatingId === doc.id}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={syncToStore}>
          Save All Documents
        </Button>
      </div>
    </div>
  );
};
