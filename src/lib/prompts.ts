// ============================================================
// Claude API System Prompts for Each Phase
// Returns structured JSON matching the app's data model
// ============================================================

import type {
  ProjectMetadata,
  Competency,
  EvidenceStatement,
  LearningObjective,
  Task,
  Scenario,
  PAPrompt,
  RubricRow,
  TaskModelComponent,
  SSDSection,
  SSDLesson,
  SSDUnit,
  KnowledgeCheck,
  SampleResponse,
  CognitiveLevel,
} from './types';

// ── Shared system context ──────────────────────────────────────

const SYSTEM_CONTEXT = `You are a CBE (Competency-Based Education) course development assistant following a strict 13-phase methodology.
You produce content for WGU-style performance assessments.
All output must be valid JSON matching the specified TypeScript interfaces.
Follow Bloom's taxonomy cognitive levels: 1=Remember, 2=Understand, 3=Apply, 4=Analyze, 5=Evaluate, 6=Create.
Evidence Statements must use action verbs at or BELOW the competency's cognitive level ceiling.
Every piece of generated content must be traceable back through the alignment chain: Competency > ES > LO > Task > Prompt > Rubric.`;

// ── Helper: serialize data for context ─────────────────────────

function serializeCompetencies(competencies: Competency[]): string {
  return competencies.map((c) =>
    `${c.code} (L${c.cognitiveLevel}, ${c.weight}%): ${c.statement}\n  Skills: ${c.skills.map((s) => `${s.code}: ${s.statement}`).join('; ')}\n  Scope: ${c.scopeNotes}`
  ).join('\n\n');
}

function serializeES(es: EvidenceStatement[]): string {
  return es.map((e) =>
    `${e.code} [${e.verb}, L${e.cognitiveLevel}] -> ${e.parentCompetencyId}\n  "${e.statement}"\n  Scope In: ${e.scopeIn.join(', ')}\n  Scope Out: ${e.scopeOut.join(', ')}`
  ).join('\n\n');
}

function serializeLOs(los: LearningObjective[]): string {
  return los.map((lo) => `${lo.code} [${lo.verb}] -> ES ${lo.parentESId}: ${lo.statement}`).join('\n');
}

function serializeTasks(tasks: Task[]): string {
  return tasks.map((t) =>
    `Task ${t.number}: "${t.name}"\n  Competencies: ${t.competencyIds.join(', ')}\n  ES: ${t.esIds.join(', ')}\n  Prompts: ${t.prompts.map((p) => p.code).join(', ')}`
  ).join('\n\n');
}

function serializeScenarios(scenarios: Scenario[]): string {
  return scenarios.map((s) =>
    `"${s.name}": ${s.orgDescription}\n  Users: ${s.targetUsers}\n  Challenges: ${s.keyChallenges.join(', ')}`
  ).join('\n\n');
}

function serializeSSD(sections: SSDSection[]): string {
  return sections.map((s) =>
    `Section: ${s.title}\n${s.lessons.map((l) =>
      `  Lesson: ${l.title}\n${l.units.map((u) =>
        `    Unit ${u.code}: ${u.title} [${u.esLoAlignment.join(', ')}] Topics: ${u.topics.join(', ')}`
      ).join('\n')}`
    ).join('\n')}`
  ).join('\n\n');
}

// ── Phase 1: Course Design ─────────────────────────────────────

export function getPhase1Prompt(
  metadata: ProjectMetadata,
  competencies: Competency[]
): string {
  return `${SYSTEM_CONTEXT}

PHASE 1: COURSE DESIGN REVIEW

You are reviewing the initial course design for:
Course: ${metadata.courseCode} - ${metadata.courseTitle}
School: ${metadata.school} | Program: ${metadata.program}
Credit Units: ${metadata.creditUnits}
Assessment Modality: ${metadata.assessmentModality}
Target Audience: ${metadata.targetAudience}
Description: ${metadata.courseDescription}
Primary Textbook: ${metadata.primaryTextbook}
Certification Alignment: ${metadata.certificationAlignment}

COMPETENCIES:
${serializeCompetencies(competencies)}

TASK: Generate a course design review analysis. Return JSON matching this interface:
{
  "designReview": {
    "overallAssessment": string,
    "competencyAnalysis": { "code": string, "alignment": string, "concerns": string[] }[],
    "suggestedModifications": string[],
    "resourceGaps": string[],
    "taxonomyNotes": string[]
  }
}

Rules:
- Verify competency weights sum to 100%
- Check cognitive level appropriateness for the domain
- Identify any scope overlaps or gaps between competencies
- Flag if any competency levels seem too high or low for the target audience
- Note any missing prerequisite knowledge areas`;
}

// ── Phase 2: Evidence Statements & Learning Objectives ─────────

export function getPhase2Prompt(
  metadata: ProjectMetadata,
  competencies: Competency[],
  courseDesign: string
): string {
  return `${SYSTEM_CONTEXT}

PHASE 2: EVIDENCE STATEMENTS & LEARNING OBJECTIVES

Course: ${metadata.courseCode} - ${metadata.courseTitle}

COMPETENCIES:
${serializeCompetencies(competencies)}

COURSE DESIGN NOTES:
${courseDesign}

TASK: Generate 4 Evidence Statements per competency and 2 Learning Objectives per ES.

Return JSON matching this interface:
{
  "evidenceStatements": [
    {
      "id": string (UUID),
      "code": string (e.g., "ES1.1"),
      "verb": string (Bloom's action verb),
      "cognitiveLevel": number (1-6),
      "statement": string,
      "scopeIn": string[],
      "scopeOut": string[],
      "learningTopics": [{ "id": string, "title": string, "description": string }],
      "parentCompetencyId": string,
      "howStudentsDemonstrate": string
    }
  ],
  "learningObjectives": [
    {
      "id": string (UUID),
      "code": string (e.g., "LO1.1.1"),
      "verb": string,
      "statement": string,
      "parentESId": string
    }
  ]
}

RULES:
- EXACTLY 4 ES per competency
- EXACTLY 2 LO per ES
- ES verb cognitive level MUST be at or BELOW the parent competency's level (verb ceiling rule)
- Each ES must have clear scope-in and scope-out boundaries
- ES statements must be observable and measurable
- LOs must be more specific/granular than the parent ES
- Use only approved Bloom's verbs for each level
- Each ES must describe HOW students demonstrate the evidence
- Learning topics should be specific enough to map to SSD units later`;
}

// ── Phase 3: Task Architecture ─────────────────────────────────

export function getPhase3Prompt(
  competencies: Competency[],
  es: EvidenceStatement[]
): string {
  return `${SYSTEM_CONTEXT}

PHASE 3: TASK ARCHITECTURE / TASK SPLITTING

COMPETENCIES:
${serializeCompetencies(competencies)}

EVIDENCE STATEMENTS:
${serializeES(es)}

TASK: Recommend how to split the assessment into tasks. Return JSON:
{
  "recommendation": {
    "taskCount": number,
    "rationale": string,
    "tasks": [
      {
        "number": number,
        "name": string,
        "competencyIds": string[],
        "esIds": string[],
        "rationale": string
      }
    ],
    "warnings": string[]
  }
}

RULES:
- Do NOT split a single competency's ES across multiple tasks (keep ES from one competency together)
- Each task should be completable in a reasonable timeframe
- Balance the cognitive load across tasks
- Consider natural groupings of competencies
- 1-3 tasks is typical for most courses
- Each task must have at least 2 ES to justify a separate task
- Provide warnings if any split seems problematic`;
}

// ── Phase 4: Task Models & Scenarios ───────────────────────────

export function getPhase4Prompt(
  tasks: Task[],
  es: EvidenceStatement[],
  scenarios: Scenario[]
): string {
  return `${SYSTEM_CONTEXT}

PHASE 4: TASK MODELS & SCENARIOS

TASKS:
${serializeTasks(tasks)}

EVIDENCE STATEMENTS:
${serializeES(es)}

EXISTING SCENARIOS:
${serializeScenarios(scenarios)}

TASK: Generate 7 task model components per ES and at least 5 scenarios per task. Return JSON:
{
  "taskModels": {
    "[taskId]": {
      "[esId]": {
        "performanceIndicator": string,
        "knowledgeAreas": string[],
        "taskDescription": string,
        "evaluationCriteria": string,
        "commonErrors": string[],
        "exemplarResponse": string,
        "cognitiveComplexity": string
      }
    }
  },
  "scenarios": {
    "[taskId]": [
      {
        "id": string (UUID),
        "name": string,
        "orgDescription": string (3+ sentences about fictional org),
        "targetUsers": string,
        "keyChallenges": string[],
        "domainData": string (realistic data/metrics for the scenario)
      }
    ]
  }
}

RULES:
- 7 components per ES: performanceIndicator, knowledgeAreas, taskDescription, evaluationCriteria, commonErrors, exemplarResponse, cognitiveComplexity
- At least 5 scenarios per task - all using fictional organizations and names
- Scenarios must be realistic and detailed enough for students to use
- Include specific data points and metrics in each scenario
- Common errors should reflect real mistakes students make
- Exemplar responses should demonstrate competent-level work`;
}

// ── Phase 5: PA Prompts & Rubrics ──────────────────────────────

export function getPhase5Prompt(
  tasks: Task[],
  taskModel: Record<string, Record<string, TaskModelComponent>>,
  es: EvidenceStatement[]
): string {
  return `${SYSTEM_CONTEXT}

PHASE 5: PA PROMPTS & RUBRICS (WGU Mega-Prompt Format)

TASKS:
${serializeTasks(tasks)}

EVIDENCE STATEMENTS:
${serializeES(es)}

TASK MODEL COMPONENTS:
${JSON.stringify(taskModel, null, 2)}

TASK: Generate PA prompts and rubric for each task. Return JSON:
{
  "tasks": [
    {
      "taskId": string,
      "introduction": string (2-3 paragraphs setting up the assessment context),
      "prompts": [
        {
          "id": string (UUID),
          "code": string (A, A1, A2, B, B1, etc.),
          "text": string (the prompt instruction to students),
          "mappedESIds": string[],
          "subPrompts": [same structure, recursive]
        }
      ],
      "rubric": [
        {
          "promptCode": string,
          "aspect": string,
          "notEvident": string (standard C/D language from Appendix A),
          "approachingCompetence": string,
          "competent": string
        }
      ]
    }
  ]
}

RULES:
- Use hierarchical prompt codes: A, A1, A2, B, B1, B2, etc.
- Each ES must be covered by at least one prompt
- Rubric must have rows for each prompt code
- "Not Evident" language should follow standard patterns: "The [deliverable] does not provide..."
- "Approaching Competence" language: "The [deliverable] provides [partial element] but..."
- "Competent" language: "The [deliverable] provides [complete element] that..."
- Prompts should be clear, specific, and actionable
- Include page length or word count guidance where appropriate
- Reference the scenario in the introduction text`;
}

// ── Phase 6: Supporting Documents ──────────────────────────────

export function getPhase6Prompt(
  tasks: Task[],
  scenarios: Scenario[]
): string {
  return `${SYSTEM_CONTEXT}

PHASE 6: SUPPORTING DOCUMENTS

TASKS:
${serializeTasks(tasks)}

SCENARIOS:
${serializeScenarios(scenarios)}

TASK: Generate supporting documents for each task. Return JSON:
{
  "documents": [
    {
      "taskId": string,
      "title": string,
      "type": "case-study" | "template" | "starter-file" | "technical-reference" | "scenario-profile",
      "description": string,
      "content": string (full document text)
    }
  ]
}

RULES FOR CASE STUDIES:
- Minimum 2 pages of narrative content (800+ words)
- Use FICTIONAL company names and character names
- Include MORE detail than strictly needed so students must discern relevant info
- Include organizational context, stakeholder perspectives, data/metrics
- Write in professional business narrative style
- Include at least one data table or structured dataset

RULES FOR OTHER DOC TYPES:
- Templates: provide empty structure with field labels and instructions
- Starter files: provide partially completed work for students to build on
- Technical references: include accurate domain-specific reference material
- Scenario profiles: detailed organization/stakeholder descriptions`;
}

// ── Phase 7: SSD Structure ─────────────────────────────────────

export function getPhase7Prompt(
  competencies: Competency[],
  es: EvidenceStatement[],
  los: LearningObjective[]
): string {
  return `${SYSTEM_CONTEXT}

PHASE 7: SCOPE & SEQUENCE DOCUMENT (SSD) STRUCTURE

COMPETENCIES:
${serializeCompetencies(competencies)}

EVIDENCE STATEMENTS:
${serializeES(es)}

LEARNING OBJECTIVES:
${serializeLOs(los)}

TASK: Generate the SSD hierarchy. Return JSON:
{
  "sections": [
    {
      "id": string (UUID),
      "competencyId": string,
      "title": string (competency statement),
      "lessons": [
        {
          "id": string (UUID),
          "title": string,
          "units": [
            {
              "id": string (UUID),
              "code": string (e.g., "U1.1.1"),
              "title": string,
              "esLoAlignment": string[] (ES and LO codes this unit covers),
              "topics": string[],
              "resources": [
                {
                  "id": string (UUID),
                  "title": string,
                  "type": "textbook" | "tutorial" | "documentation" | "video" | "interactive",
                  "url": string (optional),
                  "chapters": string (optional),
                  "pageRange": string (optional)
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

RULES:
- Section = Competency (one section per competency)
- Lesson = Grouped ES (group related ES into lessons)
- Unit = Individual topic (each unit covers specific learning topics)
- Every ES and LO must be covered by at least one unit
- Units should have at least one resource
- Use a mix of resource types (textbook, tutorial, video, etc.)
- Unit codes follow hierarchical pattern: Section.Lesson.Unit`;
}

// ── Phase 8: Knowledge Checks ──────────────────────────────────

export function getPhase8Prompt(
  ssd: SSDSection[],
  es: EvidenceStatement[],
  los: LearningObjective[]
): string {
  return `${SYSTEM_CONTEXT}

PHASE 8: KNOWLEDGE CHECKS

SSD STRUCTURE:
${serializeSSD(ssd)}

EVIDENCE STATEMENTS:
${serializeES(es)}

LEARNING OBJECTIVES:
${serializeLOs(los)}

TASK: Generate 4 knowledge check questions per lesson. Return JSON:
{
  "knowledgeChecks": [
    {
      "id": string (UUID),
      "lessonId": string,
      "stem": string (the question),
      "cognitiveLevel": number (1-6),
      "options": [
        {
          "text": string,
          "isCorrect": boolean,
          "feedback": string
        }
      ],
      "esAlignment": string (ES code this KC aligns to)
    }
  ]
}

RULES:
- EXACTLY 4 questions per lesson
- EXACTLY 4 options per question
- EXACTLY 1 correct answer per question
- Correct answer feedback MUST start with "Correct!" then explain why
- Wrong answer feedback MUST explain why the option is incorrect and guide toward correct understanding
- Mix cognitive levels across questions (don't make all L1 recall)
- Questions should align to specific ES within the lesson scope
- Avoid "all of the above" or "none of the above" options
- Distractors should be plausible but clearly distinguishable
- Question stems should be clear and unambiguous`;
}

// ── Phase 9: Course Content ────────────────────────────────────

export function getPhase9Prompt(
  ssd: SSDSection[],
  es: EvidenceStatement[]
): string {
  return `${SYSTEM_CONTEXT}

PHASE 9: UNIT CONTENT GENERATION

SSD STRUCTURE:
${serializeSSD(ssd)}

EVIDENCE STATEMENTS:
${serializeES(es)}

TASK: Generate ~500 words of content per unit. Return JSON:
{
  "unitContents": [
    {
      "unitId": string,
      "content": string (full unit content, ~500 words)
    }
  ]
}

RULES:
- Each unit's content must include ALL of these elements:
  1. Opening paragraph introducing the topic and its relevance
  2. Core concepts explanation with clear definitions
  3. [Figure: description] bracket for at least one visual (include hex colors for AI image gen)
  4. Practical example showing real-world application
  5. Assessment connection explaining how this topic relates to the PA
  6. Resources table referencing the unit's assigned resources

- Target ~500 words per unit (400-600 acceptable range)
- Write at an appropriate level for the target audience
- Use clear headings and structure
- Include domain-specific terminology with definitions
- Figure descriptions should be detailed enough for AI image generation, including:
  - Exact hex color codes for all visual elements
  - Layout and positioning descriptions
  - Labels and text content
  - Dimensions and resolution`;
}

// ── Phase 10: Sample Responses ─────────────────────────────────

export function getPhase10Prompt(
  tasks: Task[],
  rubric: RubricRow[],
  scenarios: Scenario[]
): string {
  return `${SYSTEM_CONTEXT}

PHASE 10: SAMPLE RESPONSES

TASKS:
${serializeTasks(tasks)}

RUBRIC:
${rubric.map((r) => `${r.promptCode}: Competent = "${r.competent}"`).join('\n')}

SCENARIOS:
${serializeScenarios(scenarios)}

TASK: Generate 2 sample responses per task at Competent level. Return JSON:
{
  "sampleResponses": [
    {
      "id": string (UUID),
      "taskId": string,
      "scenarioId": string,
      "style": "formal-technical" | "conversational-practical",
      "sections": [
        {
          "promptCode": string (A, A1, B, etc.),
          "content": string
        }
      ],
      "citations": string[]
    }
  ]
}

RULES:
- EXACTLY 2 samples per task
- Sample 1: formal-technical style (academic tone, structured, heavy on terminology)
- Sample 2: conversational-practical style (accessible tone, practical examples, applied focus)
- DIFFERENTIATION REQUIREMENTS:
  - Different scenarios for each sample
  - Different writing styles (as specified above)
  - Different approaches to problem-solving
  - Different perspectives or analytical lenses
  - Different organizational structures
- Each sample must follow the prompt code structure (A, A1, B, etc.)
- Content must meet ALL rubric "Competent" criteria
- Include [Screenshot: description] placeholders where visual evidence would appear
- Each section should clearly address the specific prompt requirements
- Include proper citations using APA or course-specified format`;
}
