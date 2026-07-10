/**
 * Accuracy validation script for Phase 1 gate.
 *
 * Run: DATABASE_URL=... node scripts/validate-accuracy.mjs
 *
 * This sends test translation pairs through the full pipeline
 * and outputs a report with pass/fail per pair, glossary accuracy,
 * and confidence calibration metrics.
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

const TEST_SET = [
  // English -> Spanish
  { sourceLang: 'eng_Latn', targetLang: 'spa_Latn', domain: 'medical', source: 'The patient has high blood pressure.', expected: 'El paciente tiene presión arterial alta.' },
  { sourceLang: 'eng_Latn', targetLang: 'spa_Latn', domain: 'general', source: 'Hello, how are you today?', expected: 'Hola, ¿cómo estás hoy?' },
  { sourceLang: 'eng_Latn', targetLang: 'spa_Latn', domain: 'education', source: 'The school will reopen on Monday.', expected: 'La escuela reabrirá el lunes.' },
  // English -> Tagalog
  { sourceLang: 'eng_Latn', targetLang: 'tgl_Latn', domain: 'general', source: 'Where is the hospital?', expected: 'Nasaan ang ospital?' },
  { sourceLang: 'eng_Latn', targetLang: 'tgl_Latn', domain: 'civic', source: 'Your voting precinct is located at the community center.', expected: 'Ang iyong presinto ng pagboto ay matatagpuan sa sentro ng komunidad.' },
  // English -> Cantonese
  { sourceLang: 'eng_Latn', targetLang: 'yue_Hant', domain: 'general', source: 'Thank you very much.', expected: '多謝晒。' },
  { sourceLang: 'eng_Latn', targetLang: 'yue_Hant', domain: 'medical', source: 'Take this medication twice a day.', expected: '每日食兩次呢隻藥。' },
  // English -> Hmong
  { sourceLang: 'eng_Latn', targetLang: 'hmn_Latn', domain: 'medical', source: 'Drink plenty of water.', expected: 'Haus dej ntau.' },
  { sourceLang: 'eng_Latn', targetLang: 'hmn_Latn', domain: 'education', source: 'The child needs to enroll in school.', expected: 'Tus me nyuam yuav tsum tau mus kawm ntawv.' },
];

const ORG_ID = process.env.TEST_ORG_ID || '';

async function runTest(pair) {
  const url = `${API_URL}/api/translate`;
  const body = {
    text: pair.source,
    sourceLang: pair.sourceLang,
    targetLang: pair.targetLang,
    domain: pair.domain,
    ...(ORG_ID ? { orgId: ORG_ID } : {}),
  };

  const start = Date.now();
  let response, data;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    data = await response.json();
  } catch (err) {
    return { ...pair, status: 'error', error: err.message, latencyMs: Date.now() - start };
  }

  if (data.status !== 'ok') {
    return { ...pair, status: 'error', error: data.message || 'Unknown API error', latencyMs: Date.now() - start };
  }

  const result = data.data;
  const isExact = result.translation === pair.expected;
  const overlap = wordOverlap(result.translation, pair.expected);

  return {
    ...pair,
    status: isExact ? 'pass' : 'partial',
    got: result.translation,
    exact: isExact,
    wordOverlap: overlap,
    confidence: result.confidence,
    needsReview: result.needsReview,
    modelUsed: result.modelUsed,
    overrideCount: result.glossaryOverrides?.length || 0,
    latencyMs: Date.now() - start,
  };
}

function wordOverlap(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let common = 0;
  for (const w of wordsA) if (wordsB.has(w)) common++;
  return common / Math.max(wordsA.size, wordsB.size);
}

async function main() {
  console.log('=== Vernacular Accuracy Validation ===\n');
  console.log(`API: ${API_URL}`);
  console.log(`Test pairs: ${TEST_SET.length}\n`);

  const results = [];
  let passed = 0;
  let partial = 0;
  let errors = 0;

  for (const pair of TEST_SET) {
    const result = await runTest(pair);
    results.push(result);

    const icon = result.status === 'pass' ? '✓' : result.status === 'partial' ? '~' : '✗';
    console.log(`${icon} [${result.sourceLang}→${result.targetLang}] (${result.domain})`);
    console.log(`   Source: ${result.source}`);
    console.log(`   Expected: ${result.expected}`);
    if (result.got) console.log(`   Got: ${result.got}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.wordOverlap !== undefined) console.log(`   Word overlap: ${Math.round(result.wordOverlap * 100)}%`);
    if (result.latencyMs) console.log(`   Latency: ${result.latencyMs}ms`);
    if (result.overrideCount > 0) console.log(`   Glossary overrides: ${result.overrideCount}`);
    console.log('');

    if (result.status === 'pass') passed++;
    else if (result.status === 'partial') partial++;
    else errors++;
  }

  // Summary
  console.log('=== Summary ===');
  console.log(`Total: ${results.length} | Pass: ${passed} | Partial: ${partial} | Errors: ${errors}`);
  const exactRate = passed / results.length;
  const avgLatency = results.filter(r => r.latencyMs).reduce((s, r) => s + r.latencyMs, 0) / results.length;
  console.log(`Exact match rate: ${Math.round(exactRate * 100)}%`);
  const avgOverlap = results.filter(r => r.wordOverlap !== undefined).reduce((s, r) => s + r.wordOverlap, 0) / results.length;
  console.log(`Avg word overlap: ${Math.round(avgOverlap * 100)}%`);
  console.log(`Avg latency: ${Math.round(avgLatency)}ms`);

  // Confidence calibration (if confidence is available)
  const withConfidence = results.filter(r => r.confidence != null);
  if (withConfidence.length > 0) {
    console.log(`\nConfidence calibration (${withConfidence.length} results):`);
    const low = withConfidence.filter(r => r.confidence < 0.7);
    const med = withConfidence.filter(r => r.confidence >= 0.7 && r.confidence < 0.85);
    const high = withConfidence.filter(r => r.confidence >= 0.85);
    console.log(`  Low confidence (< 0.7): ${low.length}`);
    console.log(`  Medium confidence: ${med.length}`);
    console.log(`  High confidence (> 0.85): ${high.length}`);
  }

  // Per-language breakdown
  console.log('\nPer-language breakdown:');
  const byLang = {};
  for (const r of results) {
    const key = `${r.sourceLang}→${r.targetLang}`;
    if (!byLang[key]) byLang[key] = { total: 0, pass: 0, partial: 0 };
    byLang[key].total++;
    if (r.status === 'pass') byLang[key].pass++;
    else if (r.status === 'partial') byLang[key].partial++;
  }
  for (const [lang, stats] of Object.entries(byLang)) {
    const rate = Math.round(stats.pass / stats.total * 100);
    console.log(`  ${lang}: ${stats.pass}/${stats.total} pass (${rate}%)`);
  }

  // Exit with code
  const allPassed = errors === 0;
  if (!allPassed) {
    console.log('\n⚠ Some tests had errors. Review output above.');
    process.exit(1);
  }
  console.log('\nAll tests completed successfully.');
}

main().catch((err) => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
