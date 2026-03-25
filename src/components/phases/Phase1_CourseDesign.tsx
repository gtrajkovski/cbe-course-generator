import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileDown,
  BookOpen,
  Target,
  Shield,
  Laptop,
  Loader2,
  Edit3,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import { COGNITIVE_LEVEL_LABELS } from '../../lib/types';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ============================================================
// Section renderer for generated content
// ============================================================

interface DesignSection {
  title: string;
  icon: React.ReactNode;
  content: string;
  field: string;
}

const SectionPreview: React.FC<{
  section: DesignSection;
  isEditing: boolean;
  onEdit: (field: string, value: string) => void;
}> = ({ section, isEditing, onEdit }) => (
  <motion.div variants={itemVariants} className="glass-card p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-1.5 rounded-lg bg-[var(--accent)]/10">{section.icon}</div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{section.title}</h3>
    </div>
    {isEditing ? (
      <TextArea
        value={section.content}
        onChange={(e) => onEdit(section.field, e.target.value)}
        className="min-h-[120px]"
      />
    ) : (
      <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
        {section.content || (
          <span className="italic text-[var(--text-muted)]">
            Click "Generate Course Design" to populate this section.
          </span>
        )}
      </div>
    )}
  </motion.div>
);

// ============================================================
// Main Component
// ============================================================

export const Phase1_CourseDesign: React.FC = () => {
  const { project, isGenerating, setGenerating, settings } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);

  // Local state for generated design content
  const [designContent, setDesignContent] = useState({
    courseOverview: '',
    competencyMap: '',
    evidencePreview: '',
    assessmentStrategy: '',
    foundationalKnowledge: '',
    technologyReqs: '',
  });

  if (!project) return null;

  const handleGenerate = async () => {
    if (!settings.apiKey) {
      alert('Please set your Claude API key in Settings.');
      return;
    }

    setGenerating(true);

    // Build the prompt from project data
    const compSummary = project.competencies
      .map(
        (c) =>
          `- ${c.code}: ${c.statement} (Level ${c.cognitiveLevel}: ${COGNITIVE_LEVEL_LABELS[c.cognitiveLevel]}, Weight: ${c.weight}%)`
      )
      .join('\n');

    const prompt = `You are a competency-based education (CBE) course design expert. Based on the following course setup, generate a comprehensive course design document.

Course: ${project.metadata.courseCode} - ${project.metadata.courseTitle}
Credit Units: ${project.metadata.creditUnits}
School: ${project.metadata.school}
Program: ${project.metadata.program}
Target Audience: ${project.metadata.targetAudience}
Description: ${project.metadata.courseDescription}
Prerequisites: ${project.metadata.prerequisites}

Competencies:
${compSummary}

Generate the following sections (use ### headers to separate them):
### Course Overview
### Competency Map
### Evidence Statement Preview
### Assessment Strategy
### Expected Foundational Knowledge
### Technology Requirements

Be specific, actionable, and aligned with WGU CBE methodology.`;

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

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';

      // Parse sections
      const sections: Record<string, string> = {};
      const sectionRegex = /### (.+?)\n([\s\S]*?)(?=### |$)/g;
      let match;
      while ((match = sectionRegex.exec(text)) !== null) {
        const key = match[1].trim().toLowerCase().replace(/\s+/g, '');
        sections[key] = match[2].trim();
      }

      setDesignContent({
        courseOverview: sections['courseoverview'] || text.substring(0, 500),
        competencyMap: sections['competencymap'] || '',
        evidencePreview: sections['evidencestatementpreview'] || '',
        assessmentStrategy: sections['assessmentstrategy'] || '',
        foundationalKnowledge: sections['expectedfoundationalknowledge'] || '',
        technologyReqs: sections['technologyrequirements'] || '',
      });
    } catch (err) {
      console.error('Generation failed:', err);
      // Set placeholder content on error
      setDesignContent({
        courseOverview: `Course ${project.metadata.courseCode} design overview. (Generation failed - please check API key and try again.)`,
        competencyMap: '',
        evidencePreview: '',
        assessmentStrategy: '',
        foundationalKnowledge: '',
        technologyReqs: '',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleFieldEdit = (field: string, value: string) => {
    setDesignContent((prev) => ({ ...prev, [field]: value }));
  };

  const sections: DesignSection[] = [
    {
      title: 'Course Overview',
      icon: <BookOpen className="w-4 h-4 text-[var(--accent)]" />,
      content: designContent.courseOverview,
      field: 'courseOverview',
    },
    {
      title: 'Competency Map',
      icon: <Target className="w-4 h-4 text-[var(--accent)]" />,
      content: designContent.competencyMap,
      field: 'competencyMap',
    },
    {
      title: 'Evidence Statement Preview',
      icon: <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />,
      content: designContent.evidencePreview,
      field: 'evidencePreview',
    },
    {
      title: 'Assessment Strategy',
      icon: <Shield className="w-4 h-4 text-[var(--accent)]" />,
      content: designContent.assessmentStrategy,
      field: 'assessmentStrategy',
    },
    {
      title: 'Expected Foundational Knowledge',
      icon: <BookOpen className="w-4 h-4 text-[var(--accent)]" />,
      content: designContent.foundationalKnowledge,
      field: 'foundationalKnowledge',
    },
    {
      title: 'Technology Requirements',
      icon: <Laptop className="w-4 h-4 text-[var(--accent)]" />,
      content: designContent.technologyReqs,
      field: 'technologyReqs',
    },
  ];

  const hasContent = Object.values(designContent).some((v) => v.length > 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Competencies Summary */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[var(--accent)]/10">
            <Target className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Competencies from Phase 0
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {project.competencies.length} competencies defined
            </p>
          </div>
        </div>

        {project.competencies.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)] italic p-4 text-center rounded-xl bg-white/[0.02]">
            No competencies defined. Go back to Phase 0 to add competencies.
          </div>
        ) : (
          <div className="space-y-2">
            {project.competencies.map((comp, i) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)]"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold">
                  {comp.code}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--text-primary)] truncate">
                    {comp.statement || 'No statement'}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Level {comp.cognitiveLevel} ({COGNITIVE_LEVEL_LABELS[comp.cognitiveLevel]}) | {comp.weight}% | {comp.skills.length} skills
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Action bar */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-3"
      >
        <Button
          variant="primary"
          icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          onClick={handleGenerate}
          loading={isGenerating}
          disabled={project.competencies.length === 0}
        >
          {isGenerating ? 'Generating...' : 'Generate Course Design'}
        </Button>

        {hasContent && (
          <>
            <Button
              variant="secondary"
              icon={isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
            <Button
              variant="secondary"
              icon={<FileDown className="w-4 h-4" />}
              onClick={() => console.log('Export .docx for Phase 1')}
            >
              Export .docx
            </Button>
          </>
        )}
      </motion.div>

      {/* Generated content sections */}
      <AnimatePresence>
        {hasContent && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {sections.map((section) => (
              <SectionPreview
                key={section.field}
                section={section}
                isEditing={isEditing}
                onEdit={handleFieldEdit}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
