import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Plus,
  FileText,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  FileDiff,
  FileCheck,
  Edit3,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store';
import type { DocumentVersion } from '../../lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';

// ── File naming convention (Appendix C patterns) ───────────────
const FILE_NAMING_PATTERNS: Record<string, string> = {
  PA: '{courseCode}_PA_Task{taskNum}_v{version}',
  SSD: '{courseCode}_SSD_v{version}',
  'Task Model': '{courseCode}_TaskModel_Task{taskNum}_v{version}',
  'Course Design': '{courseCode}_CourseDesign_v{version}',
  'Evidence Statements': '{courseCode}_ES_v{version}',
  'Knowledge Checks': '{courseCode}_KC_Section{sectionNum}_v{version}',
  'Sample Responses': '{courseCode}_Samples_Task{taskNum}_v{version}',
  'Supporting Docs': '{courseCode}_SupportDoc_{docName}_v{version}',
  Rubric: '{courseCode}_Rubric_Task{taskNum}_v{version}',
};

function generateFileName(docType: string, courseCode: string, version: string, extra?: Record<string, string>): string {
  let pattern = FILE_NAMING_PATTERNS[docType] ?? `${courseCode}_${docType}_v${version}`;
  pattern = pattern.replace('{courseCode}', courseCode);
  pattern = pattern.replace('{version}', version);
  if (extra) {
    for (const [key, val] of Object.entries(extra)) {
      pattern = pattern.replace(`{${key}}`, val);
    }
  }
  // Remove unfilled placeholders
  pattern = pattern.replace(/\{[^}]+\}/g, 'X');
  return pattern;
}

// ── Document type list ─────────────────────────────────────────
const DOCUMENT_TYPES = [
  'PA',
  'SSD',
  'Task Model',
  'Course Design',
  'Evidence Statements',
  'Knowledge Checks',
  'Sample Responses',
  'Supporting Docs',
  'Rubric',
];

// ── Version card ───────────────────────────────────────────────
interface VersionCardProps {
  version: DocumentVersion;
  courseCode: string;
  onUpdate: (id: string, partial: Partial<DocumentVersion>) => void;
}

const VersionCard: React.FC<VersionCardProps> = ({ version, courseCode, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  const cleanName = generateFileName(version.documentType, courseCode, version.version);
  const redlineName = generateFileName(version.documentType, courseCode, version.version + '_REDLINE');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      {/* Timeline node */}
      <div className="absolute left-0 top-4 w-3 h-3 rounded-full bg-indigo-500 border-2 border-[var(--bg-primary)] z-10" />

      <div className="ml-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl overflow-hidden">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Tag className="w-3 h-3" />
              {version.version}
            </span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{version.documentType}</span>
            <span className="text-xs text-[var(--text-muted)]">
              {new Date(version.date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">
              {version.changes.length} changes
            </span>
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
                {/* File names */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <div className="flex items-center gap-2 mb-1">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Clean Version</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">{cleanName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <div className="flex items-center gap-2 mb-1">
                      <FileDiff className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-amber-400">Redline Version</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">{redlineName}</p>
                  </div>
                </div>

                {/* Changelog */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Changelog</label>
                  {version.changes.map((change, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-[var(--border-subtle)]">
                      <Input
                        value={change.code}
                        onChange={(e) => {
                          const newChanges = [...version.changes];
                          newChanges[i] = { ...change, code: e.target.value };
                          onUpdate(version.id, { changes: newChanges });
                        }}
                        placeholder="Code"
                        className="w-20 text-xs"
                      />
                      <Input
                        value={change.description}
                        onChange={(e) => {
                          const newChanges = [...version.changes];
                          newChanges[i] = { ...change, description: e.target.value };
                          onUpdate(version.id, { changes: newChanges });
                        }}
                        placeholder="Description of change"
                        className="flex-1 text-xs"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      onUpdate(version.id, {
                        changes: [...version.changes, { code: '', description: '' }],
                      });
                    }}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add change entry
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const Phase12_Versioning: React.FC = () => {
  const { currentProject, addDocumentVersion } = useAppStore();

  const [versions, setVersions] = useState<DocumentVersion[]>(currentProject?.documentVersions ?? []);
  const [newDocType, setNewDocType] = useState<string>('PA');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');

  const courseCode = currentProject?.metadata.courseCode ?? 'COURSE';

  const filteredVersions = useMemo(() => {
    if (selectedDocType === 'all') return versions;
    return versions.filter((v) => v.documentType === selectedDocType);
  }, [versions, selectedDocType]);

  // Group by document type for timeline view
  const groupedVersions = useMemo(() => {
    const groups = new Map<string, DocumentVersion[]>();
    for (const v of filteredVersions) {
      const existing = groups.get(v.documentType) ?? [];
      existing.push(v);
      groups.set(v.documentType, existing);
    }
    // Sort each group by version
    for (const [, group] of groups) {
      group.sort((a, b) => a.version.localeCompare(b.version));
    }
    return groups;
  }, [filteredVersions]);

  const createVersion = useCallback(() => {
    // Determine next version number
    const existing = versions.filter((v) => v.documentType === newDocType);
    const lastVersion = existing.length > 0
      ? existing[existing.length - 1].version
      : 'v0.0';
    const parts = lastVersion.replace('v', '').split('.');
    const major = parseInt(parts[0] || '0', 10);
    const minor = parseInt(parts[1] || '0', 10);
    const nextVersion = `v${major}.${minor + 1}`;

    const newVersion: DocumentVersion = {
      id: crypto.randomUUID(),
      documentType: newDocType,
      version: nextVersion,
      date: new Date().toISOString(),
      changes: [{ code: '', description: '' }],
    };

    setVersions((prev) => [...prev, newVersion]);
    addDocumentVersion(newVersion);
  }, [versions, newDocType, addDocumentVersion]);

  const updateVersion = useCallback((id: string, partial: Partial<DocumentVersion>) => {
    setVersions((prev) => prev.map((v) => (v.id === id ? { ...v, ...partial } : v)));
  }, []);

  if (!currentProject) return null;

  return (
    <div className="space-y-6">
      {/* Create new version */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-indigo-400" />
          Create New Version
        </h4>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Document Type</label>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setNewDocType(type)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    newDocType === type
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'text-[var(--text-muted)] bg-white/[0.02] border-[var(--border-subtle)] hover:bg-white/[0.05]'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={createVersion}>
            Create Version
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Auto-generated filename: <span className="font-mono text-[var(--text-secondary)]">
            {generateFileName(newDocType, courseCode, 'X.X')}
          </span>
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">Filter:</span>
        <button
          onClick={() => setSelectedDocType('all')}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
            selectedDocType === 'all'
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:bg-white/[0.03]'
          )}
        >
          All
        </button>
        {DOCUMENT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedDocType(type)}
            className={clsx(
              'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
              selectedDocType === type
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:bg-white/[0.03]'
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Version timeline */}
      {Array.from(groupedVersions.entries()).map(([docType, docVersions]) => (
        <div key={docType} className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--text-muted)]" />
            {docType}
            <span className="text-xs text-[var(--text-muted)]">({docVersions.length} versions)</span>
          </h4>
          <div className="relative pl-1.5 border-l-2 border-[var(--border-subtle)] space-y-4">
            {docVersions.map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                courseCode={courseCode}
                onUpdate={updateVersion}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredVersions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="w-10 h-10 text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">No versions yet.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Create your first version above.</p>
        </div>
      )}
    </div>
  );
};
