import { execSync } from 'node:child_process';
if (!process.env.CI) {
  console.log('CI not detected – installing Playwright browsers...');
  execSync('npx playwright install', { stdio: 'inherit' });
} else {
  console.log('CI detected – skipping Playwright browser download.');
}
