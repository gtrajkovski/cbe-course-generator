import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  Image,
  BookOpen,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
  Palette,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type { SSDSection, SSDUnit } from '../../lib/types';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';

// ── Word count helper ──────────────────────────────────────────
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function wordCountColor(count: number): string {
  if (count === 0) return 'text-[var(--text-muted)]';
  if (count < 400) return 'text-amber-400';
  if (count <= 600) return 'text-emerald-400';
  return 'text-orange-400';
}

// ── Content preview ────────────────────────────────────────────
const ContentPreview: React.FC<{ content: string; unitTitle: string }> = ({ content, unitTitle }) => {
  if (!content) return null;

  // Parse content into sections
  const sections = content.split(/\n\n+/);
  const hasOpening = sections.length >= 1;
  const hasFigure = content.includes('[Figure:') || content.includes('[IMAGE:');
  const hasExample = content.toLowerCase().includes('example') || content.toLowerCase().includes('practical');
  const hasAssessment = content.toLowerCase().includes('assessment') || content.toLowerCase().includes('competenc');
  const hasResources = content.includes('| Resource') || content.toLowerCase().includes('resources');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Opening Paragraph', present: hasOpening, icon: <BookOpen className="w-3 h-3" /> },
          { label: 'Figure Description', present: hasFigure, icon: <Image className="w-3 h-3" /> },
          { label: 'Practical Example', present: hasExample, icon: <Zap className="w-3 h-3" /> },
          { label: 'Assessment Connection', present: hasAssessment, icon: <BarChart3 className="w-3 h-3" /> },
          { label: 'Resources Table', present: hasResources, icon: <FileText className="w-3 h-3" /> },
        ].map(({ label, present, icon }) => (
          <span
            key={label}
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border',
              present
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-white/[0.02] text-[var(--text-muted)] border-[var(--border-subtle)]'
            )}
          >
            {icon}
            {label}
          </span>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] max-h-[300px] overflow-y-auto">
        <div className="prose prose-sm prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};

// ── Figure description generator ───────────────────────────────
const FigureDescriptionHelper: React.FC<{
  unitTitle: string;
  onGenerate: (description: string) => void;
  isGenerating: boolean;
}> = ({ unitTitle, onGenerate, isGenerating }) => {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState('');

  const handleGenerate = () => {
    // Placeholder: would call Claude API
    const placeholder = `[Figure: Detailed diagram illustrating ${unitTitle}. Background: #1a1a2e (dark navy). Primary elements in #6366f1 (indigo). Secondary accents in #a855f7 (purple). Text labels in #e2e8f0 (light gray). The diagram shows the key relationships between concepts with labeled arrows and color-coded sections. Dimensions: 1200x800px, 300dpi.]`;
    onGenerate(placeholder);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
      >
        <Palette className="w-3.5 h-3.5" />
        Generate Figure Description
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3"
    >
      <p className="text-xs text-purple-300">
        Generates a detailed image description with hex color codes for AI image generation.
      </p>
      <TextArea
        label="Additional Context"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="What should the figure illustrate?"
        rows={2}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="primary" size="sm" icon={<Palette className="w-3.5 h-3.5" />} onClick={handleGenerate} loading={isGenerating}>
          Generate
        </Button>
      </div>
    </motion.div>
  );
};

// ── Unit content card ──────────────────────────────────────────
interface UnitContentCardProps {
  unit: SSDUnit;
  sectionTitle: string;
  lessonTitle: string;
  onUpdateContent: (unitId: string, content: string) => void;
  onGenerate: (unitId: string) => void;
  isGenerating: boolean;
}

const UnitContentCard: React.FC<UnitContentCardProps> = ({
  unit,
  sectionTitle,
  lessonTitle,
  onUpdateContent,
  onGenerate,
  isGenerating,
}) => {
  const [expanded, setExpanded] = useState(false);
  const wc = wordCount(unit.content ?? '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={clsx(
            'flex items-center justify-center px-2 py-1 rounded-lg text-xs font-bold border',
            unit.content ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/[0.03] text-[var(--text-muted)] border-[var(--border-subtle)]'
          )}>
            {unit.code}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{unit.title}</p>
            <p className="text-xs text-[var(--text-muted)]">{sectionTitle} &gt; {lessonTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={clsx('text-xs font-medium', wordCountColor(wc))}>
            {wc}/~500 words
          </span>
          {/* Progress bar */}
          <div className="w-16 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                wc === 0 ? 'bg-white/[0.1]' : wc < 400 ? 'bg-amber-500' : wc <= 600 ? 'bg-emerald-500' : 'bg-orange-500'
              )}
              style={{ width: `${Math.min(100, (wc / 500) * 100)}%` }}
            />
          </div>
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
              {/* Preview */}
              <ContentPreview content={unit.content ?? ''} unitTitle={unit.title} />

              {/* Editor */}
              <TextArea
                label="Unit Content"
                value={unit.content ?? ''}
                onChange={(e) => onUpdateContent(unit.id, e.target.value)}
                placeholder="Unit content (~500 words): opening paragraph, core concepts, figure description, practical example, assessment connection, resources table..."
                rows={15}
                autoResize={false}
                className="font-mono text-xs min-h-[300px]"
              />

              {/* Figure helper */}
              <FigureDescriptionHelper
                unitTitle={unit.title}
                onGenerate={(desc) => {
                  onUpdateContent(unit.id, (unit.content ?? '') + '\n\n' + desc);
                }}
                isGenerating={isGenerating}
              />

              {/* Generate button */}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => onGenerate(unit.id)}
                  loading={isGenerating}
                >
                  Generate Content
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const Phase9_CourseContent: React.FC = () => {
  const { currentProject, setSSDSections, isGenerating, setGenerating } = useAppStore();

  const [sections, setSections] = useState<SSDSection[]>(currentProject?.ssdSections ?? []);
  const [generatingUnitId, setGeneratingUnitId] = useState<string | null>(null);

  const allUnits = useMemo(
    () =>
      sections.flatMap((s) =>
        s.lessons.flatMap((l) =>
          l.units.map((u) => ({ unit: u, sectionTitle: s.title, lessonTitle: l.title }))
        )
      ),
    [sections]
  );

  const totalWords = useMemo(
    () => allUnits.reduce((sum, { unit }) => sum + wordCount(unit.content ?? ''), 0),
    [allUnits]
  );

  const completedUnits = useMemo(
    () => allUnits.filter(({ unit }) => wordCount(unit.content ?? '') >= 400).length,
    [allUnits]
  );

  const updateContent = useCallback((unitId: string, content: string) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => ({
          ...l,
          units: l.units.map((u) => (u.id === unitId ? { ...u, content } : u)),
        })),
      }))
    );
  }, []);

  const generateUnit = useCallback(async (unitId: string) => {
    setGeneratingUnitId(unitId);
    setGenerating(true);
    try {
      // Placeholder for Claude API content generation
    } finally {
      setGeneratingUnitId(null);
      setGenerating(false);
    }
  }, [setGenerating]);

  const batchGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      // Would iterate over all units and generate content
      for (const { unit } of allUnits) {
        if (!unit.content || wordCount(unit.content) < 100) {
          await generateUnit(unit.id);
        }
      }
    } finally {
      setGenerating(false);
    }
  }, [allUnits, generateUnit, setGenerating]);

  const handleSave = useCallback(() => {
    setSSDSections(sections);
  }, [sections, setSSDSections]);

  if (!currentProject) return null;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5">
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Total Units</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{allUnits.length}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Completed</p>
            <p className="text-2xl font-bold text-emerald-400">{completedUnits}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Total Words</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{totalWords.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Progress</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${allUnits.length > 0 ? (completedUnits / allUnits.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {allUnits.length > 0 ? Math.round((completedUnits / allUnits.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Unit Content (~500 words each)</h3>
        <Button
          variant="primary"
          size="sm"
          icon={<Sparkles className="w-3.5 h-3.5" />}
          onClick={batchGenerate}
          loading={isGenerating}
        >
          Batch Generate All
        </Button>
      </div>

      {/* Unit cards */}
      <div className="space-y-3">
        {allUnits.map(({ unit, sectionTitle, lessonTitle }) => (
          <UnitContentCard
            key={unit.id}
            unit={unit}
            sectionTitle={sectionTitle}
            lessonTitle={lessonTitle}
            onUpdateContent={updateContent}
            onGenerate={generateUnit}
            isGenerating={generatingUnitId === unit.id}
          />
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleSave}>
          Save All Content
        </Button>
      </div>
    </div>
  );
};
