import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SemesterFileSchema } from '../src/core/schema';
import type { Day, SemesterFile, Slot } from '../src/core/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to normalize strings for component matching
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parsePeriodRange(rangeStr: string): number[] {
  const clean = rangeStr.trim();
  if (clean.includes('-')) {
    const [startStr, endStr] = clean.split('-').map((s) => s.trim());
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (isNaN(start) || isNaN(end) || start > end) {
      throw new Error(`Invalid period range: "${rangeStr}"`);
    }
    const periods: number[] = [];
    for (let p = start; p <= end; p++) {
      periods.push(p);
    }
    return periods;
  }

  const p = parseInt(clean, 10);
  if (isNaN(p)) {
    throw new Error(`Invalid period number: "${rangeStr}"`);
  }
  return [p];
}

export function parsePasteLines(
  lines: string[],
  semester: SemesterFile
): { slots: Slot[]; unmatched: string[] } {
  const validDays = new Set<Day>(semester.days);
  const componentNormalizedMap = new Map<string, string>();

  for (const c of semester.components) {
    componentNormalizedMap.set(normalize(c.id), c.id);
    componentNormalizedMap.set(normalize(c.code), c.id);

    if (c.kind === 'theory') {
      componentNormalizedMap.set(normalize(`${c.subjectName} Theory`), c.id);
      componentNormalizedMap.set(normalize(`${c.subjectName} Th`), c.id);
      componentNormalizedMap.set(normalize(`${c.code} Th`), c.id);
      // User rule: if it says nothing or Th, then it is theory
      componentNormalizedMap.set(normalize(c.subjectName), c.id);
    } else if (c.kind === 'practical') {
      componentNormalizedMap.set(normalize(`${c.subjectName} Lab`), c.id);
      componentNormalizedMap.set(normalize(`${c.subjectName} Practical`), c.id);
      componentNormalizedMap.set(normalize(`${c.subjectName} Pr`), c.id);
      componentNormalizedMap.set(normalize(`${c.code} Lab`), c.id);
      componentNormalizedMap.set(normalize(`${c.code} Pr`), c.id);
    } else {
      componentNormalizedMap.set(normalize(c.subjectName), c.id);
    }
  }

  // Common university abbreviations & aliases
  componentNormalizedMap.set('webeng', 'web-eng-theory');
  componentNormalizedMap.set('webenglab', 'web-eng-lab');
  componentNormalizedMap.set('webtec', 'web-eng-theory');
  componentNormalizedMap.set('webteclab', 'web-eng-lab');
  componentNormalizedMap.set('webtecth', 'web-eng-theory');
  componentNormalizedMap.set('webtecpr', 'web-eng-lab');
  componentNormalizedMap.set('comnetpr', 'comp-net-lab');
  componentNormalizedMap.set('comnetth', 'comp-net-theory');
  componentNormalizedMap.set('techwrite', 'tech-writing');
  componentNormalizedMap.set('techwri', 'tech-writing');
  componentNormalizedMap.set('ccst', 'compiler-const');
  componentNormalizedMap.set('compconst', 'compiler-const');

  const slots: Slot[] = [];
  const unmatched: string[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx].trim();
    if (!rawLine || rawLine.startsWith('#')) continue;

    // Line format: Day, period or range, Subject component, Teacher
    const parts = rawLine.split(',').map((p) => p.trim());
    if (parts.length < 3) {
      unmatched.push(`Line ${idx + 1}: Insufficient comma-separated fields: "${rawLine}"`);
      continue;
    }

    const dayStr = parts[0] as Day;
    const periodStr = parts[1];
    const compNameStr = parts[2];
    let teacher = parts[3] ? parts[3].replace(/_/g, ' ') : 'TBA';
    if (!teacher.trim()) teacher = 'TBA';

    if (!validDays.has(dayStr)) {
      unmatched.push(`Line ${idx + 1}: Invalid day "${dayStr}"`);
      continue;
    }

    let periods: number[];
    try {
      periods = parsePeriodRange(periodStr);
    } catch (err) {
      unmatched.push(`Line ${idx + 1}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    const matchedComponentId = componentNormalizedMap.get(normalize(compNameStr));
    if (!matchedComponentId) {
      unmatched.push(`Line ${idx + 1}: Unmatched component "${compNameStr}"`);
      continue;
    }

    slots.push({
      day: dayStr,
      periods,
      componentId: matchedComponentId,
      teacher,
    });
  }

  return { slots, unmatched };
}

function runCli() {
  const args = process.argv.slice(2);
  const semIdx = args.indexOf('--semester');
  const secIdx = args.indexOf('--section');

  if (semIdx === -1 || secIdx === -1 || !args[semIdx + 1] || !args[secIdx + 1]) {
    console.error('Usage: tsx scripts/import-paste.ts --semester <id> --section <sectionId> [file.txt]');
    console.error('Example: tsx scripts/import-paste.ts --semester 5 --section A input.txt');
    process.exit(1);
  }

  const semesterId = args[semIdx + 1];
  const sectionId = args[secIdx + 1];
  const inputFilePath = args[secIdx + 2];

  const semFilePath = path.join(projectRoot, 'public', 'data', `semester-${semesterId}.json`);
  if (!fs.existsSync(semFilePath)) {
    console.error(`❌ Semester file not found: ${semFilePath}`);
    process.exit(1);
  }

  const semester: SemesterFile = JSON.parse(fs.readFileSync(semFilePath, 'utf-8'));

  let content = '';
  if (inputFilePath && fs.existsSync(inputFilePath)) {
    content = fs.readFileSync(inputFilePath, 'utf-8');
  } else {
    // Read from standard input synchronously
    try {
      content = fs.readFileSync(0, 'utf-8');
    } catch (_err) {
      console.error('❌ Could not read input data from stdin or file.');
      process.exit(1);
    }
  }

  const lines = content.split('\n');
  const { slots, unmatched } = parsePasteLines(lines, semester);

  if (unmatched.length > 0) {
    console.warn('⚠️ Warning: Encountered parsing issues:');
    unmatched.forEach((u) => console.warn(`  - ${u}`));
  }

  if (slots.length === 0) {
    console.error('❌ No valid slots parsed. Aborting.');
    process.exit(1);
  }

  // Find or create section
  let targetSection = semester.sections.find((s) => s.id === sectionId);
  if (!targetSection) {
    targetSection = {
      id: sectionId,
      name: `Section ${sectionId}`,
      slots: [],
    };
    semester.sections.push(targetSection);
  }

  // Replace section slots with imported slots
  targetSection.slots = slots;

  // Bump dataVersion
  const dateStr = new Date().toISOString().split('T')[0];
  semester.dataVersion = `${dateStr}.${Date.now().toString().slice(-4)}`;

  // Validate entire semester file before writing
  const validation = SemesterFileSchema.safeParse(semester);
  if (!validation.success) {
    console.error('❌ Resulting semester file failed Zod schema validation:');
    validation.error.issues.forEach((iss) => console.error(`  - ${iss.path.join('.')}: ${iss.message}`));
    process.exit(1);
  }

  fs.writeFileSync(semFilePath, JSON.stringify(semester, null, 2), 'utf-8');
  console.log(`✅ Successfully imported ${slots.length} slots into Section ${sectionId} of Semester ${semesterId}!`);
}

// Only execute CLI if executed directly
if (process.argv[1] && process.argv[1].endsWith('import-paste.ts')) {
  runCli();
}
