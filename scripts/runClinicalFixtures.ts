import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.PORT || 3011);
const BASE_URL = process.env.CLINICAL_SIM_URL || `http://localhost:${PORT}`;

interface ClinicalCaseFixture {
  language?: string;
  originalSOAP: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    [key: string]: any;
  };
  expectedReportStructure?: {
    hasSubjective?: boolean;
    hasObjective?: boolean;
    hasAssessment?: boolean;
    hasPlan?: boolean;
  };
}

async function loadFixtures(dir: string): Promise<string[]> {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir);
  return entries.filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));
}

function textSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const tokensA = new Set(a.split(/\s+/).filter(Boolean));
  const tokensB = new Set(b.split(/\s+/).filter(Boolean));
  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  let intersection = 0;
  tokensA.forEach((t) => {
    if (tokensB.has(t)) intersection += 1;
  });
  const maxSize = Math.max(tokensA.size, tokensB.size);
  return maxSize === 0 ? 1 : intersection / maxSize;
}

async function run() {
  const fixturesDir = path.resolve('test/fixtures/clinicalCasesES');
  const files = await loadFixtures(fixturesDir);

  if (files.length === 0) {
    console.log('[clinical-fixtures] No ES fixtures found. Skipping.');
    return;
  }

  console.log('Clinical Fixtures Report');
  console.log('------------------------\n');

  let hasForbidden = false;

  const resultsDir = path.resolve('test/results/clinical-sim');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  for (const file of files) {
    const name = path.basename(file, '.json');
    const raw = fs.readFileSync(file, 'utf-8');
    const fixture: ClinicalCaseFixture = JSON.parse(raw);

    const res = await fetch(`${BASE_URL}/api/dev/simulate-clinical-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: fixture.language || 'es',
        originalSOAP: fixture.originalSOAP,
      }),
    }).catch((err) => {
      console.error(`[clinical-fixtures] Error calling simulator for ${name}:`, err);
      return null as any;
    });

    if (!res || !res.ok) {
      console.log(`${name}`);
      console.log(`  error: unable to simulate (status: ${res && res.status})\n`);
      continue;
    }

    const json = await res.json();
    const metrics = json.metrics || {};
    const forbiddenLanguage = !!metrics.forbiddenLanguage;
    const sectionsDetected = !!metrics.sectionsDetected;
    const sectionsCount = metrics.sectionsCount ?? 'n/a';
    const narrativeLength = metrics.narrativeLength ?? 'n/a';
    const planDetected = metrics.planDetected ? 'YES' : 'NO';
    const regulatoryBoundaryCheck = metrics.regulatoryBoundaryCheck || 'UNKNOWN';

    // Compute clinical variation vs previous result (if any)
    const resultPath = path.join(resultsDir, `${name}.result.json`);
    let clinicalVariation: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (fs.existsSync(resultPath)) {
      try {
        const prevRaw = fs.readFileSync(resultPath, 'utf-8');
        const prevJson = JSON.parse(prevRaw);
        const prevReport: string = prevJson.referralReportEs || '';
        const currentReport: string = json.referralReportEs || '';
        const sim = textSimilarity(prevReport, currentReport);
        if (sim < 0.6) {
          clinicalVariation = 'HIGH';
        } else if (sim < 0.85) {
          clinicalVariation = 'MEDIUM';
        } else {
          clinicalVariation = 'LOW';
        }
      } catch {
        clinicalVariation = 'HIGH';
      }
    }

    // Persist latest result for diffing / traceability
    fs.writeFileSync(resultPath, JSON.stringify(json, null, 2), 'utf-8');

    if (forbiddenLanguage || regulatoryBoundaryCheck === 'FAIL') {
      hasForbidden = true;
    }

    console.log(name);
    console.log(`  structure: ${sectionsDetected ? 'OK' : 'WARN'}`);
    console.log(`  sections: ${sectionsCount}`);
    console.log(`  forbidden_language: ${forbiddenLanguage ? 'WARN' : 'OK'}`);
    console.log(`  regulatoryBoundaryCheck: ${regulatoryBoundaryCheck}`);
    console.log(`  narrative_length: ${narrativeLength} chars`);
    console.log(`  plan_detected: ${planDetected}`);
    console.log(`  clinical_variation: ${clinicalVariation}\n`);
  }

  if (process.env.CI === 'true' && hasForbidden) {
    console.error('[clinical-fixtures] Forbidden regulatory language detected in CI. Failing run.');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[clinical-fixtures] Unexpected error:', err);
  process.exit(1);
});

