import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ManifestSchema, SemesterFileSchema } from '../src/core/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'public', 'data');

function runValidation() {
  console.log('🔍 Validating timetable data files in:', dataDir);

  const manifestPath = path.join(dataDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Missing manifest file: ${manifestPath}`);
    process.exit(1);
  }

  let manifestData: unknown;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    manifestData = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed to parse manifest.json:`, err);
    process.exit(1);
  }

  const manifestResult = ManifestSchema.safeParse(manifestData);
  if (!manifestResult.success) {
    console.error(`❌ Manifest validation failed:`);
    for (const issue of manifestResult.error.issues) {
      console.error(`  - [${issue.path.join('.')}] ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(`✅ manifest.json is valid (dataVersion: ${manifestResult.data.dataVersion})`);

  let totalErrors = 0;

  for (const sem of manifestResult.data.semesters) {
    const semRelativePath = sem.file.startsWith('/') ? sem.file.slice(1) : sem.file;
    const semFilePath = path.join(projectRoot, 'public', semRelativePath);

    console.log(`\nValidating ${sem.label} (${semFilePath})...`);

    if (!fs.existsSync(semFilePath)) {
      console.error(`❌ Semester file not found: ${semFilePath}`);
      totalErrors++;
      continue;
    }

    let semJson: unknown;
    try {
      const raw = fs.readFileSync(semFilePath, 'utf-8');
      semJson = JSON.parse(raw);
    } catch (err) {
      console.error(`❌ Failed to parse ${semFilePath}:`, err);
      totalErrors++;
      continue;
    }

    const semResult = SemesterFileSchema.safeParse(semJson);
    if (!semResult.success) {
      console.error(`❌ Validation failed for ${sem.label}:`);
      for (const issue of semResult.error.issues) {
        console.error(`  - Path: ${issue.path.join('.')} => ${issue.message}`);
      }
      totalErrors++;
    } else {
      const val = semResult.data;
      console.log(
        `✅ ${sem.label} is valid (${val.sections.length} sections, ${val.components.length} components, ${val.periods.length} periods)`
      );
    }
  }

  if (totalErrors > 0) {
    console.error(`\n❌ Data validation failed with ${totalErrors} error(s).`);
    process.exit(1);
  } else {
    console.log(`\n✨ All timetable data files validated successfully!`);
    process.exit(0);
  }
}

runValidation();
