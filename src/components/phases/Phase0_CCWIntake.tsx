import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Users,
  GraduationCap,
  FileText,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type {
  Competency,
  Skill,
  CognitiveLevel,
  ProjectMetadata,
} from '../../lib/types';
import { COGNITIVE_LEVEL_LABELS } from '../../lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';

// ============================================================
// Helpers
// ============================================================

function newSkill(): Skill {
  return { code: '', statement: '', level: 1 };
}

function newCompetency(index: number): Competency {
  return {
    id: crypto.randomUUID(),
    code: `C${index + 1}`,
    statement: '',
    cognitiveLevel: 3,
    weight: 0,
    skills: [newSkill()],
    scopeNotes: '',
  };
}

const bloomOptions: { value: CognitiveLevel; label: string }[] = [
  { value: 1, label: '1 - Remember' },
  { value: 2, label: '2 - Understand' },
  { value: 3, label: '3 - Apply' },
  { value: 4, label: '4 - Analyze' },
  { value: 5, label: '5 - Evaluate' },
  { value: 6, label: '6 - Create' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ============================================================
// Section Card
// ============================================================

const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className }) => (
  <motion.div variants={itemVariants} className={clsx('glass-card p-6', className)}>
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-xl bg-[var(--accent)]/10">{icon}</div>
      <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
    </div>
    {children}
  </motion.div>
);

// ============================================================
// Competency Card
// ============================================================

const CompetencyCard: React.FC<{
  comp: Competency;
  index: number;
  onUpdate: (id: string, partial: Partial<Competency>) => void;
  onRemove: (id: string) => void;
}> = ({ comp, index, onUpdate, onRemove }) => {
  const [expanded, setExpanded] = React.useState(true);

  const updateSkill = (sIdx: number, partial: Partial<Skill>) => {
    const skills = comp.skills.map((s, i) => (i === sIdx ? { ...s, ...partial } : s));
    onUpdate(comp.id, { skills });
  };

  const addSkill = () => {
    onUpdate(comp.id, { skills: [...comp.skills, newSkill()] });
  };

  const removeSkill = (sIdx: number) => {
    onUpdate(comp.id, { skills: comp.skills.filter((_, i) => i !== sIdx) });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="glass-card p-5 relative group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 cursor-pointer flex-1"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold">
            {index + 1}
          </span>
          <div className="text-left">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {comp.code || `Competency ${index + 1}`}
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate max-w-md">
              {comp.statement || 'No statement yet'}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
          )}
        </button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(comp.id)}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ml-2"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label="Competency Code"
                value={comp.code}
                onChange={(e) => onUpdate(comp.id, { code: e.target.value })}
                placeholder="e.g. 4033.1.1"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Cognitive Level
                </label>
                <select
                  value={comp.cognitiveLevel}
                  onChange={(e) =>
                    onUpdate(comp.id, {
                      cognitiveLevel: Number(e.target.value) as CognitiveLevel,
                    })
                  }
                  className={clsx(
                    'w-full px-4 py-2.5 rounded-xl text-sm appearance-none',
                    'bg-white/[0.03] backdrop-blur-sm',
                    'border border-[var(--border-subtle)]',
                    'text-[var(--text-primary)]',
                    'focus:outline-none focus:border-[var(--border-active)]',
                    'focus:ring-2 focus:ring-[var(--accent)]/20',
                    'transition-all duration-200 cursor-pointer'
                  )}
                >
                  {bloomOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <TextArea
              label="Competency Statement"
              value={comp.statement}
              onChange={(e) => onUpdate(comp.id, { statement: e.target.value })}
              placeholder="The student will be able to..."
              className="mb-4"
            />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label="Weight (%)"
                type="number"
                min={0}
                max={100}
                value={comp.weight}
                onChange={(e) =>
                  onUpdate(comp.id, { weight: Number(e.target.value) })
                }
                placeholder="e.g. 25"
              />
            </div>

            {/* Skills */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Skills
                </label>
                <Button variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addSkill}>
                  Add Skill
                </Button>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {comp.skills.map((skill, sIdx) => (
                    <motion.div
                      key={sIdx}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)]"
                    >
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Code"
                          value={skill.code}
                          onChange={(e) =>
                            updateSkill(sIdx, { code: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Statement"
                          value={skill.statement}
                          onChange={(e) =>
                            updateSkill(sIdx, { statement: e.target.value })
                          }
                          className="col-span-1"
                        />
                        <select
                          value={skill.level}
                          onChange={(e) =>
                            updateSkill(sIdx, {
                              level: Number(e.target.value) as CognitiveLevel,
                            })
                          }
                          className={clsx(
                            'w-full px-3 py-2.5 rounded-xl text-sm appearance-none',
                            'bg-white/[0.03] border border-[var(--border-subtle)]',
                            'text-[var(--text-primary)]',
                            'focus:outline-none focus:border-[var(--border-active)]',
                            'transition-all duration-200 cursor-pointer'
                          )}
                        >
                          {bloomOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeSkill(sIdx)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <TextArea
              label="Scope Notes"
              value={comp.scopeNotes}
              onChange={(e) => onUpdate(comp.id, { scopeNotes: e.target.value })}
              placeholder="Define what is in-scope and out-of-scope for this competency..."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================
// Validation Checklist
// ============================================================

const ValidationChecklist: React.FC = () => {
  const { project } = useAppStore();
  if (!project) return null;

  const checks: { label: string; passed: boolean }[] = [];

  // Metadata checks
  checks.push({ label: 'Course code entered', passed: !!project.metadata.courseCode.trim() });
  checks.push({ label: 'Course title entered', passed: !!project.metadata.courseTitle.trim() });
  checks.push({ label: 'Credit units > 0', passed: project.metadata.creditUnits > 0 });
  checks.push({ label: 'Course description entered', passed: !!project.metadata.courseDescription.trim() });
  checks.push({ label: 'Target audience defined', passed: !!project.metadata.targetAudience.trim() });

  // Competency checks
  checks.push({ label: 'At least one competency', passed: project.competencies.length > 0 });

  const allHaveStatements = project.competencies.every((c) => c.statement.trim().length > 0);
  checks.push({ label: 'All competencies have statements', passed: project.competencies.length === 0 || allHaveStatements });

  const allHaveLevels = project.competencies.every((c) => c.cognitiveLevel >= 1);
  checks.push({ label: 'All competencies have cognitive levels', passed: project.competencies.length === 0 || allHaveLevels });

  const allHaveSkills = project.competencies.every((c) => c.skills.length > 0);
  checks.push({ label: 'All competencies have skills', passed: project.competencies.length === 0 || allHaveSkills });

  const allSkillsLeveled = project.competencies.every((c) =>
    c.skills.every((s) => s.statement.trim().length > 0 && s.level >= 1)
  );
  checks.push({ label: 'All skills have statements and levels', passed: project.competencies.length === 0 || allSkillsLeveled });

  const allHaveScope = project.competencies.every((c) => c.scopeNotes.trim().length > 0);
  checks.push({ label: 'Scope notes defined for all competencies', passed: project.competencies.length === 0 || allHaveScope });

  const totalWeight = project.competencies.reduce((s, c) => s + c.weight, 0);
  checks.push({
    label: `Competency weights sum to 100% (current: ${totalWeight}%)`,
    passed: project.competencies.length === 0 || Math.abs(totalWeight - 100) < 0.01,
  });

  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <motion.div variants={itemVariants} className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-[var(--accent)]/10">
          <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Validation Checklist
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {passedCount}/{checks.length} checks passed
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-white/5 mb-4 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${(passedCount / checks.length) * 100}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>

      <div className="space-y-2">
        {checks.map((check, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg',
              check.passed ? 'bg-green-500/5' : 'bg-red-500/5'
            )}
          >
            {check.passed ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span
              className={clsx(
                'text-sm',
                check.passed ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
              )}
            >
              {check.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================
// Main Component
// ============================================================

export const Phase0_CCWIntake: React.FC = () => {
  const {
    project,
    createProject,
    updateMetadata,
    addCompetency,
    updateCompetency,
    removeCompetency,
  } = useAppStore();

  // Auto-create project if none exists
  useEffect(() => {
    if (!project) {
      createProject({
        courseCode: '',
        courseTitle: '',
        creditUnits: 3,
        school: '',
        program: '',
        domainCode: '',
        paCode: '',
        cpltCode: '',
        assessmentModality: '',
        certificationAlignment: '',
        primaryTextbook: '',
        keyResources: [],
        pdo: '',
        id_name: '',
        ad: '',
        sme: '',
        itx: '',
        targetAudience: '',
        courseDescription: '',
        prerequisites: '',
        technologyRequirements: [],
      });
    }
  }, [project, createProject]);

  if (!project) return null;

  const meta = project.metadata;
  const totalWeight = project.competencies.reduce((s, c) => s + c.weight, 0);

  const handleAddCompetency = () => {
    addCompetency(newCompetency(project.competencies.length));
  };

  const handleMetaChange = (field: keyof ProjectMetadata, value: string | number | string[]) => {
    updateMetadata({ [field]: value });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Course Metadata */}
      <SectionCard
        title="Course Metadata"
        icon={<BookOpen className="w-5 h-5 text-[var(--accent)]" />}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Course Code"
            value={meta.courseCode}
            onChange={(e) => handleMetaChange('courseCode', e.target.value)}
            placeholder="e.g. E069"
          />
          <Input
            label="Course Title"
            value={meta.courseTitle}
            onChange={(e) => handleMetaChange('courseTitle', e.target.value)}
            placeholder="e.g. User Experience Design"
          />
          <Input
            label="Credit Units"
            type="number"
            min={1}
            value={meta.creditUnits}
            onChange={(e) => handleMetaChange('creditUnits', Number(e.target.value))}
          />
          <Input
            label="School"
            value={meta.school}
            onChange={(e) => handleMetaChange('school', e.target.value)}
            placeholder="e.g. School of IT"
          />
          <Input
            label="Program"
            value={meta.program}
            onChange={(e) => handleMetaChange('program', e.target.value)}
            placeholder="e.g. BS Software Engineering"
          />
          <Input
            label="Domain Code"
            value={meta.domainCode}
            onChange={(e) => handleMetaChange('domainCode', e.target.value)}
            placeholder="e.g. 4033"
          />
          <Input
            label="PA Code"
            value={meta.paCode}
            onChange={(e) => handleMetaChange('paCode', e.target.value)}
            placeholder="e.g. FLP2"
          />
          <Input
            label="CPLT Code"
            value={meta.cpltCode}
            onChange={(e) => handleMetaChange('cpltCode', e.target.value)}
            placeholder="e.g. CPLT-1234"
          />
          <Input
            label="Assessment Modality"
            value={meta.assessmentModality}
            onChange={(e) => handleMetaChange('assessmentModality', e.target.value)}
            placeholder="e.g. Performance Assessment"
          />
          <Input
            label="Certification Alignment"
            value={meta.certificationAlignment}
            onChange={(e) => handleMetaChange('certificationAlignment', e.target.value)}
            placeholder="e.g. CompTIA UX+"
          />
        </div>
      </SectionCard>

      {/* Resources */}
      <SectionCard
        title="Resources & Textbook"
        icon={<FileText className="w-5 h-5 text-[var(--accent)]" />}
      >
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Primary Textbook"
            value={meta.primaryTextbook}
            onChange={(e) => handleMetaChange('primaryTextbook', e.target.value)}
            placeholder="Title, Author, Edition"
          />
          <TextArea
            label="Technology Requirements"
            value={meta.technologyRequirements.join('\n')}
            onChange={(e) =>
              handleMetaChange(
                'technologyRequirements',
                e.target.value.split('\n').filter(Boolean)
              )
            }
            placeholder="One technology per line (e.g. Figma, VS Code)"
          />
          <TextArea
            label="Prerequisites"
            value={meta.prerequisites}
            onChange={(e) => handleMetaChange('prerequisites', e.target.value)}
            placeholder="Course prerequisites..."
          />
        </div>
      </SectionCard>

      {/* Team */}
      <SectionCard
        title="Course Team"
        icon={<Users className="w-5 h-5 text-[var(--accent)]" />}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="PDO"
            value={meta.pdo}
            onChange={(e) => handleMetaChange('pdo', e.target.value)}
            placeholder="Product Development Owner"
          />
          <Input
            label="Instructional Designer"
            value={meta.id_name}
            onChange={(e) => handleMetaChange('id_name', e.target.value)}
            placeholder="ID Name"
          />
          <Input
            label="Assessment Developer"
            value={meta.ad}
            onChange={(e) => handleMetaChange('ad', e.target.value)}
            placeholder="AD Name"
          />
          <Input
            label="Subject Matter Expert"
            value={meta.sme}
            onChange={(e) => handleMetaChange('sme', e.target.value)}
            placeholder="SME Name"
          />
          <Input
            label="ITX"
            value={meta.itx}
            onChange={(e) => handleMetaChange('itx', e.target.value)}
            placeholder="ITX Name"
          />
        </div>
      </SectionCard>

      {/* Audience & Description */}
      <SectionCard
        title="Course Description & Audience"
        icon={<GraduationCap className="w-5 h-5 text-[var(--accent)]" />}
      >
        <div className="space-y-4">
          <Input
            label="Target Audience"
            value={meta.targetAudience}
            onChange={(e) => handleMetaChange('targetAudience', e.target.value)}
            placeholder="e.g. Working professionals seeking a BS in Software Engineering"
          />
          <TextArea
            label="Course Description"
            value={meta.courseDescription}
            onChange={(e) => handleMetaChange('courseDescription', e.target.value)}
            placeholder="A comprehensive description of the course..."
          />
        </div>
      </SectionCard>

      {/* Competencies */}
      <SectionCard
        title="Competencies"
        icon={<Layers className="w-5 h-5 text-[var(--accent)]" />}
      >
        {/* Weight indicator */}
        {project.competencies.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-[var(--text-secondary)]">Total Weight</span>
              <span
                className={clsx(
                  'font-semibold',
                  Math.abs(totalWeight - 100) < 0.01
                    ? 'text-green-400'
                    : 'text-amber-400'
                )}
              >
                {totalWeight}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={clsx(
                  'h-full rounded-full',
                  Math.abs(totalWeight - 100) < 0.01
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : totalWeight > 100
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                )}
                animate={{ width: `${Math.min(totalWeight, 100)}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>
            {Math.abs(totalWeight - 100) > 0.01 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 mt-2 text-xs text-amber-400"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Weights should sum to 100%
              </motion.div>
            )}
          </div>
        )}

        {/* Competency list */}
        <div className="space-y-4 mb-4">
          <AnimatePresence>
            {project.competencies.map((comp, i) => (
              <CompetencyCard
                key={comp.id}
                comp={comp}
                index={i}
                onUpdate={updateCompetency}
                onRemove={removeCompetency}
              />
            ))}
          </AnimatePresence>
        </div>

        <Button
          variant="secondary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleAddCompetency}
          className="w-full"
        >
          Add Competency
        </Button>
      </SectionCard>

      {/* Validation */}
      <ValidationChecklist />
    </motion.div>
  );
};
