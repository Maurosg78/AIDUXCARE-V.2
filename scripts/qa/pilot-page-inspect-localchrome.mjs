import { chromium } from '@playwright/test';

const baseUrl = process.env.PILOT_BASE_URL || 'https://pilot.aiduxcare.com';
const email = process.env.PILOT_EMAIL;
const password = process.env.PILOT_PASSWORD;
const targetUrl = process.env.TARGET_URL;
const executablePath =
  process.env.PLAYWRIGHT_EXECUTABLE_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (!email || !password || !targetUrl) {
  console.error('Missing PILOT_EMAIL, PILOT_PASSWORD or TARGET_URL');
  process.exit(1);
}

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

async function collectTexts(locator, limit = 40) {
  const count = await locator.count();
  const items = [];
  for (let i = 0; i < Math.min(count, limit); i += 1) {
    const text = cleanText(await locator.nth(i).innerText().catch(() => ''));
    if (text) {
      items.push(text);
    }
  }
  return items;
}

const browser = await chromium.launch({
  headless: true,
  executablePath,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1400 },
});
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
    targetUrl,
    landedUrl: page.url(),
    title: await page.title(),
    headings: await collectTexts(page.locator('h1, h2, h3')),
    buttons: await collectTexts(page.locator('button')),
    bodyPreview: cleanText(await page.locator('body').innerText()).slice(0, 8000),
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}
