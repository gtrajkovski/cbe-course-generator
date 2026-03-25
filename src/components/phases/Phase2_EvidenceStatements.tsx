import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  RefreshCw,
  Edit3,
  Check,
  TreePine,
  FileText,
  Target,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type {
  EvidenceStatement,
  LearningObjective,
  CognitiveLevel,
} from '../../lib/types';
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

const bloomOptions: { value: CognitiveLevel; label: string }[] = [
  { value: 1, label: '1 - Remember' },
  { value: 2, label: '2 - Understand' },
  { value: 3, label: '3 - Apply' },
  { value: 4, label: '4 - Analyze' },
  { value: 5, label: '5 - Evaluate' },
  { value: 6, label: '6 - Create' },
];

// ============================================================
// Inline ES Editor
// ============================================================

const ESEditor: React.FC<{
  es: EvidenceStatement;
  onUpdate: (id: string, partial: Partial<EvidenceStatement>) => void;
}> = ({ es, onUpdate }) => {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="text-sm text-[var(--text-primary)]">
              <span className="font-semibold text-[var(--accent)]">{es.code}</span>
              {' '}
              <span className="text-purple-400 font-medium">{es.verb}</span>
              {' '}
              {es.statement}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
              <span>Level {es.cognitiveLevel} ({COGNITIVE_LEVEL_LABELS[es.cognitiveLevel]})</span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
              <span>{es.scopeIn.length} scope-in items</span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
              <span>{es.learningTopics.length} topics</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Scope preview */}
        {(es.scopeIn.length > 0 || es.scopeOut.length > 0) && (
          <div className="flex gap-4 text-xs">
            {es.scopeIn.length > 0 && (
              <div>
                <span className="text-green-400 font-medium">In scope:</span>{' '}
                <span className="text-[var(--text-muted)]">{es.scopeIn.join(', ')}</span>
              </div>
            )}
            {es.scopeOut.length > 0 && (
              <div>
                <span className="text-red-400 font-medium">Out of scope:</span>{' '}
                <span className="text-[var(--text-muted)]">{es.scopeOut.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {es.howStudentsDemonstrate && (
          <div className="text-xs text-[var(--text-muted)] italic">
            How demonstrated: {es.howStudentsDemonstrate}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3 p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)]"
    >
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Code"
          value={es.code}
          onChange={(e) => onUpdate(es.id, { code: e.target.value })}
        />
        <Input
          label="Action Verb"
          value={es.verb}
          onChange={(e) => onUpdate(es.id, { verb: e.target.value })}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Level</label>
          <select
            value={es.cognitiveLevel}
            onChange={(e) => onUpdate(es.id, { cognitiveLevel: Number(e.target.value) as CognitiveLevel })}
            className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none bg-white/[0.03] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-active)] transition-all duration-200 cursor-pointer"
          >
            {bloomOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <TextArea
        label="Statement"
        value={es.statement}
        onChange={(e) => onUpdate(es.id, { statement: e.target.value })}
      />
      <TextArea
        label="Scope In (one per line)"
        value={es.scopeIn.join('\n')}
        onChange={(e) => onUpdate(es.id, { scopeIn: e.target.value.split('\n').filter(Boolean) })}
      />
      <TextArea
        label="Scope Out (one per line)"
        value={es.scopeOut.join('\n')}
        onChange={(e) => onUpdate(es.id, { scopeOut: e.target.value.split('\n').filter(Boolean) })}
      />
      <TextArea
        label="How Students Demonstrate"
        value={es.howStudentsDemonstrate}
        onChange={(e) => onUpdate(es.id, { howStudentsDemonstrate: e.target.value })}
      />
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={() => setEditing(false)}>
          Done
        </Button>
      </div>
    </motion.div>
  );
};

// ============================================================
// LO Display
// ============================================================

const LODisplay: React.FC<{
  lo: LearningObjective;
}> = ({ lo }) => (
  <div className="flex items-start gap-2 pl-6 py-1.5">
    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
    <div className="text-xs">
      <span className="font-semibold text-purple-400">{lo.code}</span>{' '}
      <span className="text-indigo-300 font-medium">{lo.verb}</span>{' '}
      <span className="text-[var(--text-secondary)]">{lo.statement}</span>
    </div>
  </div>
);

// ============================================================
// Competency Accordion
// ============================================================

const CompetencyAccordion: React.FC<{
  compId: string;
  compCode: string;
  compStatement: string;
  evidenceStatements: EvidenceStatement[];
  learningObjectives: LearningObjective[];
  onUpdateES: (id: string, partial: Partial<EvidenceStatement>) => void;
  onRegenerate: (compId: string) => void;
  isRegenerating: boolean;
}> = ({
  compId,
  compCode,
  compStatement,
  evidenceStatements,
  learningObjectives,
  onUpdateES,
  onRegenerate,
  isRegenerating,
}) => {
  const [expanded, setExpanded] = useState(true);

  const esForComp = evidenceStatements.filter((es) => es.parentCompetencyId === compId);

  return (
    <motion.div
      variants={itemVariants}
      layout
      className="glass-card overflow-hidden"
    >
      {/* Accordion header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold">
          {compCode}
        </span>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {compStatement || 'Untitled competency'}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {esForComp.length} evidence statements | {
              learningObjectives.filter((lo) =>
                esForComp.some((es) => es.id === lo.parentESId)
              ).length
            } learning objectives
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate(compId);
            }}
            disabled={isRegenerating}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer disabled:opacity-40"
          >
            {isRegenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </motion.button>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {/* Accordion body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {esForComp.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)] italic text-center py-4">
                  No evidence statements yet. Click "Generate All" to create them.
                </div>
              ) : (
                esForComp.map((es) => {
                  const losForES = learningObjectives.filter((lo) => lo.parentESId === es.id);

                  return (
                    <motion.div
                      key={es.id}
                      layout
                      className="rounded-xl bg-white/[0.015] border border-[var(--border-subtle)] p-4"
                    >
                      <ESEditor es={es} onUpdate={onUpdateES} />

                      {/* Learning Objectives */}
                      {losForES.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                          <div className="text-xs font-medium text-[var(--text-muted)] mb-1 pl-2">
                            Learning Objectives ({losForES.length})
                          </div>
                          {losForES.map((lo) => (
                            <LODisplay key={lo.id} lo={lo} />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
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

export const Phase2_EvidenceStatements: React.FC = () => {
  const {
    project,
    setEvidenceStatements,
    setLearningObjectives,
    updateES,
    isGenerating,
    setGenerating,
    settings,
  } = useAppStore();

  const [regeneratingComp, setRegeneratingComp] = useState<string | null>(null);

  if (!project) return null;

  const totalES = project.evidenceStatements.length;
  const totalLO = project.learningObjectives.length;
  const expectedES = project.competencies.length * 4;
  const expectedLO = expectedES * 2;

  const generateForCompetency = async (compId: string) => {
    const comp = project.competencies.find((c) => c.id === compId);
    if (!comp || !settings.apiKey) return;

    setRegeneratingComp(compId);

    const prompt = `You are a CBE assessment expert. For this competency, generate exactly 4 evidence statements (ES). For each ES, generate exactly 2 learning objectives (LO).

Competency: ${comp.code} - ${comp.statement}
Cognitive Level: ${comp.cognitiveLevel} (${COGNITIVE_LEVEL_LABELS[comp.cognitiveLevel]})
Skills: ${comp.skills.map((s) => `${s.code}: ${s.statement}`).join('; ')}
Scope: ${comp.scopeNotes}

For each ES, provide in JSON format:
{
  "evidenceStatements": [
    {
      "code": "ES${comp.code}.1",
      "verb": "action verb",
      "cognitiveLevel": number,
      "statement": "full statement",
      "scopeIn": ["item1", "item2"],
      "scopeOut": ["item1"],
      "learningTopics": [{"title": "topic", "description": "desc"}],
      "howStudentsDemonstrate": "description",
      "learningObjectives": [
        {"code": "LO${comp.code}.1.1", "verb": "verb", "statement": "statement"},
        {"code": "LO${comp.code}.1.2", "verb": "verb", "statement": "statement"}
      ]
    }
  ]
}

Return ONLY valid JSON, no markdown fences.`;

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
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '';

      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const newES: EvidenceStatement[] = [];
        const newLO: LearningObjective[] = [];

        for (const esData of parsed.evidenceStatements || []) {
          const esId = crypto.randomUUID();
          newES.push({
            id: esId,
            code: esData.code || '',
            verb: esData.verb || '',
            cognitiveLevel: esData.cognitiveLevel || comp.cognitiveLevel,
            statement: esData.statement || '',
            scopeIn: esData.scopeIn || [],
            scopeOut: esData.scopeOut || [],
            learningTopics: (esData.learningTopics || []).map((t: { title: string; description: string }) => ({
              id: crypto.randomUUID(),
              title: t.title,
              description: t.description,
            })),
            parentCompetencyId: compId,
            howStudentsDemonstrate: esData.howStudentsDemonstrate || '',
          });

          for (const loData of esData.learningObjectives || []) {
            newLO.push({
              id: crypto.randomUUID(),
              code: loData.code || '',
              verb: loData.verb || '',
              statement: loData.statement || '',
              parentESId: esId,
            });
          }
        }

        // Replace ES/LO for this competency, keep others
        const existingES = project.evidenceStatements.filter(
          (es) => es.parentCompetencyId !== compId
        );
        const existingESIds = new Set(
          project.evidenceStatements
            .filter((es) => es.parentCompetencyId === compId)
            .map((es) => es.id)
        );
        const existingLO = project.learningObjectives.filter(
          (lo) => !existingESIds.has(lo.parentESId)
        );

        setEvidenceStatements([...existingES, ...newES]);
        setLearningObjectives([...existingLO, ...newLO]);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setRegeneratingComp(null);
    }
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    for (const comp of project.competencies) {
      await generateForCompetency(comp.id);
    }
    setGenerating(false);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stats bar */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[var(--accent)]/10">
            <TreePine className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Evidence Statements & Learning Objectives
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Tree view: Competency &gt; ES (4 each) &gt; LO (2 each)
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] text-center">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {project.competencies.length}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Competencies</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] text-center">
            <div className={clsx(
              'text-2xl font-bold',
              totalES >= expectedES ? 'text-green-400' : 'text-amber-400'
            )}>
              {totalES}
              <span className="text-sm font-normal text-[var(--text-muted)]">/{expectedES}</span>
            </div>
            <div className="text-xs text-[var(--text-muted)]">Evidence Statements</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] text-center">
            <div className={clsx(
              'text-2xl font-bold',
              totalLO >= expectedLO ? 'text-green-400' : 'text-amber-400'
            )}>
              {totalLO}
              <span className="text-sm font-normal text-[var(--text-muted)]">/{expectedLO}</span>
            </div>
            <div className="text-xs text-[var(--text-muted)]">Learning Objectives</div>
          </div>
        </div>

        <Button
          variant="primary"
          icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          onClick={handleGenerateAll}
          loading={isGenerating}
          disabled={project.competencies.length === 0}
          className="w-full"
        >
          {isGenerating ? 'Generating All...' : 'Generate All Evidence Statements'}
        </Button>
      </motion.div>

      {/* Competency accordions */}
      {project.competencies.map((comp) => (
        <CompetencyAccordion
          key={comp.id}
          compId={comp.id}
          compCode={comp.code}
          compStatement={comp.statement}
          evidenceStatements={project.evidenceStatements}
          learningObjectives={project.learningObjectives}
          onUpdateES={updateES}
          onRegenerate={generateForCompetency}
          isRegenerating={regeneratingComp === comp.id}
        />
      ))}
    </motion.div>
  );
};
