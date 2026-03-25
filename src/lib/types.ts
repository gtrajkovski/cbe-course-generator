// ============================================================
// CBE Course Development Generator — Core Data Model
// 13-phase competency-based education workflow
// ============================================================

// --- Bloom's Taxonomy Cognitive Levels ---
export type CognitiveLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const COGNITIVE_LEVEL_LABELS: Record<CognitiveLevel, string> = {
  1: 'Remember',
  2: 'Understand',
  3: 'Apply',
  4: 'Analyze',
  5: 'Evaluate',
  6: 'Create',
};

// --- Phase 0: Course Setup & Competencies ---

export interface Skill {
  code: string;
  statement: string;
  level: CognitiveLevel;
}

export interface Competency {
  id: string;
  code: string;
  statement: string;
  cognitiveLevel: CognitiveLevel;
  weight: number; // percentage, all competencies should sum to 100
  skills: Skill[];
  scopeNotes: string; // what's in/out of bounds
}

export interface ProjectMetadata {
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  school: string;
  program: string;
  domainCode: string;
  paCode: string;
  cpltCode: string;
  assessmentModality: string;
  certificationAlignment: string;
  primaryTextbook: string;
  keyResources: string[];
  pdo: string;
  id_name: string; // instructional designer
  ad: string;
  sme: string;
  itx: string;
  targetAudience: string;
  courseDescription: string;
  prerequisites: string;
  technologyRequirements: string[];
}

// --- Phase 2: Evidence Statements & Learning Objectives ---

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
}

export interface EvidenceStatement {
  id: string;
  code: string;
  verb: string;
  cognitiveLevel: CognitiveLevel;
  statement: string;
  scopeIn: string[];
  scopeOut: string[];
  learningTopics: LearningTopic[];
  parentCompetencyId: string;
  howStudentsDemonstrate: string;
}

export interface LearningObjective {
  id: string;
  code: string;
  verb: string;
  statement: string;
  parentESId: string;
}

// --- Phase 3-5: Tasks, Scenarios, Prompts, Rubrics ---

export interface Scenario {
  id: string;
  name: string;
  orgDescription: string;
  targetUsers: string;
  keyChallenges: string[];
  domainData: string;
}

export interface TaskModelComponent {
  performanceIndicator: string;
  knowledgeAreas: string[];
  taskDescription: string;
  evaluationCriteria: string;
  commonErrors: string[];
  exemplarResponse: string;
  cognitiveComplexity: string;
}

export interface PAPrompt {
  id: string;
  code: string; // A, A1, A2, B, B1, etc.
  text: string;
  mappedESIds: string[];
  subPrompts?: PAPrompt[];
}

export interface RubricRow {
  promptCode: string;
  aspect: string;
  notEvident: string;
  approachingCompetence: string;
  competent: string;
}

export interface Task {
  id: string;
  number: number;
  name: string;
  competencyIds: string[];
  esIds: string[];
  scenarios: Scenario[];
  prompts: PAPrompt[];
  rubric: RubricRow[];
  introduction: string;
  supportingDocs: { name: string; description: string; filename: string }[];
  taskModelComponents: Record<string, TaskModelComponent>; // keyed by ES id
}

// --- Phase 7-9: SSD Structure & Content ---

export interface LearningResource {
  id: string;
  title: string;
  type: 'textbook' | 'tutorial' | 'documentation' | 'video' | 'interactive';
  url?: string;
  chapters?: string;
  pageRange?: string;
}

export interface SSDUnit {
  id: string;
  code: string;
  title: string;
  esLoAlignment: string[];
  topics: string[];
  resources: LearningResource[];
  content?: string; // Phase 9 generated content
}

export interface SSDLesson {
  id: string;
  title: string;
  units: SSDUnit[];
}

export interface SSDSection {
  id: string;
  competencyId: string;
  title: string;
  lessons: SSDLesson[];
}

// --- Phase 10: Knowledge Checks ---

export interface KnowledgeCheckOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface KnowledgeCheck {
  id: string;
  lessonId: string;
  stem: string;
  cognitiveLevel: CognitiveLevel;
  options: KnowledgeCheckOption[];
  esAlignment: string;
}

// --- Phase 11: Sample Responses ---

export interface SampleResponse {
  id: string;
  taskId: string;
  scenarioId: string;
  style: 'formal-technical' | 'conversational-practical';
  sections: { promptCode: string; content: string }[];
  citations: string[];
}

// --- Phase 12-13: Feedback & Versioning ---

export interface FeedbackComment {
  id: string;
  source: string; // reviewer name
  documentSection: string;
  comment: string;
  verdict: 'ACCEPT' | 'PARTIAL' | 'DECLINE' | 'NOTE';
  rationale: string;
  cascadeActions?: string[];
}

export interface DocumentVersion {
  id: string;
  documentType: string;
  version: string; // v1.0, v1.1, etc.
  date: string;
  changes: { code: string; description: string }[];
  cleanPath?: string;
  redlinePath?: string;
}

// --- Phase Tracking ---

export type PhaseStatusValue = 'locked' | 'available' | 'in-progress' | 'completed';

export interface PhaseStatus {
  phase: number;
  name: string;
  status: PhaseStatusValue;
  validationErrors: string[];
  completedAt?: string;
}

// --- Top-level Project ---

export interface Project {
  id: string;
  metadata: ProjectMetadata;
  competencies: Competency[];
  evidenceStatements: EvidenceStatement[];
  learningObjectives: LearningObjective[];
  tasks: Task[];
  ssdSections: SSDSection[];
  knowledgeChecks: KnowledgeCheck[];
  sampleResponses: SampleResponse[];
  feedbackComments: FeedbackComment[];
  documentVersions: DocumentVersion[];
  phaseStatuses: PhaseStatus[];
  createdAt: string;
  updatedAt: string;
}

// --- Phase Definitions (constant) ---

export const PHASE_DEFINITIONS: { phase: number; name: string }[] = [
  { phase: 0, name: 'Course Setup & Competencies' },
  { phase: 1, name: 'Course Design Review' },
  { phase: 2, name: 'Evidence Statements & Learning Objectives' },
  { phase: 3, name: 'Task Architecture' },
  { phase: 4, name: 'Task Models & Scenarios' },
  { phase: 5, name: 'PA Prompts & Rubrics' },
  { phase: 6, name: 'PA Document Assembly' },
  { phase: 7, name: 'SSD Structure' },
  { phase: 8, name: 'SSD Resources & Alignment' },
  { phase: 9, name: 'SSD Content Generation' },
  { phase: 10, name: 'Knowledge Checks' },
  { phase: 11, name: 'Sample Responses' },
  { phase: 12, name: 'Feedback Integration' },
  { phase: 13, name: 'Final Packaging & Versioning' },
];

// --- Saved project summary (for project list) ---

export interface ProjectSummary {
  id: string;
  courseCode: string;
  courseTitle: string;
  currentPhase: number;
  updatedAt: string;
}
