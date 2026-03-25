import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  GripVertical,
  Columns,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type { Task, Competency } from '../../lib/types';
import { COGNITIVE_LEVEL_LABELS } from '../../lib/types';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';
import { Input } from '../ui/Input';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ============================================================
// Competency Chip (draggable source)
// ============================================================

const CompetencyChip: React.FC<{
  comp: Competency;
  assigned: boolean;
  taskNum?: number;
  onAssign: (compId: string, taskIdx: number) => void;
  taskCount: number;
}> = ({ comp, assigned, taskNum, onAssign, taskCount }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <motion.div
        layout
        whileHover={{ scale: 1.02 }}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all duration-200',
          assigned
            ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--text-primary)]'
            : 'bg-white/[0.02] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]/20'
        )}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <GripVertical className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="text-xs font-bold text-[var(--accent)]">{comp.code}</span>
        <span className="text-xs truncate max-w-[180px]">{comp.statement}</span>
        {assigned && taskNum !== undefined && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)] font-semibold">
            T{taskNum}
          </span>
        )}
      </motion.div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute top-full mt-1 left-0 z-20 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-xl min-w-[140px]"
          >
            {Array.from({ length: taskCount }, (_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(comp.id, i);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[var(--accent)]/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Assign to Task {i + 1}
              </button>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssign(comp.id, -1); // unassign
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer"
            >
              Unassign
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// Task Column
// ============================================================

const TaskColumn: React.FC<{
  taskIdx: number;
  taskName: string;
  assignedComps: Competency[];
  assignedESCount: number;
  onRemoveTask: (idx: number) => void;
  onRenameTask: (idx: number, name: string) => void;
  canRemove: boolean;
}> = ({ taskIdx, taskName, assignedComps, assignedESCount, onRemoveTask, onRenameTask, canRemove }) => (
  <motion.div
    variants={itemVariants}
    layout
    className="glass-card p-4 flex-1 min-w-[240px]"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold">
          T{taskIdx + 1}
        </span>
        <input
          value={taskName}
          onChange={(e) => onRenameTask(taskIdx, e.target.value)}
          className="text-sm font-semibold text-[var(--text-primary)] bg-transparent border-none focus:outline-none focus:ring-0 w-full"
          placeholder={`Task ${taskIdx + 1}`}
        />
      </div>
      {canRemove && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemoveTask(taskIdx)}
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </div>

    <div className="text-xs text-[var(--text-muted)] mb-3">
      {assignedComps.length} competencies | {assignedESCount} evidence statements
    </div>

    <div className="space-y-2 min-h-[60px]">
      {assignedComps.length === 0 ? (
        <div className="text-xs text-[var(--text-muted)] italic text-center py-4 rounded-xl border border-dashed border-[var(--border-subtle)]">
          Click a competency to assign it here
        </div>
      ) : (
        assignedComps.map((comp) => (
          <motion.div
            key={comp.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20"
          >
            <span className="text-xs font-bold text-[var(--accent)]">{comp.code}</span>
            <span className="text-xs text-[var(--text-secondary)] truncate flex-1">
              {comp.statement}
            </span>
          </motion.div>
        ))
      )}
    </div>
  </motion.div>
);

// ============================================================
// Worked Examples
// ============================================================

const workedExamples = [
  {
    code: 'E063',
    title: 'Technical Writing',
    split: '2 tasks: Report Writing (C1-C3) + Documentation (C4-C6)',
    rationale: 'Separated by document type and audience',
  },
  {
    code: 'E069',
    title: 'UX/UI Design',
    split: '2 tasks: Research & Analysis (C1-C3) + Design & Prototype (C4-C6)',
    rationale: 'Discovery vs. creation phases naturally separate',
  },
  {
    code: 'E089',
    title: 'Data Analytics',
    split: '3 tasks: Data Prep (C1-C2) + Analysis (C3-C4) + Visualization (C5-C6)',
    rationale: 'Pipeline stages form natural task boundaries',
  },
];

// ============================================================
// Main Component
// ============================================================

export const Phase3_TaskSplitting: React.FC = () => {
  const {
    project,
    setTasks,
    settings,
    isGenerating,
    setGenerating,
  } = useAppStore();

  const [taskColumns, setTaskColumns] = useState<{ name: string; compIds: string[] }[]>([
    { name: 'Task 1', compIds: [] },
    { name: 'Task 2', compIds: [] },
  ]);
  const [rationale, setRationale] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');

  if (!project) return null;

  // Check which competencies are assigned
  const allAssignedIds = new Set(taskColumns.flatMap((t) => t.compIds));
  const unassigned = project.competencies.filter((c) => !allAssignedIds.has(c.id));
  const allAssigned = unassigned.length === 0 && project.competencies.length > 0;

  const handleAssign = (compId: string, taskIdx: number) => {
    setTaskColumns((prev) => {
      // Remove from all tasks first
      const updated = prev.map((t) => ({
        ...t,
        compIds: t.compIds.filter((id) => id !== compId),
      }));
      // Assign to target (if not unassigning)
      if (taskIdx >= 0 && taskIdx < updated.length) {
        updated[taskIdx] = {
          ...updated[taskIdx],
          compIds: [...updated[taskIdx].compIds, compId],
        };
      }
      return updated;
    });
  };

  const addTask = () => {
    setTaskColumns((prev) => [
      ...prev,
      { name: `Task ${prev.length + 1}`, compIds: [] },
    ]);
  };

  const removeTask = (idx: number) => {
    setTaskColumns((prev) => prev.filter((_, i) => i !== idx));
  };

  const renameTask = (idx: number, name: string) => {
    setTaskColumns((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, name } : t))
    );
  };

  const handleAISuggest = async () => {
    if (!settings.apiKey) return;
    setGenerating(true);

    const compSummary = project.competencies
      .map((c) => `${c.code}: ${c.statement} (Level ${c.cognitiveLevel}, ${c.weight}%)`)
      .join('\n');

    const prompt = `You are a CBE task architecture expert. Given these competencies, suggest the optimal task splitting.

Competencies:
${compSummary}

Consider:
1. Cognitive complexity grouping
2. Natural workflow boundaries
3. Assessment feasibility
4. Student workload balance

Respond with:
1. Recommended number of tasks
2. Which competencies go in each task (by code)
3. Clear rationale for each grouping
4. Any warnings or considerations`;

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
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      setAiSuggestion(data.content?.[0]?.text || 'No suggestion generated.');
    } catch (err) {
      console.error('AI suggestion failed:', err);
      setAiSuggestion('Generation failed. Please check your API key.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTasks = () => {
    const tasks: Task[] = taskColumns
      .filter((col) => col.compIds.length > 0)
      .map((col, i) => {
        const esIds = project.evidenceStatements
          .filter((es) => col.compIds.includes(es.parentCompetencyId))
          .map((es) => es.id);

        return {
          id: crypto.randomUUID(),
          number: i + 1,
          name: col.name,
          competencyIds: col.compIds,
          esIds,
          scenarios: [],
          prompts: [],
          rubric: [],
          introduction: '',
          supportingDocs: [],
          taskModelComponents: {},
        };
      });

    setTasks(tasks);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header stats */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[var(--accent)]/10">
            <Columns className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Task Architecture
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Assign competencies to performance assessment tasks
            </p>
          </div>
        </div>

        {/* Validation */}
        <div className="flex items-center gap-4 text-sm">
          <div className={clsx(
            'flex items-center gap-2',
            allAssigned ? 'text-green-400' : 'text-amber-400'
          )}>
            {allAssigned ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {unassigned.length === 0
              ? 'All competencies assigned'
              : `${unassigned.length} unassigned`}
          </div>
          <span className="text-[var(--text-muted)]">|</span>
          <span className="text-[var(--text-muted)]">
            {taskColumns.length} tasks | {project.competencies.length} competencies
          </span>
        </div>
      </motion.div>

      {/* Unassigned competencies */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Competencies
          {unassigned.length > 0 && (
            <span className="text-[var(--text-muted)] font-normal ml-2">
              ({unassigned.length} unassigned)
            </span>
          )}
        </h3>
        <div className="space-y-2">
          {project.competencies.map((comp) => {
            const assignedTask = taskColumns.findIndex((t) => t.compIds.includes(comp.id));
            return (
              <CompetencyChip
                key={comp.id}
                comp={comp}
                assigned={assignedTask >= 0}
                taskNum={assignedTask >= 0 ? assignedTask + 1 : undefined}
                onAssign={handleAssign}
                taskCount={taskColumns.length}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Task columns */}
      <motion.div variants={itemVariants} className="flex gap-4 overflow-x-auto pb-2">
        {taskColumns.map((col, i) => {
          const assignedComps = project.competencies.filter((c) =>
            col.compIds.includes(c.id)
          );
          const esCount = project.evidenceStatements.filter((es) =>
            col.compIds.includes(es.parentCompetencyId)
          ).length;

          return (
            <TaskColumn
              key={i}
              taskIdx={i}
              taskName={col.name}
              assignedComps={assignedComps}
              assignedESCount={esCount}
              onRemoveTask={removeTask}
              onRenameTask={renameTask}
              canRemove={taskColumns.length > 1}
            />
          );
        })}
      </motion.div>

      {/* Add task + actions */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={addTask}
        >
          Add Task Column
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          onClick={handleAISuggest}
          loading={isGenerating}
          disabled={project.competencies.length === 0}
        >
          AI Recommendation
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={handleSaveTasks}
          disabled={!allAssigned}
        >
          Save Task Architecture
        </Button>
      </motion.div>

      {/* AI Suggestion */}
      <AnimatePresence>
        {aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                AI Recommendation
              </h3>
            </div>
            <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
              {aiSuggestion}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision rationale */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <TextArea
          label="Decision Rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Document your rationale for this task split..."
        />
      </motion.div>

      {/* Worked examples */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Worked Examples
          </h3>
        </div>
        <div className="space-y-3">
          {workedExamples.map((ex) => (
            <div
              key={ex.code}
              className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)]"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[var(--accent)]">{ex.code}</span>
                <span className="text-xs text-[var(--text-primary)] font-medium">{ex.title}</span>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">{ex.split}</div>
              <div className="text-xs text-[var(--text-muted)] italic mt-1">{ex.rationale}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
