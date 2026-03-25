// ============================================================
// Phase Gate Validators
// Each function returns { valid, errors, warnings }
// ============================================================

import type {
  Project,
  Competency,
  EvidenceStatement,
  LearningObjective,
  Task,
  SSDSection,
  KnowledgeCheck,
  SampleResponse,
  CognitiveLevel,
} from './types';
import { COGNITIVE_LEVEL_LABELS } from './types';

// ── Result type ────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function result(errors: string[], warnings: string[] = []): ValidationResult {
  return { valid: errors.length === 0, errors, warnings };
}

// ── Bloom's verb maps (simplified) ─────────────────────────────

const BLOOMS_VERBS: Record<CognitiveLevel, string[]> = {
  1: ['list', 'define', 'identify', 'recall', 'recognize', 'name', 'state', 'describe', 'label', 'match'],
  2: ['explain', 'summarize', 'classify', 'compare', 'interpret', 'paraphrase', 'discuss', 'distinguish', 'predict'],
  3: ['apply', 'demonstrate', 'implement', 'execute', 'use', 'solve', 'illustrate', 'calculate', 'modify', 'operate'],
  4: ['analyze', 'differentiate', 'organize', 'examine', 'investigate', 'categorize', 'deconstruct', 'compare', 'contrast'],
  5: ['evaluate', 'assess', 'justify', 'critique', 'judge', 'recommend', 'defend', 'prioritize', 'appraise'],
  6: ['create', 'design', 'develop', 'construct', 'produce', 'formulate', 'compose', 'generate', 'plan', 'propose'],
};

// ── Phase 0: CCW Intake ────────────────────────────────────────

export function validatePhase0(project: Project): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const m = project.metadata;

  // Required metadata fields
  if (!m.courseCode.trim()) errors.push('Course code is required.');
  if (!m.courseTitle.trim()) errors.push('Course title is required.');
  if (m.creditUnits <= 0) errors.push('Credit units must be greater than 0.');
  if (!m.courseDescription.trim()) errors.push('Course description is required.');
  if (!m.targetAudience.trim()) errors.push('Target audience is required.');
  if (!m.school.trim()) errors.push('School is required.');
  if (!m.program.trim()) errors.push('Program is required.');
  if (!m.assessmentModality.trim()) errors.push('Assessment modality is required.');

  // Optional but recommended
  if (!m.primaryTextbook.trim()) warnings.push('Primary textbook not specified.');
  if (m.keyResources.length === 0) warnings.push('No key resources listed.');
  if (!m.id_name.trim()) warnings.push('Instructional designer name not specified.');
  if (!m.sme.trim()) warnings.push('SME not specified.');

  // Competencies
  if (project.competencies.length === 0) {
    errors.push('At least one competency is required.');
  } else {
    // Weight sum
    const totalWeight = project.competencies.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push(`Competency weights sum to ${totalWeight.toFixed(1)}%, should be 100%.`);
    }

    for (const comp of project.competencies) {
      if (!comp.code.trim()) errors.push(`Competency missing code.`);
      if (!comp.statement.trim()) errors.push(`Competency ${comp.code}: statement is empty.`);
      if (!comp.cognitiveLevel) errors.push(`Competency ${comp.code}: cognitive level not set.`);
      if (comp.weight <= 0) errors.push(`Competency ${comp.code}: weight must be > 0.`);
      if (comp.skills.length === 0) errors.push(`Competency ${comp.code}: at least one skill required.`);
      if (!comp.scopeNotes.trim()) warnings.push(`Competency ${comp.code}: scope notes empty.`);

      for (const skill of comp.skills) {
        if (!skill.statement.trim()) errors.push(`Competency ${comp.code}, Skill ${skill.code}: statement empty.`);
      }
    }
  }

  return result(errors, warnings);
}

// ── Phase 1: Course Design Review ──────────────────────────────

export function validatePhase1(project: Project): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const phase1 = project.phaseStatuses.find((p) => p.phase === 1);
  if (!phase1 || phase1.status === 'locked') {
    errors.push('Course design review has not been initiated.');
  }

  // Check that Phase 0 was completed
  const phase0 = project.phaseStatuses.find((p) => p.phase === 0);
  if (!phase0 || phase0.status !== 'completed') {
    errors.push('Phase 0 (CCW Intake) must be completed first.');
  }

  // Check competency cognitive levels make sense
  for (const comp of project.competencies) {
    if (comp.cognitiveLevel >= 5 && project.metadata.creditUnits <= 2) {
      warnings.push(`${comp.code} at L${comp.cognitiveLevel} may be high for a ${project.metadata.creditUnits}-CU course.`);
    }
  }

  return result(errors, warnings);
}

// ── Phase 2: Evidence Statements & LOs ─────────────────────────

export function validatePhase2(project: Project): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const comp of project.competencies) {
    const esForComp = project.evidenceStatements.filter((es) => es.parentCompetencyId === comp.id);

    // 4 ES per competency
    if (esForComp.length < 4) {
      errors.push(`${comp.code}: needs 4 ES (has ${esForComp.length}).`);
    } else if (esForComp.length > 6) {
      warnings.push(`${comp.code}: has ${esForComp.length} ES, consider consolidating.`);
    }

    for (const es of esForComp) {
      // ES must have content
      if (!es.verb.trim()) errors.push(`${es.code}: action verb required.`);
      if (!es.statement.trim()) errors.push(`${es.code}: statement is empty.`);
      if (es.scopeIn.length === 0) errors.push(`${es.code}: at least one scope-in item required.`);
      if (es.scopeOut.length === 0) warnings.push(`${es.code}: no scope-out items defined.`);
      if (!es.howStudentsDemonstrate.trim()) warnings.push(`${es.code}: "how students demonstrate" not specified.`);

      // Verb ceiling rule: ES level must be <= competency level
      if (es.cognitiveLevel > comp.cognitiveLevel) {
        errors.push(`${es.code}: L${es.cognitiveLevel} exceeds ${comp.code} ceiling L${comp.cognitiveLevel}.`);
      }

      // Check verb matches claimed level
      const verb = es.verb.toLowerCase();
      const expectedVerbs = BLOOMS_VERBS[es.cognitiveLevel] ?? [];
      if (expectedVerbs.length > 0 && !expectedVerbs.some((v) => verb.includes(v))) {
        warnings.push(`${es.code}: verb "${es.verb}" may not align with L${es.cognitiveLevel} (${COGNITIVE_LEVEL_LABELS[es.cognitiveLevel]}).`);
      }

      // 2 LO per ES
      const losForES = project.learningObjectives.filter((lo) => lo.parentESId === es.id);
      if (losForES.length < 2) {
        errors.push(`${es.code}: needs 2 LOs (has ${losForES.length}).`);
      }

      for (const lo of losForES) {
        if (!lo.verb.trim()) errors.push(`${lo.code}: verb required.`);
        if (!lo.statement.trim()) errors.push(`${lo.code}: statement is empty.`);
      }
    }
  }

  return result(errors, warnings);
}

// ── Phase 3: Task Architecture ─────────────────────────────────

export function validatePhase3(project: Project): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (project.tasks.length === 0) {
    errors.push('At least one task is required.');
    return result(errors, warnings);
  }

  // All ES must be assigned
  const assignedESIds = new Set(project.tasks.flatMap((t) => t.esIds));
  for (const es of project.evidenceStatements) {
    if (!assignedESIds.has(es.id)) {
      errors.push(`${es.code} is not assigned to any task.`);
    }
  }

  // No ES split across tasks (same competency's ES should be in same task)
  for (const comp of project.competencies) {
    const esForComp = project.evidenceStatements.filter((es) => es.parentCompetencyId === comp.id);
    const esIds = new Set(esForComp.map((es) => es.id));

    const tasksWithCompES = project.tasks.filter((t) => t.esIds.some((id) => esIds.has(id)));
    if (tasksWithCompES.length > 1) {
      // Check if the same comp's ES are split
      const allInOneTask = tasksWithCompES.some((t) => esForComp.every((es) => t.esIds.includes(es.id)));
      if (!allInOneTask) {
        warnings.push(`${comp.code}'s ES are split across ${tasksWithCompES.length} tasks. Ensure this is intentional.`);
      }
    }
  }

  for (const task of project.tasks) {
    if (task.competencyIds.length === 0) errors.push(`Task ${task.number}: no competencies assigned.`);
    if (task.esIds.length === 0) errors.push(`Task ${task.number}: no ES assigned.`);
    if (task.esIds.length < 2) warnings.push(`Task ${task.number}: only ${task.esIds.length} ES; consider if a separate task is justified.`);
  }

  return result(errors, warnings);
}

// ── Phase 4: Task Models & Scenarios ───────────────────────────

export function validatePhase4(project: Project): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const task of project.tasks) {
    // 7 components per ES
    for (const esId of task.esIds) {
      const tmc = task.taskModelComponents[esId];
      const es = project.evidenceStatements.find((e) => e.id === esId);
      const esLabel = es?.code ?? esId;

      if (!tmc) {
        errors.push(`Task ${task.number}: missing task model for ${esLabel}.`);
        continue;
      }

      if (!tmc.performanceIndicator.trim()) errors.push(`Task ${task.number}, ${esLabel}: performance indicator empty.`);
      if (tmc.knowledgeAreas.length === 0) errors.push(`Task ${task.number}, ${esLabel}: no knowledge areas.`);
      if (!tmc.taskDescription.trim()) errors.push(`Task ${task.number}, ${esLabel}: task description empty.`);
      if (!tmc.evaluationCriteria.trim()) errors.push(`Task ${task.number}, ${esLabel}: evaluation criteria empty.`);
      if (tmc.commonErrors.length === 0) errors.push(`Task ${task.number}, ${esLabel}: no common errors listed.`);
      if (!tmc.exemplarResponse.trim()) errors.push(`Task ${task.number}, ${esLabel}: exemplar response empty.`);
      if (!tmc.cognitiveComplexity.trim()) errors.push(`Task ${task.number}, ${esLabel}: cognitive complexity empty.`);

      if (tmc.commonErrors.length < 3) warnings.push(`Task ${task.number}, ${esLabel}: consider listing more common errors (has ${tmc.commonErrors.length}).`);
    }

    // 5+ scenarios
    if (task.scenarios.length < 5) {
      errors.push(`Task ${task.number}: needs 5+ scenarios (has ${task.scenarios.length}).`);
    }

    for (const scenario of task.scenarios) {
      if (!scenario.name.trim()) errors.push(`Task ${task.number}: scenario missing name.`);
      if (!scenario.orgDescription.trim()) errors.push(`Task ${task.number}, "${scenario.name}": org description empty.`);
      if (scenario.keyChallenges.length === 0) warnings.push(`Task ${task.number}, "${scenario.name}": no key challenges listed.`);
    }
  }

  return result(errors, warnings);
}

// ── Phase 5: PA Prompts & Rubrics ──────────────────────────────

export function validatePhase5(project: Project): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const task of project.tasks) {
    if (task.prompts.length === 0) {
      errors.push(`Task ${task.number}: no prompts defined.`);
      continue;
    }

    // All ES covered by prompts
    const coveredESIds = new Set(task.prompts.flatMap((p) => p.mappedESIds));
    for (const esId of task.esIds) {
      if (!coveredESIds.has(esId)) {
        const es = project.evidenceStatements.find((e) => e.id === esId);
        errors.push(`Task ${task.number}: ${es?.code ?? esId} not covered by any prompt.`);
      }
    }

    // Each prompt has content
    for (const prompt of task.prompts) {
      if (!prompt.text.trim()) errors.push(`Task ${task.number}, ${prompt.code}: prompt text empty.`);
      if (prompt.mappedESIds.length === 0) errors.push(`Task ${task.number}, ${prompt.code}: not mapped to any ES.`);
    }

    // Rubric
    if (task.rubric.length === 0) {
      errors.push(`Task ${task.number}: no rubric rows.`);
      continue;
    }

    const rubricCodes = new Set(task.rubric.map((r) => r.promptCode));
    for (const prompt of task.prompts) {
      if (!rubricCodes.has(prompt.code)) {
        errors.push(`Task ${task.number}: no rubric row for prompt ${prompt.code}.`);
      }
    }

    // C/D language present
    for (const row of task.rubric) {
      if (!row.competent.trim()) errors.push(`Task ${task.number}, ${row.promptCode}: "Competent" text missing.`);
      if (!row.notEvident.trim()) errors.push(`Task ${task.number}, ${row.promptCode}: "Not Evident" text missing.`);
      if (!row.approachingCompetence.trim()) errors.push(`Task ${task.number}, ${row.promptCode}: "Approaching Competence" text missing.`);

      // Standard language checks
      if (row.competent.trim() && !row.competent.toLowerCase().includes('provide')) {
        warnings.push(`Task ${task.number}, ${row.promptCode}: "Competent" may not use standard C/D language pattern.`);
      }
    }

    // Introduction
    if (!task.introduction.trim()) warnings.push(`Task ${task.number}: introduction text not written.`);
  }

  return result(errors, warnings);
}

// ── Phase 7: SSD Resources ─────────────────────────────────────

export function validatePhase7(project: Project): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (project.ssdSections.length === 0) {
    errors.push('No SSD sections defined.');
    return result(errors, warnings);
  }

  // Section for each competency
  for (const comp of project.competencies) {
    const section = project.ssdSections.find((s) => s.competencyId === comp.id);
    if (!section) {
      errors.push(`No SSD section for ${comp.code}.`);
      continue;
    }
    if (section.lessons.length === 0) {
      errors.push(`${comp.code} section: no lessons.`);
    }
  }

  // All units have resources
  const allUnits = project.ssdSections.flatMap((s) => s.lessons.flatMap((l) => l.units));
  for (const unit of allUnits) {
    if (unit.resources.length === 0) {
      errors.push(`Unit ${unit.code}: no learning resources assigned.`);
    }
    if (unit.esLoAlignment.length === 0) {
      errors.push(`Unit ${unit.code}: not aligned to any ES or LO.`);
    }
    if (unit.topics.length === 0) {
      warnings.push(`Unit ${unit.code}: no learning topics listed.`);
    }
  }

  // Resource type diversity check
  const resourceTypes = new Set(allUnits.flatMap((u) => u.resources.map((r) => r.type)));
  if (resourceTypes.size < 2) {
    warnings.push('Consider adding more diverse resource types (only using: ' + Array.from(resourceTypes).join(', ') + ').');
  }

  // LO coverage check
  for (const lo of project.learningObjectives) {
    const covered = allUnits.some((u) => u.esLoAlignment.includes(lo.code));
    if (!covered) {
      warnings.push(`LO ${lo.code} not covered by any SSD unit.`);
    }
  }

  return result(errors, warnings);
}

// ── Phase 8: Knowledge Checks ──────────────────────────────────

export function validatePhase8(project: Project): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (project.knowledgeChecks.length === 0) {
    errors.push('No knowledge checks created.');
    return result(errors, warnings);
  }

  const allLessons = project.ssdSections.flatMap((s) => s.lessons);

  // 4 KCs per lesson
  for (const lesson of allLessons) {
    const lessonKCs = project.knowledgeChecks.filter((kc) => kc.lessonId === lesson.id);
    if (lessonKCs.length < 4) {
      errors.push(`"${lesson.title}": needs 4 KCs (has ${lessonKCs.length}).`);
    }
  }

  for (const kc of project.knowledgeChecks) {
    // 4 options each
    if (kc.options.length < 4) {
      errors.push(`KC "${kc.stem.substring(0, 40)}...": needs 4 options (has ${kc.options.length}).`);
    }

    // Exactly 1 correct
    const correctCount = kc.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      errors.push(`KC "${kc.stem.substring(0, 40)}...": must have exactly 1 correct answer (has ${correctCount}).`);
    }

    // All options have feedback
    for (const opt of kc.options) {
      if (!opt.feedback.trim()) {
        errors.push(`KC "${kc.stem.substring(0, 40)}...": option "${opt.text.substring(0, 20)}..." missing feedback.`);
        break;
      }
    }

    // Correct answer feedback format
    const correctOpt = kc.options.find((o) => o.isCorrect);
    if (correctOpt && !correctOpt.feedback.startsWith('Correct!')) {
      warnings.push(`KC "${kc.stem.substring(0, 40)}...": correct feedback should start with "Correct!"`);
    }

    // ES alignment
    if (!kc.esAlignment.trim()) {
      warnings.push(`KC "${kc.stem.substring(0, 40)}...": no ES alignment specified.`);
    }

    // Cognitive level
    if (!kc.cognitiveLevel) {
      errors.push(`KC "${kc.stem.substring(0, 40)}...": cognitive level not set.`);
    }
  }

  return result(errors, warnings);
}

// ── Phase 13: Master Checklist ─────────────────────────────────

export function validatePhase13(project: Project): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Run all prior validations
  const phase0 = validatePhase0(project);
  const phase1 = validatePhase1(project);
  const phase2 = validatePhase2(project);
  const phase3 = validatePhase3(project);
  const phase4 = validatePhase4(project);
  const phase5 = validatePhase5(project);
  const phase7 = validatePhase7(project);
  const phase8 = validatePhase8(project);

  const allPhaseErrors = [
    ...phase0.errors.map((e) => `[Phase 0] ${e}`),
    ...phase1.errors.map((e) => `[Phase 1] ${e}`),
    ...phase2.errors.map((e) => `[Phase 2] ${e}`),
    ...phase3.errors.map((e) => `[Phase 3] ${e}`),
    ...phase4.errors.map((e) => `[Phase 4] ${e}`),
    ...phase5.errors.map((e) => `[Phase 5] ${e}`),
    ...phase7.errors.map((e) => `[Phase 7] ${e}`),
    ...phase8.errors.map((e) => `[Phase 8] ${e}`),
  ];

  const allPhaseWarnings = [
    ...phase0.warnings.map((w) => `[Phase 0] ${w}`),
    ...phase1.warnings.map((w) => `[Phase 1] ${w}`),
    ...phase2.warnings.map((w) => `[Phase 2] ${w}`),
    ...phase3.warnings.map((w) => `[Phase 3] ${w}`),
    ...phase4.warnings.map((w) => `[Phase 4] ${w}`),
    ...phase5.warnings.map((w) => `[Phase 5] ${w}`),
    ...phase7.warnings.map((w) => `[Phase 7] ${w}`),
    ...phase8.warnings.map((w) => `[Phase 8] ${w}`),
  ];

  errors.push(...allPhaseErrors);
  warnings.push(...allPhaseWarnings);

  // Additional Phase 13 checks

  // Document versions
  if (project.documentVersions.length === 0) {
    errors.push('No document versions created.');
  } else {
    const docTypes = new Set(project.documentVersions.map((d) => d.documentType));
    if (!docTypes.has('PA')) errors.push('No PA document version.');
    if (!docTypes.has('SSD')) errors.push('No SSD document version.');
  }

  // Sample responses
  if (project.sampleResponses.length === 0) {
    errors.push('No sample responses created.');
  } else {
    for (const task of project.tasks) {
      const taskSamples = project.sampleResponses.filter((s) => s.taskId === task.id);
      if (!taskSamples.some((s) => s.style === 'formal-technical')) {
        errors.push(`Task ${task.number}: missing formal-technical sample.`);
      }
      if (!taskSamples.some((s) => s.style === 'conversational-practical')) {
        errors.push(`Task ${task.number}: missing conversational-practical sample.`);
      }
    }
  }

  // Feedback
  if (project.feedbackComments.length === 0) {
    warnings.push('No SME feedback has been processed.');
  } else {
    const unprocessed = project.feedbackComments.filter((f) => !f.verdict || !f.rationale.trim());
    if (unprocessed.length > 0) {
      errors.push(`${unprocessed.length} feedback comments not fully processed.`);
    }
  }

  // Content coverage
  const allUnits = project.ssdSections.flatMap((s) => s.lessons.flatMap((l) => l.units));
  const unitsWithoutContent = allUnits.filter((u) => !u.content || u.content.trim().length === 0);
  if (unitsWithoutContent.length > 0) {
    errors.push(`${unitsWithoutContent.length} units missing content.`);
  }

  return result(errors, warnings);
}
