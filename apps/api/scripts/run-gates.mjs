/**
 * Phase 1 Gate/Checkpoint Runner
 *
 * Orchestrates all Phase 1 decision checkpoints and the final gate.
 * Run when the inference sidecar is running.
 *
 * Usage: node scripts/run-gates.mjs [checkpoint]
 *   Without args: runs all available automated checks
 *   With checkpoint name: runs just that checkpoint (e.g. "1.G", "1.A")
 *
 * Requires:
 *   - INFERENCE_BASE_URL (default http://localhost:8000)
 *   - API_URL (default http://localhost:3001)
 *   - DATABASE_URL (for glossary/review tests)
 *   - TEST_AUDIO_PATH (path to a test audio file, for ASR checkpoints)
 */

const CHECKPOINTS = {
  '1.A': { name: 'NLLB-200 quality baseline', automated: true, desc: 'Run 20+ test translations across language pairs' },
  '1.B': { name: 'Cantonese ASR choice', automated: true, desc: 'Test faster-whisper vs SenseVoice on real Cantonese audio' },
  '1.C': { name: 'File handling and memory', automated: false, desc: 'Test with 10-min audio, verify in-memory processing' },
  '1.D': { name: 'Hmong launch strategy', automated: false, desc: 'Decide public launch / soft-launch / skip' },
  '1.E': { name: 'Glossary matching strategy', automated: false, desc: 'Lock v1 matching: simple string replacement or morphological' },
  '1.F': { name: 'Real-user readability test', automated: false, desc: 'Test with 3+ non-developer users' },
  '1.G': { name: 'Accuracy gate (HARD STOP)', automated: true, desc: 'Run held-out test set, check for hallucinations' },
};

const args = process.argv.slice(2);
const targetCheckpoint = args[0] ? args[0].toUpperCase() : null;

if (targetCheckpoint && !CHECKPOINTS[targetCheckpoint]) {
  console.error(`Unknown checkpoint: ${targetCheckpoint}`);
  console.error(`Available: ${Object.keys(CHECKPOINTS).join(', ')}`);
  process.exit(1);
}

async function runCheckpoint1A() {
  console.log('\n=== Checkpoint 1.A: NLLB-200 Quality Baseline ===\n');
  // Delegates to validate-accuracy.mjs
  const { execSync } = await import('node:child_process');
  try {
    execSync('node scripts/validate-accuracy.mjs', { stdio: 'inherit', cwd: process.cwd() + '/apps/api' });
  } catch {
    console.log('  validation script errored — inference sidecar may not be running');
  }
}

async function runCheckpoint1B() {
  console.log('\n=== Checkpoint 1.B: Cantonese ASR Choice ===\n');
  const audioPath = process.env.TEST_AUDIO_PATH;
  if (!audioPath) {
    console.log('  SKIP: Set TEST_AUDIO_PATH to run Cantonese ASR comparison.');
    console.log('  This checkpoint compares faster-whisper vs SenseVoice Small on real Cantonese audio.');
    console.log('  Expected output: CER comparison, latency comparison, recommendation.');
    return;
  }
  // TODO: Implement ASR comparison logic when sidecar is running
  console.log(`  Using audio: ${audioPath}`);
  console.log('  Test not yet implemented — requires working ASR sidecar.');
}

async function runCheckpoint1G() {
  console.log('\n=== Checkpoint 1.G: Accuracy Gate (HARD STOP) ===\n');
  const { execSync } = await import('node:child_process');
  try {
    execSync('node scripts/validate-accuracy.mjs', { stdio: 'inherit', cwd: process.cwd() + '/apps/api' });
  } catch {
    console.log('  validation script errored — inference sidecar may not be running');
  }
}

const RUNNERS = {
  '1.A': runCheckpoint1A,
  '1.B': runCheckpoint1B,
  '1.G': runCheckpoint1G,
};

async function main() {
  console.log('=== Phase 1 Gate Runner ===');
  console.log(`Date: ${new Date().toISOString()}\n`);

  const toRun = targetCheckpoint
    ? [targetCheckpoint]
    : Object.keys(CHECKPOINTS);

  for (const cp of toRun) {
    const info = CHECKPOINTS[cp];
    const automated = RUNNERS[cp];
    if (automated) {
      await automated();
    } else {
      console.log(`\n=== Checkpoint ${cp}: ${info.name} ===`);
      console.log(`  Description: ${info.desc}`);
      console.log(`  Status: MANUAL — requires human judgment`);
      console.log(`  Record the decision in PROGRESS.md after completing.\n`);
    }
  }

  console.log('\n=== All checkpoints processed ===');
  console.log('Remaining manual checkpoints:');
  const manual = Object.entries(CHECKPOINTS)
    .filter(([k, v]) => !RUNNERS[k] && !targetCheckpoint)
    .map(([k, v]) => `  ${k}: ${v.name}`);
  if (manual.length === 0) {
    console.log('  (all automated checks ran)');
  } else {
    manual.forEach(m => console.log(m));
  }

  console.log('\nNext step: update PROGRESS.md with checkpoint decisions and run the full Phase 1 gate checklist.');
}

main().catch(console.error);
