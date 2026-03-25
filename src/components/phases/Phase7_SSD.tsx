import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Video,
  Globe,
  FileText,
  Monitor,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Link2,
  Table,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type {
  SSDSection,
  SSDLesson,
  SSDUnit,
  LearningResource,
  Competency,
  EvidenceStatement,
  LearningObjective,
} from '../../lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';

// ── Resource type configuration ────────────────────────────────
const RESOURCE_TYPE_META: Record<LearningResource['type'], { label: string; icon: React.ReactNode; color: string }> = {
  textbook: { label: 'Textbook', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  tutorial: { label: 'Tutorial', icon: <Globe className="w-3.5 h-3.5" />, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  documentation: { label: 'Documentation', icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  video: { label: 'Video', icon: <Video className="w-3.5 h-3.5" />, color: 'bg-red-500/15 text-red-400 border-red-500/25' },
  interactive: { label: 'Interactive', icon: <Monitor className="w-3.5 h-3.5" />, color: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
};

// ── Resource badge ─────────────────────────────────────────────
const ResourceBadge: React.FC<{ resource: LearningResource; onRemove: () => void }> = ({ resource, onRemove }) => {
  const meta = RESOURCE_TYPE_META[resource.type];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border', meta.color)}>
      {meta.icon}
      <span className="truncate max-w-[150px]">{resource.title}</span>
      <button onClick={onRemove} className="ml-1 hover:text-red-400 transition-colors">
        <Trash2 className="w-3 h-3" />
      </button>
    </span>
  );
};

// ── Add resource form ──────────────────────────────────────────
interface AddResourceFormProps {
  onAdd: (resource: LearningResource) => void;
}

const AddResourceForm: React.FC<AddResourceFormProps> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<LearningResource['type']>('textbook');
  const [url, setUrl] = useState('');
  const [chapters, setChapters] = useState('');
  const [pageRange, setPageRange] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      title: title.trim(),
      type,
      url: url.trim() || undefined,
      chapters: chapters.trim() || undefined,
      pageRange: pageRange.trim() || undefined,
    });
    setTitle('');
    setUrl('');
    setChapters('');
    setPageRange('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Resource
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] space-y-3"
    >
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Type</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(RESOURCE_TYPE_META) as LearningResource['type'][]).map((t) => {
            const m = RESOURCE_TYPE_META[t];
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all',
                  type === t ? m.color : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:bg-white/[0.03]'
                )}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
      {type === 'textbook' && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Chapter(s)" value={chapters} onChange={(e) => setChapters(e.target.value)} placeholder="e.g., 3, 4-5" />
          <Input label="Pages" value={pageRange} onChange={(e) => setPageRange(e.target.value)} placeholder="e.g., 45-67" />
        </div>
      )}
      {(type === 'tutorial' || type === 'video' || type === 'interactive') && (
        <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!title.trim()}>Add</Button>
      </div>
    </motion.div>
  );
};

// ── Unit row ───────────────────────────────────────────────────
interface UnitRowProps {
  unit: SSDUnit;
  onUpdate: (partial: Partial<SSDUnit>) => void;
  onRemove: () => void;
  onAddResource: (resource: LearningResource) => void;
  onRemoveResource: (resourceId: string) => void;
}

const UnitRow: React.FC<UnitRowProps> = ({ unit, onUpdate, onRemove, onAddResource, onRemoveResource }) => {
  return (
    <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_40px] gap-3 items-start p-3 rounded-xl bg-white/[0.01] border border-[var(--border-subtle)] hover:bg-white/[0.02] transition-colors">
      {/* Unit Code */}
      <Input value={unit.code} onChange={(e) => onUpdate({ code: e.target.value })} placeholder="U1.1" className="text-xs" />
      {/* Title */}
      <Input value={unit.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Unit title" className="text-xs" />
      {/* ES/LO Alignment */}
      <div className="flex flex-wrap gap-1">
        {unit.esLoAlignment.map((code, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {code}
          </span>
        ))}
        <Input
          placeholder="Add code"
          className="text-[10px] w-16"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) {
                onUpdate({ esLoAlignment: [...unit.esLoAlignment, val] });
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
        />
      </div>
      {/* Topics */}
      <div className="flex flex-wrap gap-1">
        {unit.topics.map((topic, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.05] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {topic}
          </span>
        ))}
        <Input
          placeholder="Add topic"
          className="text-[10px] w-20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) {
                onUpdate({ topics: [...unit.topics, val] });
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
        />
      </div>
      {/* Resources */}
      <div className="space-y-1">
        {unit.resources.map((r) => (
          <ResourceBadge key={r.id} resource={r} onRemove={() => onRemoveResource(r.id)} />
        ))}
        <AddResourceForm onAdd={onAddResource} />
      </div>
      {/* Remove */}
      <button onClick={onRemove} className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors mt-1">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ── Coverage matrix ────────────────────────────────────────────
const CoverageMatrix: React.FC<{
  sections: SSDSection[];
  learningObjectives: LearningObjective[];
  evidenceStatements: EvidenceStatement[];
}> = ({ sections, learningObjectives, evidenceStatements }) => {
  const allUnits = sections.flatMap((s) => s.lessons.flatMap((l) => l.units));
  const allLOs = learningObjectives;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">LO Code</th>
            {allUnits.map((u) => (
              <th key={u.id} className="p-2 text-[var(--text-muted)] border-b border-[var(--border-subtle)] whitespace-nowrap">
                {u.code}
              </th>
            ))}
            <th className="p-2 text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">Coverage</th>
          </tr>
        </thead>
        <tbody>
          {allLOs.map((lo) => {
            const coveringUnits = allUnits.filter((u) =>
              u.esLoAlignment.some((a) => a === lo.code)
            );
            const covered = coveringUnits.length > 0;
            return (
              <tr key={lo.id} className="hover:bg-white/[0.02]">
                <td className="p-2 text-[var(--text-primary)] border-b border-[var(--border-subtle)]">{lo.code}</td>
                {allUnits.map((u) => {
                  const has = u.esLoAlignment.includes(lo.code);
                  return (
                    <td key={u.id} className="p-2 text-center border-b border-[var(--border-subtle)]">
                      {has ? (
                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500/60" />
                      ) : (
                        <span className="inline-block w-3 h-3 rounded-full bg-white/[0.05]" />
                      )}
                    </td>
                  );
                })}
                <td className={clsx('p-2 text-center border-b border-[var(--border-subtle)] font-medium', covered ? 'text-emerald-400' : 'text-red-400')}>
                  {covered ? 'Covered' : 'Missing'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const Phase7_SSD: React.FC = () => {
  const {
    currentProject,
    setSSDSections,
    isGenerating,
    setGenerating,
  } = useAppStore();

  const [sections, setSections] = useState<SSDSection[]>(currentProject?.ssdSections ?? []);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [showMatrix, setShowMatrix] = useState(false);

  const competencies = currentProject?.competencies ?? [];
  const evidenceStatements = currentProject?.evidenceStatements ?? [];
  const learningObjectives = currentProject?.learningObjectives ?? [];

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLesson = (id: string) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addSection = useCallback((competencyId: string) => {
    const comp = competencies.find((c) => c.id === competencyId);
    if (!comp) return;
    const newSection: SSDSection = {
      id: crypto.randomUUID(),
      competencyId,
      title: comp.statement,
      lessons: [],
    };
    setSections((prev) => [...prev, newSection]);
  }, [competencies]);

  const addLesson = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: [
                ...s.lessons,
                {
                  id: crypto.randomUUID(),
                  title: `Lesson ${s.lessons.length + 1}`,
                  units: [],
                },
              ],
            }
          : s
      )
    );
  }, []);

  const addUnit = useCallback((sectionId: string, lessonId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId
                  ? {
                      ...l,
                      units: [
                        ...l.units,
                        {
                          id: crypto.randomUUID(),
                          code: '',
                          title: '',
                          esLoAlignment: [],
                          topics: [],
                          resources: [],
                        },
                      ],
                    }
                  : l
              ),
            }
          : s
      )
    );
  }, []);

  const updateUnit = useCallback((sectionId: string, lessonId: string, unitId: string, partial: Partial<SSDUnit>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId
                  ? { ...l, units: l.units.map((u) => (u.id === unitId ? { ...u, ...partial } : u)) }
                  : l
              ),
            }
          : s
      )
    );
  }, []);

  const removeUnit = useCallback((sectionId: string, lessonId: string, unitId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId ? { ...l, units: l.units.filter((u) => u.id !== unitId) } : l
              ),
            }
          : s
      )
    );
  }, []);

  const addResourceToUnit = useCallback((sectionId: string, lessonId: string, unitId: string, resource: LearningResource) => {
    updateUnit(sectionId, lessonId, unitId, {
      resources: [
        ...(sections
          .find((s) => s.id === sectionId)
          ?.lessons.find((l) => l.id === lessonId)
          ?.units.find((u) => u.id === unitId)?.resources ?? []),
        resource,
      ],
    });
  }, [sections, updateUnit]);

  const removeResourceFromUnit = useCallback((sectionId: string, lessonId: string, unitId: string, resourceId: string) => {
    const unit = sections
      .find((s) => s.id === sectionId)
      ?.lessons.find((l) => l.id === lessonId)
      ?.units.find((u) => u.id === unitId);
    if (!unit) return;
    updateUnit(sectionId, lessonId, unitId, {
      resources: unit.resources.filter((r) => r.id !== resourceId),
    });
  }, [sections, updateUnit]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      // Placeholder for Claude API SSD generation
      // Would call getPhase7Prompt and parse response
    } finally {
      setGenerating(false);
    }
  }, [setGenerating]);

  const handleSave = useCallback(() => {
    setSSDSections(sections);
  }, [sections, setSSDSections]);

  if (!currentProject) return null;

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Scope & Sequence Document</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Section = Competency, Lesson = Grouped ES, Unit = Individual Topic
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Table className="w-3.5 h-3.5" />}
            onClick={() => setShowMatrix(!showMatrix)}
          >
            {showMatrix ? 'Hide' : 'Show'} Coverage Matrix
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={handleGenerate}
            loading={isGenerating}
          >
            Generate SSD
          </Button>
        </div>
      </div>

      {/* Table header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_40px] gap-3 p-3 border-b border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)]">
          <span>Unit Code</span>
          <span>Unit Title</span>
          <span>ES/LO Alignment</span>
          <span>Learning Topics</span>
          <span>Learning Resources</span>
          <span />
        </div>

        {/* Sections (competencies) */}
        <div className="divide-y divide-[var(--border-subtle)]">
          {sections.map((section) => (
            <div key={section.id}>
              {/* Section header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                )}
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">{section.title}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  ({section.lessons.length} lessons, {section.lessons.reduce((sum, l) => sum + l.units.length, 0)} units)
                </span>
              </div>

              {/* Lessons */}
              <AnimatePresence>
                {expandedSections.has(section.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-8"
                  >
                    {section.lessons.map((lesson) => (
                      <div key={lesson.id} className="mb-3">
                        <div
                          className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/[0.02] rounded-lg"
                          onClick={() => toggleLesson(lesson.id)}
                        >
                          {expandedLessons.has(lesson.id) ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          )}
                          <Input
                            value={lesson.title}
                            onChange={(e) => {
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        lessons: s.lessons.map((l) =>
                                          l.id === lesson.id ? { ...l, title: e.target.value } : l
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="text-xs font-medium flex-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-[var(--text-muted)]">
                            {lesson.units.length} units
                          </span>
                        </div>

                        <AnimatePresence>
                          {expandedLessons.has(lesson.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-6 space-y-2 mt-2"
                            >
                              {lesson.units.map((unit) => (
                                <UnitRow
                                  key={unit.id}
                                  unit={unit}
                                  onUpdate={(partial) => updateUnit(section.id, lesson.id, unit.id, partial)}
                                  onRemove={() => removeUnit(section.id, lesson.id, unit.id)}
                                  onAddResource={(r) => addResourceToUnit(section.id, lesson.id, unit.id, r)}
                                  onRemoveResource={(rId) => removeResourceFromUnit(section.id, lesson.id, unit.id, rId)}
                                />
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Plus className="w-3.5 h-3.5" />}
                                onClick={() => addUnit(section.id, lesson.id)}
                              >
                                Add Unit
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => addLesson(section.id)}
                      >
                        Add Lesson
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Add section for unmapped competencies */}
        {competencies.filter((c) => !sections.some((s) => s.competencyId === c.id)).length > 0 && (
          <div className="p-4 border-t border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-muted)] mb-2">Unmapped competencies:</p>
            <div className="flex flex-wrap gap-2">
              {competencies
                .filter((c) => !sections.some((s) => s.competencyId === c.id))
                .map((comp) => (
                  <Button key={comp.id} variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => addSection(comp.id)}>
                    {comp.code}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Coverage matrix */}
      <AnimatePresence>
        {showMatrix && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5 overflow-hidden"
          >
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" />
              LO-to-Resource Coverage Matrix
            </h4>
            <CoverageMatrix
              sections={sections}
              learningObjectives={learningObjectives}
              evidenceStatements={evidenceStatements}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleSave}>
          Save SSD Structure
        </Button>
      </div>
    </div>
  );
};
