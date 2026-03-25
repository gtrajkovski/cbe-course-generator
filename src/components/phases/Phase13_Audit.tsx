import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Link2,
  BarChart3,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type { Project } from '../../lib/types';
import { Button } from '../ui/Button';

// ── Status indicator ───────────────────────────────────────────
type DocStatus = 'complete' | 'partial' | 'missing';

const STATUS_META: Record<DocStatus, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  complete: { label: 'Complete', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  partial: { label: 'Partial', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  missing: { label: 'Missing', icon: <XCircle className="w-4 h-4" />, color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
};

// ── Checklist item definitions (Appendix D) ────────────────────
interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  evaluate: (project: Project) => DocStatus;
}

function buildChecklist(): ChecklistItem[] {
  return [
    // Course Setup
    { id: 'meta-complete', category: 'Course Setup', label: 'Project metadata fully completed', evaluate: (p) => p.metadata.courseCode && p.metadata.courseTitle && p.metadata.courseDescription ? 'complete' : 'missing' },
    { id: 'comp-defined', category: 'Course Setup', label: 'All competencies defined with cognitive levels', evaluate: (p) => p.competencies.length > 0 && p.competencies.every((c) => c.cognitiveLevel) ? 'complete' : p.competencies.length > 0 ? 'partial' : 'missing' },
    { id: 'comp-weights', category: 'Course Setup', label: 'Competency weights sum to 100%', evaluate: (p) => { const total = p.competencies.reduce((sum, c) => sum + c.weight, 0); return Math.abs(total - 100) < 0.01 ? 'complete' : 'partial'; } },

    // Evidence Statements
    { id: 'es-per-comp', category: 'Evidence Statements', label: '4 ES per competency', evaluate: (p) => { const ok = p.competencies.every((c) => p.evidenceStatements.filter((es) => es.parentCompetencyId === c.id).length >= 4); return ok ? 'complete' : p.evidenceStatements.length > 0 ? 'partial' : 'missing'; } },
    { id: 'lo-per-es', category: 'Evidence Statements', label: '2 LO per ES', evaluate: (p) => { const ok = p.evidenceStatements.every((es) => p.learningObjectives.filter((lo) => lo.parentESId === es.id).length >= 2); return ok ? 'complete' : p.learningObjectives.length > 0 ? 'partial' : 'missing'; } },
    { id: 'es-verbs', category: 'Evidence Statements', label: 'ES verbs at or below competency level', evaluate: (p) => { const ok = p.evidenceStatements.every((es) => { const comp = p.competencies.find((c) => c.id === es.parentCompetencyId); return comp ? es.cognitiveLevel <= comp.cognitiveLevel : true; }); return ok ? 'complete' : 'partial'; } },

    // Tasks
    { id: 'tasks-defined', category: 'Task Architecture', label: 'Tasks defined with ES assignments', evaluate: (p) => p.tasks.length > 0 && p.tasks.every((t) => t.esIds.length > 0) ? 'complete' : p.tasks.length > 0 ? 'partial' : 'missing' },
    { id: 'all-es-assigned', category: 'Task Architecture', label: 'All ES assigned to tasks', evaluate: (p) => { const assigned = new Set(p.tasks.flatMap((t) => t.esIds)); return p.evidenceStatements.every((es) => assigned.has(es.id)) ? 'complete' : 'partial'; } },
    { id: 'task-model', category: 'Task Models', label: '7 components per ES in task model', evaluate: (p) => { const ok = p.tasks.every((t) => t.esIds.every((esId) => t.taskModelComponents[esId])); return ok ? 'complete' : 'partial'; } },
    { id: 'scenarios', category: 'Task Models', label: '5+ scenarios per task', evaluate: (p) => p.tasks.every((t) => t.scenarios.length >= 5) ? 'complete' : p.tasks.some((t) => t.scenarios.length > 0) ? 'partial' : 'missing' },

    // PA
    { id: 'prompts', category: 'PA Prompts', label: 'Prompts defined for all tasks', evaluate: (p) => p.tasks.every((t) => t.prompts.length > 0) ? 'complete' : 'partial' },
    { id: 'rubric', category: 'PA Prompts', label: 'Rubric rows for all prompts (C/D present)', evaluate: (p) => p.tasks.every((t) => t.rubric.length > 0 && t.rubric.every((r) => r.competent.trim() && r.notEvident.trim())) ? 'complete' : 'partial' },

    // SSD
    { id: 'ssd-sections', category: 'SSD', label: 'SSD sections for all competencies', evaluate: (p) => p.competencies.every((c) => p.ssdSections.some((s) => s.competencyId === c.id)) ? 'complete' : p.ssdSections.length > 0 ? 'partial' : 'missing' },
    { id: 'ssd-resources', category: 'SSD', label: 'All units have learning resources', evaluate: (p) => { const allUnits = p.ssdSections.flatMap((s) => s.lessons.flatMap((l) => l.units)); return allUnits.length > 0 && allUnits.every((u) => u.resources.length > 0) ? 'complete' : allUnits.length > 0 ? 'partial' : 'missing'; } },
    { id: 'ssd-content', category: 'SSD', label: 'Unit content generated (~500 words each)', evaluate: (p) => { const allUnits = p.ssdSections.flatMap((s) => s.lessons.flatMap((l) => l.units)); return allUnits.length > 0 && allUnits.every((u) => (u.content?.split(/\s+/).length ?? 0) >= 400) ? 'complete' : allUnits.some((u) => u.content) ? 'partial' : 'missing'; } },

    // Knowledge Checks
    { id: 'kc-per-lesson', category: 'Knowledge Checks', label: '4 KCs per lesson', evaluate: (p) => { const allLessons = p.ssdSections.flatMap((s) => s.lessons); return allLessons.every((l) => p.knowledgeChecks.filter((kc) => kc.lessonId === l.id).length >= 4) ? 'complete' : p.knowledgeChecks.length > 0 ? 'partial' : 'missing'; } },
    { id: 'kc-options', category: 'Knowledge Checks', label: '4 options per KC with feedback', evaluate: (p) => p.knowledgeChecks.every((kc) => kc.options.length >= 4 && kc.options.every((o) => o.feedback.trim())) ? 'complete' : 'partial' },

    // Sample Responses
    { id: 'samples', category: 'Sample Responses', label: '2 samples per task (formal + conversational)', evaluate: (p) => { const ok = p.tasks.every((t) => { const s = p.sampleResponses.filter((sr) => sr.taskId === t.id); return s.some((sr) => sr.style === 'formal-technical') && s.some((sr) => sr.style === 'conversational-practical'); }); return ok ? 'complete' : p.sampleResponses.length > 0 ? 'partial' : 'missing'; } },

    // Feedback
    { id: 'feedback', category: 'Feedback', label: 'SME feedback processed', evaluate: (p) => p.feedbackComments.length > 0 && p.feedbackComments.every((f) => f.verdict && f.rationale.trim()) ? 'complete' : p.feedbackComments.length > 0 ? 'partial' : 'missing' },

    // Versioning
    { id: 'versions-pa', category: 'Versioning', label: 'PA document versioned', evaluate: (p) => p.documentVersions.some((d) => d.documentType === 'PA') ? 'complete' : 'missing' },
    { id: 'versions-ssd', category: 'Versioning', label: 'SSD document versioned', evaluate: (p) => p.documentVersions.some((d) => d.documentType === 'SSD') ? 'complete' : 'missing' },
  ];
}

// ── 7-pass audit runner ────────────────────────────────────────
interface AuditPass {
  name: string;
  description: string;
  run: (project: Project) => { passed: boolean; details: string[] };
}

function build7PassAudit(): AuditPass[] {
  return [
    {
      name: 'Pass 1: Structural Completeness',
      description: 'All required documents and sections present',
      run: (p) => {
        const details: string[] = [];
        if (p.competencies.length === 0) details.push('No competencies defined');
        if (p.evidenceStatements.length === 0) details.push('No evidence statements');
        if (p.tasks.length === 0) details.push('No tasks defined');
        if (p.ssdSections.length === 0) details.push('No SSD sections');
        return { passed: details.length === 0, details };
      },
    },
    {
      name: 'Pass 2: Alignment Chain',
      description: 'Competency > ES > LO > Task > Prompt > Rubric traceability',
      run: (p) => {
        const details: string[] = [];
        for (const comp of p.competencies) {
          const esForComp = p.evidenceStatements.filter((es) => es.parentCompetencyId === comp.id);
          if (esForComp.length === 0) details.push(`${comp.code}: no ES`);
          for (const es of esForComp) {
            const losForES = p.learningObjectives.filter((lo) => lo.parentESId === es.id);
            if (losForES.length === 0) details.push(`${es.code}: no LOs`);
          }
        }
        const assignedES = new Set(p.tasks.flatMap((t) => t.esIds));
        for (const es of p.evidenceStatements) {
          if (!assignedES.has(es.id)) details.push(`${es.code}: not assigned to task`);
        }
        return { passed: details.length === 0, details };
      },
    },
    {
      name: 'Pass 3: Cognitive Level Compliance',
      description: 'ES verbs at or below competency ceiling, proper Bloom\'s leveling',
      run: (p) => {
        const details: string[] = [];
        for (const es of p.evidenceStatements) {
          const comp = p.competencies.find((c) => c.id === es.parentCompetencyId);
          if (comp && es.cognitiveLevel > comp.cognitiveLevel) {
            details.push(`${es.code}: L${es.cognitiveLevel} exceeds ${comp.code} ceiling L${comp.cognitiveLevel}`);
          }
        }
        return { passed: details.length === 0, details };
      },
    },
    {
      name: 'Pass 4: Rubric Completeness',
      description: 'All rubric rows have C/D levels with standard language',
      run: (p) => {
        const details: string[] = [];
        for (const task of p.tasks) {
          for (const row of task.rubric) {
            if (!row.competent.trim()) details.push(`Task ${task.number} ${row.promptCode}: missing Competent`);
            if (!row.notEvident.trim()) details.push(`Task ${task.number} ${row.promptCode}: missing Not Evident`);
          }
          const promptCodes = new Set(task.prompts.map((pr) => pr.code));
          const rubricCodes = new Set(task.rubric.map((r) => r.promptCode));
          for (const code of promptCodes) {
            if (!rubricCodes.has(code)) details.push(`Task ${task.number}: no rubric for ${code}`);
          }
        }
        return { passed: details.length === 0, details };
      },
    },
    {
      name: 'Pass 5: SSD Resource Coverage',
      description: 'Every unit has at least one resource, LO coverage complete',
      run: (p) => {
        const details: string[] = [];
        const allUnits = p.ssdSections.flatMap((s) => s.lessons.flatMap((l) => l.units));
        for (const unit of allUnits) {
          if (unit.resources.length === 0) details.push(`Unit ${unit.code}: no resources`);
        }
        return { passed: details.length === 0, details };
      },
    },
    {
      name: 'Pass 6: Knowledge Check Quality',
      description: '4 KCs per lesson, proper feedback, correct answer format',
      run: (p) => {
        const details: string[] = [];
        const allLessons = p.ssdSections.flatMap((s) => s.lessons);
        for (const lesson of allLessons) {
          const lessonKCs = p.knowledgeChecks.filter((kc) => kc.lessonId === lesson.id);
          if (lessonKCs.length < 4) details.push(`"${lesson.title}": ${lessonKCs.length}/4 KCs`);
          for (const kc of lessonKCs) {
            const correct = kc.options.find((o) => o.isCorrect);
            if (correct && !correct.feedback.startsWith('Correct!')) {
              details.push(`KC: correct feedback doesn't start with "Correct!"`);
            }
          }
        }
        return { passed: details.length === 0, details };
      },
    },
    {
      name: 'Pass 7: Sample Response Differentiation',
      description: 'Two distinct samples per task with different scenarios/styles',
      run: (p) => {
        const details: string[] = [];
        for (const task of p.tasks) {
          const taskSamples = p.sampleResponses.filter((s) => s.taskId === task.id);
          if (taskSamples.length < 2) details.push(`Task ${task.number}: fewer than 2 samples`);
          const formal = taskSamples.find((s) => s.style === 'formal-technical');
          const conv = taskSamples.find((s) => s.style === 'conversational-practical');
          if (!formal) details.push(`Task ${task.number}: missing formal-technical sample`);
          if (!conv) details.push(`Task ${task.number}: missing conversational-practical sample`);
          if (formal && conv && formal.scenarioId === conv.scenarioId) {
            details.push(`Task ${task.number}: both samples use same scenario`);
          }
        }
        return { passed: details.length === 0, details };
      },
    },
  ];
}

// ── Alignment chain visualizer ─────────────────────────────────
const AlignmentChain: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <div className="space-y-2">
      {project.competencies.map((comp) => {
        const esForComp = project.evidenceStatements.filter((es) => es.parentCompetencyId === comp.id);
        return (
          <div key={comp.id} className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-indigo-400">{comp.code}</span>
              <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)]">{esForComp.length} ES</span>
              <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)]">
                {esForComp.reduce((sum, es) => sum + project.learningObjectives.filter((lo) => lo.parentESId === es.id).length, 0)} LO
              </span>
              <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)]">
                {project.tasks.filter((t) => t.competencyIds.includes(comp.id)).length} Tasks
              </span>
              <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)]">
                {project.tasks.filter((t) => t.competencyIds.includes(comp.id)).reduce((sum, t) => sum + t.prompts.length, 0)} Prompts
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const Phase13_Audit: React.FC = () => {
  const { currentProject } = useAppStore();

  const [auditResults, setAuditResults] = useState<{ name: string; passed: boolean; details: string[] }[] | null>(null);
  const [showChain, setShowChain] = useState(false);

  const checklist = useMemo(() => buildChecklist(), []);
  const auditPasses = useMemo(() => build7PassAudit(), []);

  const checklistResults = useMemo(() => {
    if (!currentProject) return [];
    return checklist.map((item) => ({
      ...item,
      status: item.evaluate(currentProject),
    }));
  }, [currentProject, checklist]);

  const categories = useMemo(() => {
    const cats = new Map<string, typeof checklistResults>();
    for (const result of checklistResults) {
      const existing = cats.get(result.category) ?? [];
      existing.push(result);
      cats.set(result.category, existing);
    }
    return cats;
  }, [checklistResults]);

  const totalComplete = checklistResults.filter((r) => r.status === 'complete').length;
  const totalPartial = checklistResults.filter((r) => r.status === 'partial').length;
  const totalMissing = checklistResults.filter((r) => r.status === 'missing').length;
  const progressPercent = checklistResults.length > 0
    ? Math.round((totalComplete / checklistResults.length) * 100)
    : 0;

  const run7PassAudit = useCallback(() => {
    if (!currentProject) return;
    const results = auditPasses.map((pass) => {
      const result = pass.run(currentProject);
      return { name: pass.name, passed: result.passed, details: result.details };
    });
    setAuditResults(results);
  }, [currentProject, auditPasses]);

  const handleBatchExport = useCallback(() => {
    // Placeholder for batch export
    alert('Batch export would generate all documents as .docx files');
  }, []);

  if (!currentProject) return null;

  return (
    <div className="space-y-6">
      {/* Progress overview */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Final Audit Dashboard</h3>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold text-[var(--text-primary)]">{progressPercent}%</p>
              <p className="text-xs text-[var(--text-muted)]">Overall Completion</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 rounded-full bg-white/[0.05] overflow-hidden mb-4">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              progressPercent === 100
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : progressPercent >= 70
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status counts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-lg font-bold text-emerald-400">{totalComplete}</p>
              <p className="text-xs text-[var(--text-muted)]">Complete</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-lg font-bold text-amber-400">{totalPartial}</p>
              <p className="text-xs text-[var(--text-muted)]">Partial</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
            <XCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-lg font-bold text-red-400">{totalMissing}</p>
              <p className="text-xs text-[var(--text-muted)]">Missing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Link2 className="w-3.5 h-3.5" />}
            onClick={() => setShowChain(!showChain)}
          >
            {showChain ? 'Hide' : 'Show'} Alignment Chain
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Shield className="w-3.5 h-3.5" />}
            onClick={run7PassAudit}
          >
            Run 7-Pass Audit
          </Button>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Download className="w-3.5 h-3.5" />}
          onClick={handleBatchExport}
        >
          Batch Export All Documents
        </Button>
      </div>

      {/* Alignment chain */}
      <AnimatePresence>
        {showChain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5 overflow-hidden"
          >
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" />
              Alignment Chain Verification
            </h4>
            <AlignmentChain project={currentProject} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7-pass audit results */}
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
              7-Pass Document Audit
            </h4>
            {auditResults.map((result, i) => (
              <div key={i} className={clsx(
                'p-3 rounded-xl border',
                result.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
              )}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {result.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm font-medium text-[var(--text-primary)]">{result.name}</span>
                  </div>
                  <span className={clsx('text-xs font-medium', result.passed ? 'text-emerald-400' : 'text-red-400')}>
                    {result.passed ? 'PASSED' : `${result.details.length} issues`}
                  </span>
                </div>
                {!result.passed && result.details.length > 0 && (
                  <div className="mt-2 pl-6 space-y-1">
                    {result.details.slice(0, 5).map((detail, j) => (
                      <p key={j} className="text-xs text-red-300/80">&bull; {detail}</p>
                    ))}
                    {result.details.length > 5 && (
                      <p className="text-xs text-[var(--text-muted)]">...and {result.details.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Master checklist */}
      <div className="space-y-4">
        {Array.from(categories.entries()).map(([category, items]) => {
          const catComplete = items.filter((i) => i.status === 'complete').length;
          return (
            <div key={category} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{category}</span>
                </div>
                <span className={clsx(
                  'text-xs font-medium',
                  catComplete === items.length ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {catComplete}/{items.length}
                </span>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {items.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <div
                      key={item.id}
                      className={clsx('flex items-center justify-between p-3 hover:bg-white/[0.01] transition-colors')}
                    >
                      <div className="flex items-center gap-2">
                        <span className={meta.color}>{meta.icon}</span>
                        <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
                      </div>
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-md border', meta.bgColor, meta.color)}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
