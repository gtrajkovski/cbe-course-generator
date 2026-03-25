import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  Target,
  Shield,
  Layers,
  Users,
  AlertCircle,
  Building,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type { TaskModelComponent, Scenario, CognitiveLevel } from '../../lib/types';
import { COGNITIVE_LEVEL_LABELS } from '../../lib/types';
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
// TMC (7-component) Editor
// ============================================================

const TMCEditor: React.FC<{
  esId: string;
  esCode: string;
  tmc: TaskModelComponent | undefined;
  onUpdate: (esId: string, tmc: TaskModelComponent) => void;
}> = ({ esId, esCode, tmc, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  const defaultTMC: TaskModelComponent = {
    performanceIndicator: '',
    knowledgeAreas: [],
    taskDescription: '',
    evaluationCriteria: '',
    commonErrors: [],
    exemplarResponse: '',
    cognitiveComplexity: '',
  };

  const current = tmc || defaultTMC;
  const isComplete =
    current.performanceIndicator.trim() &&
    current.knowledgeAreas.length > 0 &&
    current.taskDescription.trim() &&
    current.evaluationCriteria.trim() &&
    current.commonErrors.length > 0 &&
    current.exemplarResponse.trim() &&
    current.cognitiveComplexity.trim();

  const handleChange = (field: keyof TaskModelComponent, value: string | string[]) => {
    onUpdate(esId, { ...current, [field]: value });
  };

  return (
    <div className="rounded-xl bg-white/[0.015] border border-[var(--border-subtle)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <span className={clsx(
          'w-2 h-2 rounded-full flex-shrink-0',
          isComplete ? 'bg-green-400' : 'bg-amber-400'
        )} />
        <span className="text-xs font-semibold text-[var(--accent)]">{esCode}</span>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          {isComplete ? '7/7 components' : 'Incomplete'}
        </span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-subtle)] pt-4">
              <TextArea
                label="1. Performance Indicator"
                value={current.performanceIndicator}
                onChange={(e) => handleChange('performanceIndicator', e.target.value)}
                placeholder="What observable behavior demonstrates competence?"
              />
              <TextArea
                label="2. Knowledge Areas (one per line)"
                value={current.knowledgeAreas.join('\n')}
                onChange={(e) => handleChange('knowledgeAreas', e.target.value.split('\n').filter(Boolean))}
                placeholder="Key knowledge areas required..."
              />
              <TextArea
                label="3. Task Description"
                value={current.taskDescription}
                onChange={(e) => handleChange('taskDescription', e.target.value)}
                placeholder="Detailed description of what the student will do..."
              />
              <TextArea
                label="4. Evaluation Criteria"
                value={current.evaluationCriteria}
                onChange={(e) => handleChange('evaluationCriteria', e.target.value)}
                placeholder="How will this be evaluated?"
              />
              <TextArea
                label="5. Common Errors (one per line)"
                value={current.commonErrors.join('\n')}
                onChange={(e) => handleChange('commonErrors', e.target.value.split('\n').filter(Boolean))}
                placeholder="Common mistakes students make..."
              />
              <TextArea
                label="6. Exemplar Response"
                value={current.exemplarResponse}
                onChange={(e) => handleChange('exemplarResponse', e.target.value)}
                placeholder="What does a competent response look like?"
              />
              <TextArea
                label="7. Cognitive Complexity"
                value={current.cognitiveComplexity}
                onChange={(e) => handleChange('cognitiveComplexity', e.target.value)}
                placeholder="Describe the cognitive complexity required..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// Scenario Editor
// ============================================================

const ScenarioEditor: React.FC<{
  scenario: Scenario;
  index: number;
  onUpdate: (index: number, scenario: Scenario) => void;
  onRemove: (index: number) => void;
}> = ({ scenario, index, onUpdate, onRemove }) => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (field: keyof Scenario, value: string | string[]) => {
    onUpdate(index, { ...scenario, [field]: value });
  };

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
          <Building className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {scenario.name || `Scenario ${index + 1}`}
          </span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] ml-auto" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] ml-auto" />
          )}
        </button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(index)}
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
                label="Scenario Name"
                value={scenario.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. TechStart Inc. Mobile App Redesign"
              />
              <TextArea
                label="Organization Description"
                value={scenario.orgDescription}
                onChange={(e) => handleChange('orgDescription', e.target.value)}
                placeholder="Brief description of the organization..."
              />
              <Input
                label="Target Users"
                value={scenario.targetUsers}
                onChange={(e) => handleChange('targetUsers', e.target.value)}
                placeholder="e.g. Small business owners aged 25-45"
              />
              <TextArea
                label="Key Challenges (one per line)"
                value={scenario.keyChallenges.join('\n')}
                onChange={(e) => handleChange('keyChallenges', e.target.value.split('\n').filter(Boolean))}
                placeholder="Main challenges the scenario presents..."
              />
              <TextArea
                label="Domain Data"
                value={scenario.domainData}
                onChange={(e) => handleChange('domainData', e.target.value)}
                placeholder="Relevant domain-specific data for the scenario..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================
// Main Component
// ============================================================

export const Phase4_TaskModel: React.FC = () => {
  const {
    project,
    updateTask,
    isGenerating,
    setGenerating,
    settings,
  } = useAppStore();

  const [activeTaskIdx, setActiveTaskIdx] = useState(0);
  const [assignmentStrategy, setAssignmentStrategy] = useState('rotation');
  const [integrityMeasures, setIntegrityMeasures] = useState('');

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
          Go back to Phase 3 (Task Splitting) to define tasks first.
        </p>
      </motion.div>
    );
  }

  const activeTask = tasks[activeTaskIdx] || tasks[0];
  const taskES = project.evidenceStatements.filter((es) =>
    activeTask.esIds.includes(es.id)
  );

  const handleTMCUpdate = (esId: string, tmc: TaskModelComponent) => {
    updateTask(activeTask.id, {
      taskModelComponents: {
        ...activeTask.taskModelComponents,
        [esId]: tmc,
      },
    });
  };

  const handleScenarioUpdate = (index: number, scenario: Scenario) => {
    const scenarios = [...activeTask.scenarios];
    scenarios[index] = scenario;
    updateTask(activeTask.id, { scenarios });
  };

  const handleAddScenario = () => {
    updateTask(activeTask.id, {
      scenarios: [
        ...activeTask.scenarios,
        {
          id: crypto.randomUUID(),
          name: '',
          orgDescription: '',
          targetUsers: '',
          keyChallenges: [],
          domainData: '',
        },
      ],
    });
  };

  const handleRemoveScenario = (index: number) => {
    updateTask(activeTask.id, {
      scenarios: activeTask.scenarios.filter((_, i) => i !== index),
    });
  };

  const handleGenerate = async () => {
    if (!settings.apiKey) return;
    setGenerating(true);

    const esSummary = taskES
      .map((es) => `${es.code}: ${es.verb} - ${es.statement}`)
      .join('\n');

    const prompt = `You are a CBE task model expert. Generate task model components for each evidence statement, plus 5 scenarios.

Task: ${activeTask.name} (Task ${activeTask.number})
Evidence Statements:
${esSummary}

For each ES, generate the 7 task model components:
1. Performance Indicator
2. Knowledge Areas (array)
3. Task Description
4. Evaluation Criteria
5. Common Errors (array)
6. Exemplar Response
7. Cognitive Complexity

Also generate 5 diverse scenarios, each with: name, orgDescription, targetUsers, keyChallenges (array), domainData.

Return as JSON:
{
  "taskModelComponents": {
    "<es_code>": { "performanceIndicator": "", "knowledgeAreas": [], "taskDescription": "", "evaluationCriteria": "", "commonErrors": [], "exemplarResponse": "", "cognitiveComplexity": "" }
  },
  "scenarios": [{ "name": "", "orgDescription": "", "targetUsers": "", "keyChallenges": [], "domainData": "" }]
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

        // Map TMC by ES code to ES id
        const tmcByCode = parsed.taskModelComponents || {};
        const newTMC: Record<string, TaskModelComponent> = {};
        for (const es of taskES) {
          const tmcData = tmcByCode[es.code];
          if (tmcData) {
            newTMC[es.id] = tmcData;
          }
        }

        const scenarios: Scenario[] = (parsed.scenarios || []).map((s: Omit<Scenario, 'id'>) => ({
          id: crypto.randomUUID(),
          ...s,
        }));

        updateTask(activeTask.id, {
          taskModelComponents: { ...activeTask.taskModelComponents, ...newTMC },
          scenarios: [...activeTask.scenarios, ...scenarios],
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

      {/* Generate button */}
      <motion.div variants={itemVariants}>
        <Button
          variant="primary"
          icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          onClick={handleGenerate}
          loading={isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Generating Task Model...' : 'Generate Task Model'}
        </Button>
      </motion.div>

      {/* TMC editors per ES */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[var(--accent)]/10">
            <Layers className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              7-Component Task Model
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {taskES.length} evidence statements in this task
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {taskES.map((es) => (
            <TMCEditor
              key={es.id}
              esId={es.id}
              esCode={es.code}
              tmc={activeTask.taskModelComponents[es.id]}
              onUpdate={handleTMCUpdate}
            />
          ))}
        </div>
      </motion.div>

      {/* Scenarios */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--accent)]/10">
              <Building className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Scenarios
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {activeTask.scenarios.length}/5 minimum scenarios
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleAddScenario}
          >
            Add Scenario
          </Button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {activeTask.scenarios.map((scenario, i) => (
              <ScenarioEditor
                key={scenario.id}
                scenario={scenario}
                index={i}
                onUpdate={handleScenarioUpdate}
                onRemove={handleRemoveScenario}
              />
            ))}
          </AnimatePresence>
        </div>

        {activeTask.scenarios.length < 5 && (
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            At least 5 scenarios are required per task
          </div>
        )}
      </motion.div>

      {/* Assignment Strategy */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[var(--accent)]/10">
            <Users className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Assignment Strategy
          </h2>
        </div>

        <div className="space-y-3">
          {[
            { value: 'rotation', label: 'Rotation Model', desc: 'Students rotate through scenarios in order' },
            { value: 'random-id', label: 'Random by Student ID', desc: 'Scenario assigned based on student ID hash' },
            { value: 'random', label: 'Fully Random', desc: 'Random scenario assignment each attempt' },
            { value: 'choice', label: 'Student Choice', desc: 'Students select their preferred scenario' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={clsx(
                'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200',
                assignmentStrategy === opt.value
                  ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30'
                  : 'bg-white/[0.02] border-[var(--border-subtle)] hover:border-[var(--accent)]/20'
              )}
            >
              <input
                type="radio"
                name="strategy"
                value={opt.value}
                checked={assignmentStrategy === opt.value}
                onChange={(e) => setAssignmentStrategy(e.target.value)}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Academic Integrity */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[var(--accent)]/10">
            <Shield className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Academic Integrity Measures
          </h2>
        </div>
        <TextArea
          value={integrityMeasures}
          onChange={(e) => setIntegrityMeasures(e.target.value)}
          placeholder="Describe measures to ensure academic integrity (e.g., unique scenarios, anti-plagiarism checks, authenticity markers)..."
        />
      </motion.div>
    </motion.div>
  );
};
