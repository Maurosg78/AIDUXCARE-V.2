import { chromium } from '@playwright/test';

const baseUrl = process.env.PILOT_BASE_URL || 'https://pilot.aiduxcare.com';
const email = process.env.PILOT_EMAIL;
const password = process.env.PILOT_PASSWORD;

if (!email || !password) {
  console.error('Missing PILOT_EMAIL or PILOT_PASSWORD');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/command-center/, { timeout: 30000 });
  await page.waitForTimeout(3000);

  const resumeButtons = page.getByRole('button', { name: 'Reanudar' });
  const count = await resumeButtons.count();
  const results = [];

  for (let i = 0; i < count; i += 1) {
    await page.goto(`${baseUrl}/command-center`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    const button = page.getByRole('button', { name: 'Reanudar' }).nth(i);
    const cardText = cleanText(await button.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]').innerText().catch(() => ''));
    await button.click();
    await page.waitForTimeout(4000);
    results.push({
      index: i,
      cardText,
      url: page.url(),
      title: await page.title(),
      headings: await page.locator('h1, h2, h3').allInnerTexts().catch(() => []),
    });
  }

  console.log(JSON.stringify(results, null, 2));
} finally {
  await context.close();
  await browser.close();
}
