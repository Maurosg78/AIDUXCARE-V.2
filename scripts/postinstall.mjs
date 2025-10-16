if (process.env.CI === 'true' || process.env.PW_INSTALL === '1') {
  console.log('Installing Playwright browsers...');
  // Descomenta si quieres realmente descargar en CI:
  // require('child_process').execSync('npx playwright install', { stdio: 'inherit' });
} else {
  console.log('CI not detected – skipping Playwright browsers...');
}
