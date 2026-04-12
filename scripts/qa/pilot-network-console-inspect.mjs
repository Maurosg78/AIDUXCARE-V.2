import { chromium } from '@playwright/test';

const baseUrl = process.env.PILOT_BASE_URL || 'https://pilot.aiduxcare.com';
const email = process.env.PILOT_EMAIL;
const password = process.env.PILOT_PASSWORD;
const targetUrl = process.env.TARGET_URL;
const executablePath =
  process.env.PLAYWRIGHT_EXECUTABLE_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const waitMs = Number(process.env.WAIT_MS || '8000');
const filterPattern = process.env.FILTER_PATTERN || '';

if (!email || !password || !targetUrl) {
  console.error('Missing PILOT_EMAIL, PILOT_PASSWORD or TARGET_URL');
  process.exit(1);
}

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
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

const consoleMessages = [];
const pageErrors = [];
const requests = [];
const responses = [];

page.on('console', (msg) => {
  consoleMessages.push({
    type: msg.type(),
    text: cleanText(msg.text()),
  });
});

page.on('pageerror', (error) => {
  pageErrors.push({
    message: cleanText(error.message),
    stack: cleanText(error.stack || ''),
  });
});

page.on('request', (request) => {
  const url = request.url();
  requests.push({
    method: request.method(),
    url,
  });
});

page.on('response', async (response) => {
  const url = response.url();
  responses.push({
    status: response.status(),
    url,
  });
});

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/command-center/, { timeout: 30000 });
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(waitMs);

  const filteredRequests = filterPattern
    ? requests.filter((item) => item.url.includes(filterPattern))
    : requests;
  const filteredResponses = filterPattern
    ? responses.filter((item) => item.url.includes(filterPattern))
    : responses;
  const permissionSignals = consoleMessages.filter((item) =>
    /PERMISSION_DENIED|Missing or insufficient permissions|permission/i.test(item.text),
  );

  const report = {
    targetUrl,
    landedUrl: page.url(),
    title: await page.title(),
    bodyPreview: cleanText(await page.locator('body').innerText()).slice(0, 4000),
    consoleMessages,
    pageErrors,
    filteredRequests,
    filteredResponses,
    permissionSignals,
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}
