import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  ProjectMetadata,
  Competency,
  EvidenceStatement,
  LearningObjective,
  Task,
  SSDSection,
  KnowledgeCheck,
  SampleResponse,
  FeedbackComment,
  DocumentVersion,
  PhaseStatus as ProjectPhaseStatus,
  PhaseStatusValue,
  ProjectSummary,
} from '../lib/types';
import { PHASE_DEFINITIONS } from '../lib/types';

// ============================================================
// UI-level phase status (used by Sidebar, Wizard, PhaseGate)
// ============================================================

export interface PhaseStatus {
  id: number;
  name: string;
  status: 'locked' | 'active' | 'completed' | 'in-progress';
}

export interface RecentProject {
  id: string;
  name: string;
  lastOpened: string;
  phase: number;
  path: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
  exportDir: string;
  voiceEnabled: boolean;
}

// ============================================================
// Unified AppState
// ============================================================

export interface AppState {
  // --- UI-level state (used by existing components) ---
  currentProject: { name: string; path: string } | null;
  currentPhase: number;
  phases: PhaseStatus[];
  recentProjects: RecentProject[];
  settings: AppSettings;
  settingsOpen: boolean;
  phaseGateOpen: boolean;
  phaseGateChecks: { label: string; passed: boolean }[];

  // --- Comprehensive project state ---
  project: Project | null;
  isGenerating: boolean;
  streamingText: string;

  // --- UI-level actions ---
  setCurrentProject: (project: { name: string; path: string } | null) => void;
  setCurrentPhase: (phase: number) => void;
  setPhaseStatus: (id: number, status: PhaseStatus['status']) => void;
  openSettings: () => void;
  closeSettings: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  openPhaseGate: (checks: { label: string; passed: boolean }[]) => void;
  closePhaseGate: () => void;
  goNextPhase: () => void;
  goPrevPhase: () => void;

  // --- Project lifecycle ---
  createProject: (metadata: ProjectMetadata) => void;
  updateMetadata: (partial: Partial<ProjectMetadata>) => void;

  // --- Competencies ---
  addCompetency: (comp: Competency) => void;
  updateCompetency: (id: string, partial: Partial<Competency>) => void;
  removeCompetency: (id: string) => void;

  // --- Evidence Statements ---
  setEvidenceStatements: (es: EvidenceStatement[]) => void;
  updateES: (id: string, partial: Partial<EvidenceStatement>) => void;

  // --- Learning Objectives ---
  setLearningObjectives: (los: LearningObjective[]) => void;

  // --- Tasks ---
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, partial: Partial<Task>) => void;

  // --- SSD ---
  setSSDSections: (sections: SSDSection[]) => void;

  // --- Knowledge Checks ---
  setKnowledgeChecks: (kcs: KnowledgeCheck[]) => void;

  // --- Sample Responses ---
  setSampleResponses: (samples: SampleResponse[]) => void;

  // --- Feedback ---
  addFeedback: (comment: FeedbackComment) => void;
  updateFeedback: (id: string, partial: Partial<FeedbackComment>) => void;

  // --- Document Versions ---
  addDocumentVersion: (version: DocumentVersion) => void;

  // --- Phase management ---
  updatePhaseStatus: (phase: number, status: Partial<ProjectPhaseStatus>) => void;
  validatePhase: (phase: number) => string[];

  // --- AI / generation ---
  setGenerating: (bool: boolean) => void;
  setStreamingText: (text: string) => void;

  // --- Persistence ---
  saveProject: () => void;
  loadProject: (id: string) => void;
  listProjects: () => ProjectSummary[];
}

// ============================================================
// Constants & Helpers
// ============================================================

const PHASE_NAMES = [
  'CCW Intake',
  'Course Design',
  'Evidence Statements',
  'Task Splitting',
  'Task Model',
  'PA Tasks',
  'Supporting Docs',
  'Scope & Sequence',
  'Knowledge Checks',
  'Course Content',
  'Sample Responses',
  'Feedback',
  'Versioning',
  'Final Audit',
];

const initialPhases: PhaseStatus[] = PHASE_NAMES.map((name, i) => ({
  id: i,
  name,
  status: i === 0 ? 'active' : 'locked',
}));

const STORAGE_PREFIX = 'cbe-project-';
const INDEX_KEY = 'cbe-project-index';

function buildDefaultPhaseStatuses(): ProjectPhaseStatus[] {
  return PHASE_DEFINITIONS.map((p, i) => ({
    phase: p.phase,
    name: p.name,
    status: (i === 0 ? 'available' : 'locked') as PhaseStatusValue,
    validationErrors: [],
  }));
}

function buildEmptyProject(metadata: ProjectMetadata): Project {
  return {
    id: crypto.randomUUID(),
    metadata,
    competencies: [],
    evidenceStatements: [],
    learningObjectives: [],
    tasks: [],
    ssdSections: [],
    knowledgeChecks: [],
    sampleResponses: [],
    feedbackComments: [],
    documentVersions: [],
    phaseStatuses: buildDefaultPhaseStatuses(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function touchUpdated(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() };
}

const DEFAULT_METADATA: ProjectMetadata = {
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
};

// ============================================================
// Phase Validation Rules
// ============================================================

function validatePhaseRules(phase: number, project: Project): string[] {
  const errors: string[] = [];

  switch (phase) {
    case 0: {
      const m = project.metadata;
      if (!m.courseCode.trim()) errors.push('Course code is required.');
      if (!m.courseTitle.trim()) errors.push('Course title is required.');
      if (m.creditUnits <= 0) errors.push('Credit units must be greater than 0.');
      if (!m.courseDescription.trim()) errors.push('Course description is required.');
      if (!m.targetAudience.trim()) errors.push('Target audience is required.');

      if (project.competencies.length === 0) {
        errors.push('At least one competency is required.');
      }

      for (const comp of project.competencies) {
        if (!comp.statement.trim()) {
          errors.push(`Competency ${comp.code}: statement is empty.`);
        }
        if (!comp.cognitiveLevel) {
          errors.push(`Competency ${comp.code}: cognitive level is required.`);
        }
        if (comp.skills.length === 0) {
          errors.push(`Competency ${comp.code}: at least one skill is required.`);
        }
        for (const skill of comp.skills) {
          if (!skill.statement.trim()) {
            errors.push(`Competency ${comp.code}, Skill ${skill.code}: statement is empty.`);
          }
        }
      }

      const totalWeight = project.competencies.reduce((sum, c) => sum + c.weight, 0);
      if (project.competencies.length > 0 && Math.abs(totalWeight - 100) > 0.01) {
        errors.push(`Competency weights sum to ${totalWeight}%, should be 100%.`);
      }
      break;
    }

    case 1: {
      const phase1 = project.phaseStatuses.find((p) => p.phase === 1);
      if (!phase1 || phase1.status === 'locked') {
        errors.push('Course design review has not been completed.');
      }
      break;
    }

    case 2: {
      for (const comp of project.competencies) {
        const esForComp = project.evidenceStatements.filter(
          (es) => es.parentCompetencyId === comp.id
        );
        if (esForComp.length < 4) {
          errors.push(
            `Competency ${comp.code}: needs at least 4 evidence statements (has ${esForComp.length}).`
          );
        }

        for (const es of esForComp) {
          if (!es.verb.trim()) errors.push(`ES ${es.code}: action verb is required.`);
          if (!es.statement.trim()) errors.push(`ES ${es.code}: statement is empty.`);
          if (es.scopeIn.length === 0) errors.push(`ES ${es.code}: at least one scope-in item required.`);

          const losForES = project.learningObjectives.filter((lo) => lo.parentESId === es.id);
          if (losForES.length < 2) {
            errors.push(`ES ${es.code}: needs at least 2 learning objectives (has ${losForES.length}).`);
          }
        }
      }
      break;
    }

    case 3: {
      if (project.tasks.length === 0) errors.push('At least one task is required.');
      const assignedESIds = new Set(project.tasks.flatMap((t) => t.esIds));
      for (const es of project.evidenceStatements) {
        if (!assignedESIds.has(es.id)) errors.push(`ES ${es.code} is not assigned to any task.`);
      }
      for (const task of project.tasks) {
        if (task.competencyIds.length === 0) errors.push(`Task ${task.number}: no competencies assigned.`);
        if (task.esIds.length === 0) errors.push(`Task ${task.number}: no evidence statements assigned.`);
      }
      break;
    }

    case 4: {
      for (const task of project.tasks) {
        for (const esId of task.esIds) {
          const tmc = task.taskModelComponents[esId];
          if (!tmc) {
            const es = project.evidenceStatements.find((e) => e.id === esId);
            errors.push(`Task ${task.number}: missing task model for ES ${es?.code ?? esId}.`);
          } else {
            if (!tmc.performanceIndicator.trim()) errors.push(`Task ${task.number}, ES ${esId}: performance indicator empty.`);
            if (tmc.knowledgeAreas.length === 0) errors.push(`Task ${task.number}, ES ${esId}: knowledge areas required.`);
            if (!tmc.taskDescription.trim()) errors.push(`Task ${task.number}, ES ${esId}: task description empty.`);
            if (!tmc.evaluationCriteria.trim()) errors.push(`Task ${task.number}, ES ${esId}: evaluation criteria empty.`);
            if (tmc.commonErrors.length === 0) errors.push(`Task ${task.number}, ES ${esId}: common errors required.`);
            if (!tmc.exemplarResponse.trim()) errors.push(`Task ${task.number}, ES ${esId}: exemplar response empty.`);
            if (!tmc.cognitiveComplexity.trim()) errors.push(`Task ${task.number}, ES ${esId}: cognitive complexity empty.`);
          }
        }
        if (task.scenarios.length < 5) {
          errors.push(`Task ${task.number}: needs at least 5 scenarios (has ${task.scenarios.length}).`);
        }
      }
      break;
    }

    case 5: {
      for (const task of project.tasks) {
        if (task.prompts.length === 0) errors.push(`Task ${task.number}: no PA prompts defined.`);
        for (const prompt of task.prompts) {
          if (prompt.mappedESIds.length === 0) errors.push(`Task ${task.number}, Prompt ${prompt.code}: not mapped to any ES.`);
        }
        const coveredESIds = new Set(task.prompts.flatMap((p) => p.mappedESIds));
        for (const esId of task.esIds) {
          if (!coveredESIds.has(esId)) {
            const es = project.evidenceStatements.find((e) => e.id === esId);
            errors.push(`Task ${task.number}: ES ${es?.code ?? esId} not covered by any prompt.`);
          }
        }
        if (task.rubric.length === 0) errors.push(`Task ${task.number}: no rubric rows defined.`);
        const rubricPromptCodes = new Set(task.rubric.map((r) => r.promptCode));
        for (const prompt of task.prompts) {
          if (!rubricPromptCodes.has(prompt.code)) errors.push(`Task ${task.number}: no rubric row for prompt ${prompt.code}.`);
        }
        for (const row of task.rubric) {
          if (!row.notEvident.trim()) errors.push(`Task ${task.number}, Rubric ${row.promptCode}: "Not Evident" empty.`);
          if (!row.approachingCompetence.trim()) errors.push(`Task ${task.number}, Rubric ${row.promptCode}: "Approaching" empty.`);
          if (!row.competent.trim()) errors.push(`Task ${task.number}, Rubric ${row.promptCode}: "Competent" empty.`);
        }
      }
      break;
    }

    case 6: {
      for (const task of project.tasks) {
        if (!task.introduction.trim()) errors.push(`Task ${task.number}: introduction text is empty.`);
        if (task.scenarios.length === 0) errors.push(`Task ${task.number}: no scenarios for document assembly.`);
      }
      break;
    }

    case 7: {
      if (project.ssdSections.length === 0) errors.push('No SSD sections defined.');
      for (const comp of project.competencies) {
        const section = project.ssdSections.find((s) => s.competencyId === comp.id);
        if (!section) errors.push(`No SSD section for competency ${comp.code}.`);
        else if (section.lessons.length === 0) errors.push(`SSD section for ${comp.code}: no lessons defined.`);
      }
      break;
    }

    case 8: {
      for (const section of project.ssdSections) {
        for (const lesson of section.lessons) {
          for (const unit of lesson.units) {
            if (unit.esLoAlignment.length === 0) errors.push(`Unit ${unit.code}: not aligned to any ES or LO.`);
            if (unit.resources.length === 0) errors.push(`Unit ${unit.code}: no learning resources assigned.`);
          }
        }
      }
      break;
    }

    case 9: {
      for (const section of project.ssdSections) {
        for (const lesson of section.lessons) {
          for (const unit of lesson.units) {
            if (!unit.content || !unit.content.trim()) errors.push(`Unit ${unit.code}: content not generated.`);
          }
        }
      }
      break;
    }

    case 10: {
      if (project.knowledgeChecks.length === 0) errors.push('No knowledge checks created.');
      const lessonsWithKC = new Set(project.knowledgeChecks.map((kc) => kc.lessonId));
      for (const section of project.ssdSections) {
        for (const lesson of section.lessons) {
          if (!lessonsWithKC.has(lesson.id)) errors.push(`Lesson "${lesson.title}": no knowledge checks.`);
        }
      }
      for (const kc of project.knowledgeChecks) {
        if (kc.options.length < 4) errors.push(`KC "${kc.stem.substring(0, 40)}...": needs 4+ options.`);
        const correctCount = kc.options.filter((o) => o.isCorrect).length;
        if (correctCount !== 1) errors.push(`KC "${kc.stem.substring(0, 40)}...": must have exactly 1 correct.`);
      }
      break;
    }

    case 11: {
      if (project.sampleResponses.length === 0) errors.push('No sample responses created.');
      for (const task of project.tasks) {
        const samplesForTask = project.sampleResponses.filter((s) => s.taskId === task.id);
        if (!samplesForTask.some((s) => s.style === 'formal-technical')) errors.push(`Task ${task.number}: missing formal-technical sample.`);
        if (!samplesForTask.some((s) => s.style === 'conversational-practical')) errors.push(`Task ${task.number}: missing conversational-practical sample.`);
      }
      break;
    }

    case 12: {
      if (project.feedbackComments.length === 0) errors.push('No feedback comments processed.');
      for (const fb of project.feedbackComments) {
        if (!fb.verdict) errors.push(`Feedback from ${fb.source}: verdict not set.`);
        if (!fb.rationale.trim()) errors.push(`Feedback from ${fb.source}: rationale empty.`);
      }
      break;
    }

    case 13: {
      if (project.documentVersions.length === 0) errors.push('No document versions created.');
      const docTypes = new Set(project.documentVersions.map((d) => d.documentType));
      if (!docTypes.has('PA')) errors.push('No Performance Assessment document version.');
      if (!docTypes.has('SSD')) errors.push('No SSD document version.');
      break;
    }
  }

  return errors;
}

// ============================================================
// Store
// ============================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- UI-level initial state ---
      currentProject: null,
      currentPhase: 0,
      phases: initialPhases,
      recentProjects: [],
      settings: {
        apiKey: '',
        model: 'claude-sonnet-4-20250514',
        exportDir: '',
        voiceEnabled: true,
      },
      settingsOpen: false,
      phaseGateOpen: false,
      phaseGateChecks: [],

      // --- Comprehensive project state ---
      project: null,
      isGenerating: false,
      streamingText: '',

      // --- UI-level actions ---
      setCurrentProject: (proj) => set({ currentProject: proj }),
      setCurrentPhase: (phase) => set({ currentPhase: phase }),
      setPhaseStatus: (id, status) =>
        set((state) => ({
          phases: state.phases.map((p) => (p.id === id ? { ...p, status } : p)),
        })),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      openPhaseGate: (checks) => set({ phaseGateOpen: true, phaseGateChecks: checks }),
      closePhaseGate: () => set({ phaseGateOpen: false, phaseGateChecks: [] }),
      goNextPhase: () => {
        const { currentPhase, phases } = get();
        if (currentPhase < phases.length - 1) {
          set((state) => ({
            currentPhase: currentPhase + 1,
            phases: state.phases.map((p) => {
              if (p.id === currentPhase) return { ...p, status: 'completed' };
              if (p.id === currentPhase + 1) return { ...p, status: 'active' };
              return p;
            }),
          }));
        }
      },
      goPrevPhase: () => {
        const { currentPhase } = get();
        if (currentPhase > 0) {
          set({ currentPhase: currentPhase - 1 });
        }
      },

      // --- Project lifecycle ---
      createProject: (metadata) => {
        const project = buildEmptyProject(metadata);
        set({
          project,
          currentProject: { name: metadata.courseTitle || 'New CBE Course', path: '' },
          currentPhase: 0,
          phases: initialPhases.map((p) => ({ ...p })),
        });
        // Persist immediately
        setTimeout(() => get().saveProject(), 0);
      },

      updateMetadata: (partial) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              metadata: { ...state.project.metadata, ...partial },
            }),
          };
        });
      },

      // --- Competencies ---
      addCompetency: (comp) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              competencies: [...state.project.competencies, comp],
            }),
          };
        });
      },

      updateCompetency: (id, partial) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              competencies: state.project.competencies.map((c) =>
                c.id === id ? { ...c, ...partial } : c
              ),
            }),
          };
        });
      },

      removeCompetency: (id) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              competencies: state.project.competencies.filter((c) => c.id !== id),
            }),
          };
        });
      },

      // --- Evidence Statements ---
      setEvidenceStatements: (es) => {
        set((state) => {
          if (!state.project) return state;
          return { project: touchUpdated({ ...state.project, evidenceStatements: es }) };
        });
      },

      updateES: (id, partial) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              evidenceStatements: state.project.evidenceStatements.map((e) =>
                e.id === id ? { ...e, ...partial } : e
              ),
            }),
          };
        });
      },

      // --- Learning Objectives ---
      setLearningObjectives: (los) => {
        set((state) => {
          if (!state.project) return state;
          return { project: touchUpdated({ ...state.project, learningObjectives: los }) };
        });
      },

      // --- Tasks ---
      setTasks: (tasks) => {
        set((state) => {
          if (!state.project) return state;
          return { project: touchUpdated({ ...state.project, tasks }) };
        });
      },

      updateTask: (id, partial) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              tasks: state.project.tasks.map((t) =>
                t.id === id ? { ...t, ...partial } : t
              ),
            }),
          };
        });
      },

      // --- SSD ---
      setSSDSections: (sections) => {
        set((state) => {
          if (!state.project) return state;
          return { project: touchUpdated({ ...state.project, ssdSections: sections }) };
        });
      },

      // --- Knowledge Checks ---
      setKnowledgeChecks: (kcs) => {
        set((state) => {
          if (!state.project) return state;
          return { project: touchUpdated({ ...state.project, knowledgeChecks: kcs }) };
        });
      },

      // --- Sample Responses ---
      setSampleResponses: (samples) => {
        set((state) => {
          if (!state.project) return state;
          return { project: touchUpdated({ ...state.project, sampleResponses: samples }) };
        });
      },

      // --- Feedback ---
      addFeedback: (comment) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              feedbackComments: [...state.project.feedbackComments, comment],
            }),
          };
        });
      },

      updateFeedback: (id, partial) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              feedbackComments: state.project.feedbackComments.map((f) =>
                f.id === id ? { ...f, ...partial } : f
              ),
            }),
          };
        });
      },

      // --- Document Versions ---
      addDocumentVersion: (version) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              documentVersions: [...state.project.documentVersions, version],
            }),
          };
        });
      },

      // --- Phase management ---
      updatePhaseStatus: (phase, status) => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: touchUpdated({
              ...state.project,
              phaseStatuses: state.project.phaseStatuses.map((p) =>
                p.phase === phase ? { ...p, ...status } : p
              ),
            }),
          };
        });
      },

      validatePhase: (phase) => {
        const project = get().project;
        if (!project) return ['No project loaded.'];
        return validatePhaseRules(phase, project);
      },

      // --- AI / generation ---
      setGenerating: (bool) => set({ isGenerating: bool }),
      setStreamingText: (text) => set({ streamingText: text }),

      // --- Persistence ---
      saveProject: () => {
        const project = get().project;
        if (!project) return;

        localStorage.setItem(STORAGE_PREFIX + project.id, JSON.stringify(project));

        const index: ProjectSummary[] = JSON.parse(
          localStorage.getItem(INDEX_KEY) || '[]'
        );
        const existing = index.findIndex((p) => p.id === project.id);
        const summary: ProjectSummary = {
          id: project.id,
          courseCode: project.metadata.courseCode,
          courseTitle: project.metadata.courseTitle,
          currentPhase: get().currentPhase,
          updatedAt: project.updatedAt,
        };

        if (existing >= 0) {
          index[existing] = summary;
        } else {
          index.push(summary);
        }
        localStorage.setItem(INDEX_KEY, JSON.stringify(index));
      },

      loadProject: (id) => {
        const raw = localStorage.getItem(STORAGE_PREFIX + id);
        if (!raw) return;

        const project: Project = JSON.parse(raw);
        const lastCompleted = [...project.phaseStatuses]
          .reverse()
          .find((p) => p.status === 'completed');
        const currentPhase = lastCompleted ? Math.min(lastCompleted.phase + 1, 13) : 0;

        set({
          project,
          currentProject: { name: project.metadata.courseTitle, path: '' },
          currentPhase,
        });
      },

      listProjects: () => {
        const raw = localStorage.getItem(INDEX_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as ProjectSummary[];
      },
    }),
    {
      name: 'cbe-generator-store',
      partialize: (state) => ({
        settings: state.settings,
        currentPhase: state.currentPhase,
        recentProjects: state.recentProjects,
      }),
    }
  )
);
