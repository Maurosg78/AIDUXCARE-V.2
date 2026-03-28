import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const baseUrl = process.env.PILOT_BASE_URL || 'https://pilot.aiduxcare.com';
const email = process.env.PILOT_EMAIL;
const password = process.env.PILOT_PASSWORD;
const targetUrl = process.env.TARGET_URL;

if (!email || !password || !targetUrl) {
  console.error('Missing PILOT_EMAIL, PILOT_PASSWORD or TARGET_URL');
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), 'scripts', 'exports', 'pilot-inspect');
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

async function collectTexts(locator, limit = 40) {
  const count = await locator.count();
  const items = [];
  for (let i = 0; i < Math.min(count, limit); i += 1) {
    const text = cleanText(await locator.nth(i).innerText().catch(() => ''));
    if (text) items.push(text);
  }
  return items;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/command-center/, { timeout: 30000 });
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  const report = {
    timestamp: new Date().toISOString(),
    targetUrl,
    landedUrl: page.url(),
    title: await page.title(),
    headings: await collectTexts(page.locator('h1, h2, h3')),
    buttons: await collectTexts(page.locator('button')),
    tabs: await collectTexts(page.locator('[role="tab"], [data-state], button')),
    errors: await collectTexts(page.locator('[role="alert"], .text-red-800, .text-red-700, .bg-red-50, .bg-amber-50')),
    bodyPreview: cleanText(await page.locator('body').innerText()).slice(0, 8000),
  };

  const safeName = targetUrl.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 80);
  const jsonPath = path.join(outDir, `${safeName}_${stamp}.json`);
  const pngPath = path.join(outDir, `${safeName}_${stamp}.png`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  await page.screenshot({ path: pngPath, fullPage: true });

  console.log(JSON.stringify({ jsonPath, pngPath, landedUrl: report.landedUrl, headings: report.headings, buttons: report.buttons.slice(0, 20) }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
