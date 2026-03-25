// ============================================================
// DOCX Document Generation Templates
// Uses the `docx` npm package to generate Word documents
// ============================================================

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  PageOrientation,
  SectionType,
  TableOfContents,
  convertInchesToTwip,
  ShadingType,
} from 'docx';
import type { Project, Task, RubricRow, SSDSection, KnowledgeCheck } from './types';
import { COGNITIVE_LEVEL_LABELS, type CognitiveLevel } from './types';

// ── Shared styles ──────────────────────────────────────────────

const FONT = 'Calibri';
const HEADING_COLOR = '1F2937';
const BODY_COLOR = '374151';
const ACCENT_COLOR = '4F46E5';
const BORDER_COLOR = 'D1D5DB';
const HEADER_BG = 'EEF2FF';

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, font: FONT, size: 32, bold: true, color: HEADING_COLOR })],
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: HEADING_COLOR })],
  });
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: ACCENT_COLOR })],
  });
}

function bodyText(text: string, bold = false): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: FONT, size: 22, color: BODY_COLOR, bold })],
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 22, color: BODY_COLOR })],
  });
}

function tableBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  };
}

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.SOLID, color: HEADER_BG },
    borders: tableBorder(),
    children: [new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text, font: FONT, size: 20, bold: true, color: HEADING_COLOR })],
    })],
  });
}

function dataCell(text: string, width?: number): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders: tableBorder(),
    children: [new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, font: FONT, size: 20, color: BODY_COLOR })],
    })],
  });
}

// ── Course Design Document ─────────────────────────────────────

export function generateCourseDesignDoc(project: Project): Document {
  const m = project.metadata;
  const children: Paragraph[] = [];

  children.push(heading1(`Course Design Document: ${m.courseCode}`));
  children.push(bodyText(`${m.courseTitle}`));
  children.push(bodyText(`School: ${m.school} | Program: ${m.program}`));
  children.push(bodyText(`Credit Units: ${m.creditUnits} | Assessment: ${m.assessmentModality}`));
  children.push(bodyText(`Date: ${new Date().toLocaleDateString()}`));

  children.push(heading2('Course Overview'));
  children.push(bodyText(m.courseDescription));
  children.push(bodyText(`Target Audience: ${m.targetAudience}`));
  children.push(bodyText(`Prerequisites: ${m.prerequisites}`));

  children.push(heading2('Development Team'));
  children.push(bulletItem(`Instructional Designer: ${m.id_name}`));
  children.push(bulletItem(`Assessment Developer: ${m.ad}`));
  children.push(bulletItem(`Subject Matter Expert: ${m.sme}`));
  children.push(bulletItem(`Instructional Technology: ${m.itx}`));

  children.push(heading2('Competencies'));

  const compTableRows = [
    new TableRow({
      children: [headerCell('Code', 15), headerCell('Statement', 45), headerCell('Level', 15), headerCell('Weight', 10), headerCell('Skills', 15)],
    }),
  ];

  for (const comp of project.competencies) {
    compTableRows.push(
      new TableRow({
        children: [
          dataCell(comp.code, 15),
          dataCell(comp.statement, 45),
          dataCell(`L${comp.cognitiveLevel}: ${COGNITIVE_LEVEL_LABELS[comp.cognitiveLevel]}`, 15),
          dataCell(`${comp.weight}%`, 10),
          dataCell(comp.skills.map((s) => s.statement).join('; '), 15),
        ],
      })
    );
  }

  children.push(
    new Paragraph({ spacing: { before: 200 }, children: [] }) // spacer
  );

  children.push(heading2('Resources'));
  children.push(bodyText(`Primary Textbook: ${m.primaryTextbook}`));
  for (const res of m.keyResources) {
    children.push(bulletItem(res));
  }

  children.push(heading2('Technology Requirements'));
  for (const tech of m.technologyRequirements) {
    children.push(bulletItem(tech));
  }

  return new Document({
    sections: [{
      children: [
        ...children,
        new Table({ rows: compTableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
      ],
    }],
  });
}

// ── Evidence Statements & LO Document ──────────────────────────

export function generateEvidenceStatementsDoc(project: Project): Document {
  const children: (Paragraph | Table)[] = [];

  children.push(heading1(`Evidence Statements & Learning Objectives`));
  children.push(bodyText(`${project.metadata.courseCode} - ${project.metadata.courseTitle}`));

  for (const comp of project.competencies) {
    children.push(heading2(`${comp.code}: ${comp.statement}`));
    children.push(bodyText(`Cognitive Level: L${comp.cognitiveLevel} - ${COGNITIVE_LEVEL_LABELS[comp.cognitiveLevel]}`));

    const esForComp = project.evidenceStatements.filter((es) => es.parentCompetencyId === comp.id);

    for (const es of esForComp) {
      children.push(heading3(`${es.code}: ${es.statement}`));
      children.push(bodyText(`Verb: ${es.verb} | Level: L${es.cognitiveLevel}`));
      children.push(bodyText('Scope In:', true));
      for (const item of es.scopeIn) children.push(bulletItem(item));
      children.push(bodyText('Scope Out:', true));
      for (const item of es.scopeOut) children.push(bulletItem(item));
      children.push(bodyText(`How Students Demonstrate: ${es.howStudentsDemonstrate}`));

      const losForES = project.learningObjectives.filter((lo) => lo.parentESId === es.id);
      children.push(bodyText('Learning Objectives:', true));
      for (const lo of losForES) {
        children.push(bulletItem(`${lo.code} [${lo.verb}]: ${lo.statement}`));
      }
    }
  }

  return new Document({ sections: [{ children }] });
}

// ── Task Model Document ────────────────────────────────────────

export function generateTaskModelDoc(project: Project): Document {
  const children: (Paragraph | Table)[] = [];

  children.push(heading1('Task Model Document'));
  children.push(bodyText(`${project.metadata.courseCode} - ${project.metadata.courseTitle}`));

  for (const task of project.tasks) {
    children.push(heading2(`Task ${task.number}: ${task.name}`));

    // Scenarios
    children.push(heading3('Scenarios'));
    for (const scenario of task.scenarios) {
      children.push(bodyText(`${scenario.name}`, true));
      children.push(bodyText(scenario.orgDescription));
      children.push(bodyText(`Target Users: ${scenario.targetUsers}`));
      children.push(bodyText('Key Challenges:', true));
      for (const challenge of scenario.keyChallenges) children.push(bulletItem(challenge));
    }

    // Task model components per ES
    children.push(heading3('Task Model Components'));

    for (const esId of task.esIds) {
      const tmc = task.taskModelComponents[esId];
      if (!tmc) continue;
      const es = project.evidenceStatements.find((e) => e.id === esId);

      const tmcRows = [
        new TableRow({ children: [headerCell('Component', 30), headerCell('Details', 70)] }),
        new TableRow({ children: [dataCell('ES Reference', 30), dataCell(es?.code ?? esId, 70)] }),
        new TableRow({ children: [dataCell('Performance Indicator', 30), dataCell(tmc.performanceIndicator, 70)] }),
        new TableRow({ children: [dataCell('Knowledge Areas', 30), dataCell(tmc.knowledgeAreas.join(', '), 70)] }),
        new TableRow({ children: [dataCell('Task Description', 30), dataCell(tmc.taskDescription, 70)] }),
        new TableRow({ children: [dataCell('Evaluation Criteria', 30), dataCell(tmc.evaluationCriteria, 70)] }),
        new TableRow({ children: [dataCell('Common Errors', 30), dataCell(tmc.commonErrors.join('; '), 70)] }),
        new TableRow({ children: [dataCell('Exemplar Response', 30), dataCell(tmc.exemplarResponse, 70)] }),
        new TableRow({ children: [dataCell('Cognitive Complexity', 30), dataCell(tmc.cognitiveComplexity, 70)] }),
      ];

      children.push(new Table({ rows: tmcRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ── PA Task Document (Student-facing) ──────────────────────────

export function generatePATaskDoc(project: Project, taskNumber: number): Document {
  const task = project.tasks.find((t) => t.number === taskNumber);
  if (!task) throw new Error(`Task ${taskNumber} not found`);

  const children: (Paragraph | Table)[] = [];

  children.push(heading1(`${project.metadata.courseCode} - Performance Assessment`));
  children.push(heading2(`Task ${task.number}: ${task.name}`));

  // Introduction
  children.push(heading3('Introduction'));
  children.push(bodyText(task.introduction));

  // Scenario reference
  if (task.scenarios.length > 0) {
    children.push(heading3('Scenario'));
    children.push(bodyText('Refer to the attached supporting documents for your chosen scenario.'));
  }

  // Requirements / Prompts
  children.push(heading3('Requirements'));
  children.push(bodyText('Your submission must address each of the following requirements. You may include submissions of the same type as separate documents or as one continuous document.'));

  function renderPrompts(prompts: typeof task.prompts, indent = 0): void {
    for (const prompt of prompts) {
      const prefix = '  '.repeat(indent);
      children.push(bodyText(`${prefix}${prompt.code}. ${prompt.text}`));
      if (prompt.subPrompts && prompt.subPrompts.length > 0) {
        renderPrompts(prompt.subPrompts, indent + 1);
      }
    }
  }
  renderPrompts(task.prompts);

  // Rubric
  children.push(heading2('Rubric'));

  const rubricRows = [
    new TableRow({
      children: [
        headerCell('Aspect', 20),
        headerCell('Not Evident', 27),
        headerCell('Approaching Competence', 27),
        headerCell('Competent', 26),
      ],
    }),
  ];

  for (const row of task.rubric) {
    rubricRows.push(
      new TableRow({
        children: [
          dataCell(`${row.promptCode}: ${row.aspect}`, 20),
          dataCell(row.notEvident, 27),
          dataCell(row.approachingCompetence, 27),
          dataCell(row.competent, 26),
        ],
      })
    );
  }

  children.push(new Table({ rows: rubricRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  // Supporting documents
  if (task.supportingDocs.length > 0) {
    children.push(heading3('Supporting Documents'));
    for (const doc of task.supportingDocs) {
      children.push(bulletItem(`${doc.name}: ${doc.description}`));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ── SSD Document (Landscape) ───────────────────────────────────

export function generateSSDDoc(project: Project): Document {
  const children: (Paragraph | Table)[] = [];

  children.push(heading1('Scope & Sequence Document'));
  children.push(bodyText(`${project.metadata.courseCode} - ${project.metadata.courseTitle}`));

  for (const section of project.ssdSections) {
    const comp = project.competencies.find((c) => c.id === section.competencyId);
    children.push(heading2(`Section: ${comp?.code ?? ''} - ${section.title}`));

    for (const lesson of section.lessons) {
      children.push(heading3(`Lesson: ${lesson.title}`));

      const unitRows = [
        new TableRow({
          children: [
            headerCell('Unit Code', 10),
            headerCell('Unit Title', 20),
            headerCell('ES/LO Alignment', 20),
            headerCell('Learning Topics', 25),
            headerCell('Learning Resources', 25),
          ],
        }),
      ];

      for (const unit of lesson.units) {
        unitRows.push(
          new TableRow({
            children: [
              dataCell(unit.code, 10),
              dataCell(unit.title, 20),
              dataCell(unit.esLoAlignment.join(', '), 20),
              dataCell(unit.topics.join(', '), 25),
              dataCell(
                unit.resources.map((r) => {
                  let desc = `[${r.type}] ${r.title}`;
                  if (r.chapters) desc += ` Ch. ${r.chapters}`;
                  if (r.pageRange) desc += ` pp. ${r.pageRange}`;
                  if (r.url) desc += ` (${r.url})`;
                  return desc;
                }).join('; '),
                25
              ),
            ],
          })
        );
      }

      children.push(new Table({ rows: unitRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }
  }

  return new Document({
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: {
            top: convertInchesToTwip(0.75),
            right: convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(0.75),
            left: convertInchesToTwip(0.75),
          },
        },
      },
      children,
    }],
  });
}

// ── Knowledge Checks Text File ─────────────────────────────────

export function generateKnowledgeChecksFile(project: Project, sectionNumber: number): string {
  const section = project.ssdSections[sectionNumber];
  if (!section) return '';

  let output = `Knowledge Checks - ${section.title}\n${'='.repeat(60)}\n\n`;

  for (const lesson of section.lessons) {
    output += `--- ${lesson.title} ---\n\n`;
    const lessonKCs = project.knowledgeChecks.filter((kc) => kc.lessonId === lesson.id);

    for (let q = 0; q < lessonKCs.length; q++) {
      const kc = lessonKCs[q];
      output += `Question ${q + 1}: [L${kc.cognitiveLevel}: ${COGNITIVE_LEVEL_LABELS[kc.cognitiveLevel]}]\n`;
      output += `ES Alignment: ${kc.esAlignment}\n`;
      output += `${kc.stem}\n\n`;

      for (let o = 0; o < kc.options.length; o++) {
        const opt = kc.options[o];
        const letter = String.fromCharCode(65 + o);
        output += `  ${letter}. ${opt.text}${opt.isCorrect ? ' *' : ''}\n`;
        output += `     Feedback: ${opt.feedback}\n\n`;
      }
      output += '\n';
    }
  }

  return output;
}

// ── Audit Report ───────────────────────────────────────────────

export function generateAuditReport(project: Project): Document {
  const children: (Paragraph | Table)[] = [];

  children.push(heading1('Cross-Document Alignment Audit Report'));
  children.push(bodyText(`${project.metadata.courseCode} - ${project.metadata.courseTitle}`));
  children.push(bodyText(`Generated: ${new Date().toLocaleString()}`));

  // Alignment chain
  children.push(heading2('Alignment Chain Verification'));

  for (const comp of project.competencies) {
    children.push(heading3(`${comp.code}: ${comp.statement}`));

    const esForComp = project.evidenceStatements.filter((es) => es.parentCompetencyId === comp.id);
    children.push(bodyText(`Evidence Statements: ${esForComp.length}`, true));

    for (const es of esForComp) {
      const losForES = project.learningObjectives.filter((lo) => lo.parentESId === es.id);
      const tasksCovering = project.tasks.filter((t) => t.esIds.includes(es.id));
      const promptsCovering = tasksCovering.flatMap((t) =>
        t.prompts.filter((p) => p.mappedESIds.includes(es.id))
      );
      const rubricCovering = tasksCovering.flatMap((t) =>
        t.rubric.filter((r) => promptsCovering.some((p) => p.code === r.promptCode))
      );

      const chainRows = [
        new TableRow({ children: [headerCell('Element', 20), headerCell('Count', 10), headerCell('Status', 15), headerCell('Details', 55)] }),
        new TableRow({ children: [
          dataCell('Learning Objectives', 20),
          dataCell(String(losForES.length), 10),
          dataCell(losForES.length >= 2 ? 'OK' : 'MISSING', 15),
          dataCell(losForES.map((lo) => lo.code).join(', '), 55),
        ]}),
        new TableRow({ children: [
          dataCell('Task Assignments', 20),
          dataCell(String(tasksCovering.length), 10),
          dataCell(tasksCovering.length >= 1 ? 'OK' : 'MISSING', 15),
          dataCell(tasksCovering.map((t) => `Task ${t.number}`).join(', '), 55),
        ]}),
        new TableRow({ children: [
          dataCell('Prompt Mappings', 20),
          dataCell(String(promptsCovering.length), 10),
          dataCell(promptsCovering.length >= 1 ? 'OK' : 'MISSING', 15),
          dataCell(promptsCovering.map((p) => p.code).join(', '), 55),
        ]}),
        new TableRow({ children: [
          dataCell('Rubric Rows', 20),
          dataCell(String(rubricCovering.length), 10),
          dataCell(rubricCovering.length >= 1 ? 'OK' : 'MISSING', 15),
          dataCell(rubricCovering.map((r) => r.promptCode).join(', '), 55),
        ]}),
      ];

      children.push(bodyText(`${es.code}: ${es.statement}`));
      children.push(new Table({ rows: chainRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      children.push(new Paragraph({ spacing: { after: 150 }, children: [] }));
    }
  }

  // SSD Coverage
  children.push(heading2('SSD Coverage Summary'));
  const allUnits = project.ssdSections.flatMap((s) => s.lessons.flatMap((l) => l.units));
  const unitsWithResources = allUnits.filter((u) => u.resources.length > 0);
  const unitsWithContent = allUnits.filter((u) => u.content && u.content.trim().length > 0);

  const coverageRows = [
    new TableRow({ children: [headerCell('Metric', 50), headerCell('Value', 25), headerCell('Status', 25)] }),
    new TableRow({ children: [dataCell('Total Units', 50), dataCell(String(allUnits.length), 25), dataCell(allUnits.length > 0 ? 'OK' : 'MISSING', 25)] }),
    new TableRow({ children: [dataCell('Units with Resources', 50), dataCell(`${unitsWithResources.length}/${allUnits.length}`, 25), dataCell(unitsWithResources.length === allUnits.length ? 'OK' : 'PARTIAL', 25)] }),
    new TableRow({ children: [dataCell('Units with Content', 50), dataCell(`${unitsWithContent.length}/${allUnits.length}`, 25), dataCell(unitsWithContent.length === allUnits.length ? 'OK' : 'PARTIAL', 25)] }),
  ];

  children.push(new Table({ rows: coverageRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  // KC Summary
  children.push(heading2('Knowledge Check Summary'));
  const allLessons = project.ssdSections.flatMap((s) => s.lessons);
  children.push(bodyText(`Total Lessons: ${allLessons.length}`));
  children.push(bodyText(`Total Knowledge Checks: ${project.knowledgeChecks.length}`));
  children.push(bodyText(`Average KCs per Lesson: ${allLessons.length > 0 ? (project.knowledgeChecks.length / allLessons.length).toFixed(1) : 0}`));

  // Sample Response Summary
  children.push(heading2('Sample Response Summary'));
  for (const task of project.tasks) {
    const taskSamples = project.sampleResponses.filter((s) => s.taskId === task.id);
    const formal = taskSamples.find((s) => s.style === 'formal-technical');
    const conv = taskSamples.find((s) => s.style === 'conversational-practical');
    children.push(bodyText(`Task ${task.number}: ${formal ? 'Formal' : 'MISSING'} | ${conv ? 'Conversational' : 'MISSING'}`));
  }

  return new Document({ sections: [{ children }] });
}
