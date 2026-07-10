/**
 * Accuracy validation script for Phase 1 gate (1.G).
 *
 * Run: node scripts/validate-accuracy.mjs
 * Requires: INFERENCE_BASE_URL (or default http://localhost:8000) pointing to running sidecar.
 *
 * Exits with code 0 only if ALL tests pass without errors.
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

const TEST_SET = [
  // ── European pairs (baseline) ──
  { sourceLang: 'eng_Latn', targetLang: 'spa_Latn', domain: 'medical', source: 'The patient has high blood pressure.', expected: 'El paciente tiene presión arterial alta.' },
  { sourceLang: 'eng_Latn', targetLang: 'spa_Latn', domain: 'general', source: 'Hello, how are you today?', expected: 'Hola, ¿cómo estás hoy?' },
  { sourceLang: 'eng_Latn', targetLang: 'spa_Latn', domain: 'education', source: 'The school will reopen on Monday.', expected: 'La escuela reabrirá el lunes.' },
  { sourceLang: 'eng_Latn', targetLang: 'fra_Latn', domain: 'general', source: 'Good morning, how can I help you?', expected: 'Bonjour, comment puis-je vous aider?' },
  { sourceLang: 'eng_Latn', targetLang: 'deu_Latn', domain: 'general', source: 'Where is the nearest hospital?', expected: 'Wo ist das nächste Krankenhaus?' },
  { sourceLang: 'eng_Latn', targetLang: 'por_Latn', domain: 'civic', source: 'Your passport is ready for pickup.', expected: 'Seu passaporte está pronto para retirada.' },

  // ── Southeast Asia pairs ──
  { sourceLang: 'eng_Latn', targetLang: 'tgl_Latn', domain: 'general', source: 'Where is the hospital?', expected: 'Nasaan ang ospital?' },
  { sourceLang: 'eng_Latn', targetLang: 'tgl_Latn', domain: 'civic', source: 'Your voting precinct is located at the community center.', expected: 'Ang iyong presinto ng pagboto ay matatagpuan sa sentro ng komunidad.' },
  { sourceLang: 'eng_Latn', targetLang: 'vie_Latn', domain: 'medical', source: 'Take this medication twice a day.', expected: 'Uống thuốc này hai lần một ngày.' },
  { sourceLang: 'eng_Latn', targetLang: 'vie_Latn', domain: 'general', source: 'Thank you for your help.', expected: 'Cảm ơn bạn đã giúp đỡ.' },
  { sourceLang: 'eng_Latn', targetLang: 'tha_Thai', domain: 'general', source: 'How much does this cost?', expected: 'อันนี้ราคาเท่าไหร่?' },
  { sourceLang: 'eng_Latn', targetLang: 'ind_Latn', domain: 'general', source: 'Good morning, how are you?', expected: 'Selamat pagi, apa kabar?' },
  { sourceLang: 'eng_Latn', targetLang: 'msa_Latn', domain: 'general', source: 'Where is the nearest bus stop?', expected: 'Di manakah perhentian bas yang terdekat?' },
  { sourceLang: 'eng_Latn', targetLang: 'ceb_Latn', domain: 'general', source: 'Thank you very much.', expected: 'Salamat kaayo.' },
  { sourceLang: 'eng_Latn', targetLang: 'ilo_Latn', domain: 'general', source: 'What is your name?', expected: 'Ania ti naganmo?' },

  // ── East Asia pairs ──
  { sourceLang: 'eng_Latn', targetLang: 'yue_Hant', domain: 'general', source: 'Thank you very much.', expected: '多謝晒。' },
  { sourceLang: 'eng_Latn', targetLang: 'yue_Hant', domain: 'medical', source: 'Take this medication twice a day.', expected: '每日食兩次呢隻藥。' },
  { sourceLang: 'eng_Latn', targetLang: 'zho_Hans', domain: 'general', source: 'The weather is very nice today.', expected: '今天天气很好。' },
  { sourceLang: 'eng_Latn', targetLang: 'jpn_Jpan', domain: 'general', source: 'Nice to meet you.', expected: 'はじめまして。' },
  { sourceLang: 'eng_Latn', targetLang: 'kor_Hang', domain: 'general', source: 'Thank you for your help.', expected: '도와주셔서 감사합니다.' },

  // ── Hmong (low-resource) ──
  { sourceLang: 'eng_Latn', targetLang: 'hmn_Latn', domain: 'medical', source: 'Drink plenty of water.', expected: 'Haus dej ntau.' },
  { sourceLang: 'eng_Latn', targetLang: 'hmn_Latn', domain: 'education', source: 'The child needs to enroll in school.', expected: 'Tus me nyuam yuav tsum tau mus kawm ntawv.' },

  // ── South Asia pairs ──
  { sourceLang: 'eng_Latn', targetLang: 'hin_Deva', domain: 'general', source: 'What is your name?', expected: 'आपका नाम क्या है?' },
  { sourceLang: 'eng_Latn', targetLang: 'ben_Beng', domain: 'general', source: 'How are you?', expected: 'আপনি কেমন আছেন?' },
  { sourceLang: 'eng_Latn', targetLang: 'urd_Arab', domain: 'general', source: 'Thank you very much.', expected: 'بہت بہت شکریہ۔' },
  { sourceLang: 'eng_Latn', targetLang: 'tam_Taml', domain: 'general', source: 'Good morning.', expected: 'காலை வணக்கம்.' },
  { sourceLang: 'eng_Latn', targetLang: 'tel_Telu', domain: 'general', source: 'How are you?', expected: 'మీరు ఎలా ఉన్నారు?' },

  // ── Central & West Asia ──
  { sourceLang: 'eng_Latn', targetLang: 'pes_Arab', domain: 'general', source: 'Thank you.', expected: 'متشکرم۔' },
  { sourceLang: 'eng_Latn', targetLang: 'pus_Arab', domain: 'general', source: 'Hello.', expected: 'سلام.' },

  // ── Khmer & Lao (low-resource) ──
  { sourceLang: 'eng_Latn', targetLang: 'khm_Khmr', domain: 'general', source: 'Thank you.', expected: 'សូមអរគុណ។' },
  { sourceLang: 'eng_Latn', targetLang: 'lao_Laoo', domain: 'general', source: 'How are you?', expected: 'ສະບາຍດີບໍ?' },
  { sourceLang: 'eng_Latn', targetLang: 'mya_Mymr', domain: 'general', source: 'Thank you.', expected: 'ကျေးဇူးတင်ပါတယ်။' },

  // ── African pairs ──
  { sourceLang: 'eng_Latn', targetLang: 'hat_Latn', domain: 'civic', source: 'Your children must attend school.', expected: 'Timoun ou yo dwe ale lekòl.' },
  { sourceLang: 'eng_Latn', targetLang: 'yor_Latn', domain: 'general', source: 'How are you doing?', expected: 'Báwo ni?' },
  { sourceLang: 'eng_Latn', targetLang: 'ara_Arab', domain: 'general', source: 'Thank you very much.', expected: 'شكراً جزيلاً۔' },
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

  // Hallucination check: output should not repeat input verbatim (deadly sin for translation)
  const hallucinated = result.translation.toLowerCase().trim() === pair.source.toLowerCase().trim();

  return {
    ...pair,
    status: isExact ? 'pass' : hallucinated ? 'hallucination' : 'partial',
    got: result.translation,
    exact: isExact,
    hallucinated,
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
  console.log('=== Vernacular Accuracy Validation (Phase 1 Gate 1.G) ===\n');
  console.log(`API: ${API_URL}`);
  console.log(`Test pairs: ${TEST_SET.length}`);
  console.log(`Language pairs: ${new Set(TEST_SET.map(p => `${p.sourceLang}\u2192${p.targetLang}`)).size} unique\n`);

  const results = [];
  let passed = 0;
  let partial = 0;
  let hallucinated = 0;
  let errors = 0;

  for (const pair of TEST_SET) {
    const result = await runTest(pair);
    results.push(result);

    let icon;
    if (result.status === 'pass') icon = '\u2713';
    else if (result.status === 'hallucination') icon = '\u26A0';
    else if (result.status === 'partial') icon = '~';
    else icon = '\u2717';

    console.log(`${icon} [${result.sourceLang}\u2192${result.targetLang}] (${result.domain})`);
    console.log(`   Source:   ${result.source}`);
    console.log(`   Expected: ${result.expected}`);
    if (result.got) console.log(`   Got:      ${result.got}`);
    if (result.error) console.log(`   Error:    ${result.error}`);
    if (result.hallucinated) console.log(`   \u26A0 HALLUCINATION — output equals input!`);
    if (result.wordOverlap !== undefined) console.log(`   Word overlap: ${Math.round(result.wordOverlap * 100)}%`);
    if (result.latencyMs) console.log(`   Latency: ${result.latencyMs}ms`);
    if (result.overrideCount > 0) console.log(`   Glossary overrides: ${result.overrideCount}`);
    if (result.needsReview) console.log(`   Needs review: yes`);
    console.log('');

    if (result.status === 'pass') passed++;
    else if (result.status === 'hallucination') hallucinated++;
    else if (result.status === 'partial') partial++;
    else errors++;
  }

  // Summary
  console.log('=== Summary ===');
  console.log(`Total: ${results.length} | Pass: ${passed} | Partial: ${partial} | Hallucinations: ${hallucinated} | Errors: ${errors}`);
  const exactRate = passed / results.length;
  const avgLatency = results.filter(r => r.latencyMs).reduce((s, r) => s + r.latencyMs, 0) / results.length;
  console.log(`Exact match rate: ${Math.round(exactRate * 100)}%`);
  const avgOverlap = results.filter(r => r.wordOverlap !== undefined).reduce((s, r) => s + r.wordOverlap, 0) / results.length;
  console.log(`Avg word overlap: ${Math.round(avgOverlap * 100)}%`);
  console.log(`Avg latency: ${Math.round(avgLatency)}ms`);

  // Hallucination report
  if (hallucinated > 0) {
    console.log(`\n\u26A0\uFE0F HALLUCINATIONS DETECTED — ${hallucinated} of ${results.length} results`);
    for (const r of results.filter(r => r.hallucinated)) {
      console.log(`   [${r.sourceLang}\u2192${r.targetLang}] "${r.source}"`);
    }
  }

  // Confidence calibration
  const withConfidence = results.filter(r => r.confidence != null);
  if (withConfidence.length > 0) {
    console.log(`\nConfidence calibration (${withConfidence.length} results):`);
    const low = withConfidence.filter(r => r.confidence < 0.7);
    const med = withConfidence.filter(r => r.confidence >= 0.7 && r.confidence < 0.85);
    const high = withConfidence.filter(r => r.confidence >= 0.85);
    console.log(`  Low confidence (< 0.7): ${low.length}`);
    console.log(`  Medium confidence (0.7\u20130.85): ${med.length}`);
    console.log(`  High confidence (> 0.85): ${high.length}`);
  }

  // Per-language breakdown
  console.log('\nPer-language breakdown:');
  const byLang = {};
  for (const r of results) {
    const key = `${r.sourceLang}\u2192${r.targetLang}`;
    if (!byLang[key]) byLang[key] = { total: 0, pass: 0, partial: 0, hallucinated: 0 };
    byLang[key].total++;
    if (r.status === 'pass') byLang[key].pass++;
    else if (r.status === 'hallucination') byLang[key].hallucinated++;
    else if (r.status === 'partial') byLang[key].partial++;
  }
  for (const [lang, stats] of Object.entries(byLang)) {
    const rate = Math.round(stats.pass / stats.total * 100);
    const warn = stats.hallucinated > 0 ? ' \u26A0' : '';
    console.log(`  ${lang}: ${stats.pass}/${stats.total} pass (${rate}%)${warn}`);
  }

  // Gate decision
  console.log('\n=== Gate 1.G Decision ===');
  if (hallucinated > 0) {
    console.log(`\u2717 FAIL — ${hallucinated} hallucinated translations found. Gate 1.G NOT cleared.`);
    console.log('  Fix hallucinations before proceeding to Phase 2.');
    process.exit(1);
  } else if (errors > 0) {
    console.log(`\u26A0 DEGRADED — ${errors} test(s) had errors (network, API, etc). Check output above.`);
    process.exit(1);
  } else {
    const recommendation = exactRate >= 0.5 ? 'PASS' : 'REVIEW';
    const note = exactRate >= 0.5
      ? 'No hallucinations, no errors. Gate 1.G may be cleared.'
      : 'No hallucinations, but exact match rate is low. Manual review recommended before clearing.';
    console.log(`  Status: ${recommendation}`);
    console.log(`  ${note}`);
    console.log('  All tests completed successfully.');
    if (recommendation === 'PASS') {
      console.log('  Gate 1.G cleared.');
    }
  }
}

main().catch((err) => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
