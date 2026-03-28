import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const baseUrl = process.env.PILOT_BASE_URL || 'https://pilot.aiduxcare.com';
const email = process.env.PILOT_EMAIL;
const password = process.env.PILOT_PASSWORD;

if (!email || !password) {
  console.error('Missing PILOT_EMAIL or PILOT_PASSWORD');
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), 'scripts', 'exports', 'pilot-inspect');
fs.mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function cleanText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function collectTexts(locator, limit = 30) {
  const count = await locator.count();
  const items = [];
  for (let i = 0; i < Math.min(count, limit); i += 1) {
    const text = cleanText(await locator.nth(i).innerText().catch(() => ''));
    if (text) items.push(text);
  }
  return items;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);
  await page.waitForURL(/\/(command-center|professional-onboarding|login)/, { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});

  const afterLoginUrl = page.url();
  const title = await page.title();
  const bodyText = cleanText(await page.locator('body').innerText());
  const visibleErrors = await collectTexts(page.locator('[role="alert"], .text-red-800, .text-red-700, .bg-red-50'));
  const buttons = await collectTexts(page.locator('button'));
  const links = await collectTexts(page.locator('a'));
  const headings = await collectTexts(page.locator('h1, h2, h3'));

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    afterLoginUrl,
    title,
    visibleErrors,
    headings,
    buttons,
    links,
    bodyPreview: bodyText.slice(0, 5000),
  };

  const jsonPath = path.join(outDir, `pilot-login-inspect_${stamp}.json`);
  const pngPath = path.join(outDir, `pilot-login-inspect_${stamp}.png`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  await page.screenshot({ path: pngPath, fullPage: true });

  console.log(JSON.stringify({
    jsonPath,
    pngPath,
    afterLoginUrl,
    headings,
    firstButtons: buttons.slice(0, 20),
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
