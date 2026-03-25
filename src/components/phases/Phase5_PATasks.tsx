import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  FileDown,
  FileText,
  Table2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Edit3,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type { PAPrompt, RubricRow } from '../../lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ============================================================
// Prompt Editor
// ============================================================

const PromptEditor: React.FC<{
  prompt: PAPrompt;
  taskId: string;
  onUpdate: (promptId: string, partial: Partial<PAPrompt>) => void;
  onRemove: (promptId: string) => void;
  availableESIds: { id: string; code: string }[];
}> = ({ prompt, taskId, onUpdate, onRemove, availableESIds }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl bg-white/[0.015] border border-[var(--border-subtle)] overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 cursor-pointer"
        >
          <span className="text-xs font-bold text-[var(--accent)] min-w-[32px]">
            {prompt.code}
          </span>
          <span className="text-xs text-[var(--text-secondary)] truncate flex-1">
            {prompt.text || 'No prompt text yet'}
          </span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          )}
        </button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(prompt.id)}
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-subtle)] pt-3">
              <Input
                label="Prompt Code"
                value={prompt.code}
                onChange={(e) => onUpdate(prompt.id, { code: e.target.value })}
                placeholder="e.g. A, A1, B, B1"
              />
              <TextArea
                label="Prompt Text"
                value={prompt.text}
                onChange={(e) => onUpdate(prompt.id, { text: e.target.value })}
                placeholder="Describe the requirement for this prompt..."
              />
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                  Mapped Evidence Statements
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableESIds.map((es) => {
                    const isMapped = prompt.mappedESIds.includes(es.id);
                    return (
                      <motion.button
                        key={es.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const newMapped = isMapped
                            ? prompt.mappedESIds.filter((id) => id !== es.id)
                            : [...prompt.mappedESIds, es.id];
                          onUpdate(prompt.id, { mappedESIds: newMapped });
                        }}
                        className={clsx(
                          'px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border',
                          isMapped
                            ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
                            : 'bg-white/[0.02] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent)]/20'
                        )}
                      >
                        {es.code}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================
// Rubric Table
// ============================================================

const RubricTable: React.FC<{
  rubric: RubricRow[];
  prompts: PAPrompt[];
  onUpdate: (rubric: RubricRow[]) => void;
}> = ({ rubric, prompts, onUpdate }) => {
  const handleCellChange = (index: number, field: keyof RubricRow, value: string) => {
    const updated = rubric.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onUpdate(updated);
  };

  const addRow = () => {
    onUpdate([
      ...rubric,
      {
        promptCode: '',
        aspect: '',
        notEvident: '',
        approachingCompetence: '',
        competent: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    onUpdate(rubric.filter((_, i) => i !== index));
  };

  // Auto-populate rows for prompts that don't have one
  const autoPopulate = () => {
    const existingCodes = new Set(rubric.map((r) => r.promptCode));
    const newRows: RubricRow[] = prompts
      .filter((p) => !existingCodes.has(p.code))
      .map((p) => ({
        promptCode: p.code,
        aspect: p.text.substring(0, 60),
        notEvident: '',
        approachingCompetence: '',
        competent: '',
      }));

    if (newRows.length > 0) {
      onUpdate([...rubric, ...newRows]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={addRow}
        >
          Add Row
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={autoPopulate}
        >
          Auto-populate from Prompts
        </Button>
      </div>

      {rubric.length === 0 ? (
        <div className="text-xs text-[var(--text-muted)] italic text-center py-6 rounded-xl border border-dashed border-[var(--border-subtle)]">
          No rubric rows yet. Add rows or auto-populate from prompts.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-2 px-2 text-[var(--text-muted)] font-medium w-16">Code</th>
                <th className="text-left py-2 px-2 text-[var(--text-muted)] font-medium w-24">Aspect</th>
                <th className="text-left py-2 px-2 text-red-400 font-medium">Not Evident</th>
                <th className="text-left py-2 px-2 text-amber-400 font-medium">Approaching</th>
                <th className="text-left py-2 px-2 text-green-400 font-medium">Competent</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rubric.map((row, i) => (
                <motion.tr
                  key={i}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-[var(--border-subtle)]/50"
                >
                  <td className="py-1.5 px-1">
                    <input
                      value={row.promptCode}
                      onChange={(e) => handleCellChange(i, 'promptCode', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-active)]"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <input
                      value={row.aspect}
                      onChange={(e) => handleCellChange(i, 'aspect', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-active)]"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <textarea
                      value={row.notEvident}
                      onChange={(e) => handleCellChange(i, 'notEvident', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1.5 rounded-lg text-xs bg-red-500/5 border border-red-500/20 text-[var(--text-primary)] focus:outline-none focus:border-red-500/40 resize-none"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <textarea
                      value={row.approachingCompetence}
                      onChange={(e) => handleCellChange(i, 'approachingCompetence', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1.5 rounded-lg text-xs bg-amber-500/5 border border-amber-500/20 text-[var(--text-primary)] focus:outline-none focus:border-amber-500/40 resize-none"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <textarea
                      value={row.competent}
                      onChange={(e) => handleCellChange(i, 'competent', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1.5 rounded-lg text-xs bg-green-500/5 border border-green-500/20 text-[var(--text-primary)] focus:outline-none focus:border-green-500/40 resize-none"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeRow(i)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PA Document Preview
// ============================================================

const PADocPreview: React.FC<{
  taskNumber: number;
  taskName: string;
  metadata: { courseCode: string; courseTitle: string };
  prompts: PAPrompt[];
  competencies: { code: string; statement: string }[];
  introduction: string;
}> = ({ taskNumber, taskName, metadata, prompts, competencies, introduction }) => (
  <div className="space-y-4 text-sm">
    {/* Header table */}
    <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-[var(--border-subtle)]">
        {[
          ['Course', `${metadata.courseCode} - ${metadata.courseTitle}`],
          ['Task', `Task ${taskNumber}: ${taskName}`],
          ['Competencies', competencies.map((c) => c.code).join(', ')],
        ].map(([label, value]) => (
          <React.Fragment key={label}>
            <div className="bg-[var(--bg-secondary)] px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
              {label}
            </div>
            <div className="bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)]">
              {value}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>

    {/* Competencies */}
    <div>
      <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">
        Competencies
      </h4>
      {competencies.map((comp) => (
        <div key={comp.code} className="text-xs text-[var(--text-secondary)] mb-1">
          <span className="font-semibold text-[var(--accent)]">{comp.code}:</span> {comp.statement}
        </div>
      ))}
    </div>

    {/* Introduction */}
    {introduction && (
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">
          Introduction
        </h4>
        <div className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
          {introduction}
        </div>
      </div>
    )}

    {/* Requirements */}
    <div>
      <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">
        Requirements
      </h4>
      {prompts.map((prompt) => (
        <div key={prompt.id} className="mb-2">
          <div className="text-xs">
            <span className="font-bold text-[var(--accent)]">{prompt.code}.</span>{' '}
            <span className="text-[var(--text-primary)]">{prompt.text}</span>
          </div>
          {prompt.subPrompts?.map((sub) => (
            <div key={sub.id} className="ml-4 text-xs mt-1">
              <span className="font-bold text-purple-400">{sub.code}.</span>{' '}
              <span className="text-[var(--text-secondary)]">{sub.text}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Standard C & D */}
      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <div className="text-xs mb-1">
          <span className="font-bold text-[var(--accent)]">C.</span>{' '}
          <span className="text-[var(--text-secondary)]">
            Acknowledge sources, using in-text citations and references, for content that is quoted,
            paraphrased, or summarized.
          </span>
        </div>
        <div className="text-xs">
          <span className="font-bold text-[var(--accent)]">D.</span>{' '}
          <span className="text-[var(--text-secondary)]">
            Demonstrate professional communication in the content and presentation of your submission.
          </span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// Main Component
// ============================================================

export const Phase5_PATasks: React.FC = () => {
  const {
    project,
    updateTask,
    isGenerating,
    setGenerating,
    settings,
  } = useAppStore();

  const [activeTaskIdx, setActiveTaskIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  if (!project) return null;

  const tasks = project.tasks;
  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-8 text-center"
      >
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Tasks Defined</h3>
        <p className="text-sm text-[var(--text-muted)]">
          Complete Phase 3 (Task Splitting) first.
        </p>
      </motion.div>
    );
  }

  const activeTask = tasks[activeTaskIdx] || tasks[0];
  const taskES = project.evidenceStatements.filter((es) =>
    activeTask.esIds.includes(es.id)
  );
  const taskComps = project.competencies.filter((c) =>
    activeTask.competencyIds.includes(c.id)
  );

  const handleAddPrompt = () => {
    const nextLetter = String.fromCharCode(65 + activeTask.prompts.length); // A, B, C...
    const newPrompt: PAPrompt = {
      id: crypto.randomUUID(),
      code: nextLetter,
      text: '',
      mappedESIds: [],
    };
    updateTask(activeTask.id, {
      prompts: [...activeTask.prompts, newPrompt],
    });
  };

  const handleUpdatePrompt = (promptId: string, partial: Partial<PAPrompt>) => {
    updateTask(activeTask.id, {
      prompts: activeTask.prompts.map((p) =>
        p.id === promptId ? { ...p, ...partial } : p
      ),
    });
  };

  const handleRemovePrompt = (promptId: string) => {
    updateTask(activeTask.id, {
      prompts: activeTask.prompts.filter((p) => p.id !== promptId),
    });
  };

  const handleRubricUpdate = (rubric: RubricRow[]) => {
    updateTask(activeTask.id, { rubric });
  };

  const handleGenerate = async () => {
    if (!settings.apiKey) return;
    setGenerating(true);

    const esSummary = taskES.map((es) => `${es.code}: ${es.statement}`).join('\n');
    const compSummary = taskComps.map((c) => `${c.code}: ${c.statement}`).join('\n');

    const prompt = `You are a WGU PA task expert. Generate the PA document structure for this task.

Task: ${activeTask.name} (Task ${activeTask.number})
Course: ${project.metadata.courseCode} - ${project.metadata.courseTitle}

Competencies:
${compSummary}

Evidence Statements:
${esSummary}

Generate:
1. An introduction paragraph (2-3 sentences)
2. PA prompts with proper lettering (A, A1, A2, B, B1, etc.) - each mapped to evidence statements
3. Rubric rows for each prompt with three columns: Not Evident, Approaching Competence, Competent

Return as JSON:
{
  "introduction": "text",
  "prompts": [{ "code": "A", "text": "requirement text", "mappedESCodes": ["ES1.1"] }],
  "rubric": [{ "promptCode": "A", "aspect": "description", "notEvident": "text", "approachingCompetence": "text", "competent": "text" }]
}

Return ONLY valid JSON.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: 8192,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        const prompts: PAPrompt[] = (parsed.prompts || []).map((p: { code: string; text: string; mappedESCodes?: string[] }) => {
          const mappedESIds = (p.mappedESCodes || [])
            .map((code: string) => taskES.find((es) => es.code === code)?.id)
            .filter(Boolean) as string[];

          return {
            id: crypto.randomUUID(),
            code: p.code,
            text: p.text,
            mappedESIds,
          };
        });

        updateTask(activeTask.id, {
          introduction: parsed.introduction || '',
          prompts,
          rubric: parsed.rubric || [],
        });
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Task tabs */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 overflow-x-auto pb-1">
        {tasks.map((task, i) => (
          <motion.button
            key={task.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTaskIdx(i)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap',
              i === activeTaskIdx
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03] border border-transparent'
            )}
          >
            Task {task.number}: {task.name}
          </motion.button>
        ))}
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Button
          variant="primary"
          icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          onClick={handleGenerate}
          loading={isGenerating}
        >
          {isGenerating ? 'Generating PA...' : 'Generate PA Document'}
        </Button>

        <div className="flex items-center gap-1 ml-auto rounded-xl border border-[var(--border-subtle)] p-0.5">
          <button
            onClick={() => setViewMode('edit')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
              viewMode === 'edit'
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <Edit3 className="w-3.5 h-3.5 inline mr-1" />
            Edit
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
              viewMode === 'preview'
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            Preview
          </button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<FileDown className="w-4 h-4" />}
          onClick={() => console.log('Export Task', activeTask.number, '.docx')}
        >
          Export .docx
        </Button>
      </motion.div>

      {viewMode === 'preview' ? (
        /* PA Document Preview */
        <motion.div variants={itemVariants} className="glass-card p-6">
          <PADocPreview
            taskNumber={activeTask.number}
            taskName={activeTask.name}
            metadata={project.metadata}
            prompts={activeTask.prompts}
            competencies={taskComps.map((c) => ({ code: c.code, statement: c.statement }))}
            introduction={activeTask.introduction}
          />
        </motion.div>
      ) : (
        <>
          {/* Introduction */}
          <motion.div variants={itemVariants} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[var(--accent)]/10">
                <BookOpen className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Introduction
              </h2>
            </div>
            <TextArea
              value={activeTask.introduction}
              onChange={(e) => updateTask(activeTask.id, { introduction: e.target.value })}
              placeholder="Write the PA introduction paragraph..."
            />
          </motion.div>

          {/* Prompts */}
          <motion.div variants={itemVariants} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--accent)]/10">
                  <FileText className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    PA Prompts (Requirements)
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {activeTask.prompts.length} prompts | Uses A, A1, B, B1... lettering
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddPrompt}
              >
                Add Prompt
              </Button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {activeTask.prompts.map((prompt) => (
                  <PromptEditor
                    key={prompt.id}
                    prompt={prompt}
                    taskId={activeTask.id}
                    onUpdate={handleUpdatePrompt}
                    onRemove={handleRemovePrompt}
                    availableESIds={taskES.map((es) => ({
                      id: es.id,
                      code: es.code,
                    }))}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Design Notes - Prompt to ES Alignment */}
          <motion.div variants={itemVariants} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[var(--accent)]/10">
                <Target className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Design Notes: Prompt-to-ES Alignment
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="text-left py-2 px-2 text-[var(--text-muted)] font-medium">Prompt</th>
                    <th className="text-left py-2 px-2 text-[var(--text-muted)] font-medium">Evidence Statements</th>
                    <th className="text-left py-2 px-2 text-[var(--text-muted)] font-medium">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTask.prompts.map((prompt) => (
                    <tr key={prompt.id} className="border-b border-[var(--border-subtle)]/50">
                      <td className="py-2 px-2 font-bold text-[var(--accent)]">{prompt.code}</td>
                      <td className="py-2 px-2 text-[var(--text-secondary)]">
                        {prompt.mappedESIds
                          .map((id) => taskES.find((es) => es.id === id)?.code)
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </td>
                      <td className="py-2 px-2">
                        {prompt.mappedESIds.length > 0 ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Rubric */}
          <motion.div variants={itemVariants} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[var(--accent)]/10">
                <Table2 className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Rubric
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  3 columns: Not Evident | Approaching Competence | Competent
                </p>
              </div>
            </div>

            <RubricTable
              rubric={activeTask.rubric}
              prompts={activeTask.prompts}
              onUpdate={handleRubricUpdate}
            />
          </motion.div>
        </>
      )}
    </motion.div>
  );
};
