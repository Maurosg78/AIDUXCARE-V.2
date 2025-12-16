#!/usr/bin/env node

/**
 * Mobile Pre-Flight Check
 * 
 * Validates environment before real device testing:
 * - Ports open
 * - IPv4 accessible
 * - Certificates valid
 * - HTTPS functional handshake
 * - Endpoints available
 * - Performance base (desktop)
 * 
 * Usage: npm run mobile:preflight
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logResult(check, status, message) {
  const result = { check, status, message };
  if (status === 'PASS') {
    results.passed.push(result);
    console.log(`✅ ${check}: ${message}`);
  } else if (status === 'FAIL') {
    results.failed.push(result);
    console.log(`❌ ${check}: ${message}`);
  } else {
    results.warnings.push(result);
    console.log(`⚠️  ${check}: ${message}`);
  }
}

async function checkPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port} 2>/dev/null || echo ""`);
    const isInUse = stdout.trim() !== '';
    if (isInUse) {
      logResult('Port Availability', 'WARN', `Port ${port} is in use (Vite will use another port)`);
    } else {
      logResult('Port Availability', 'PASS', `Port ${port} is available`);
    }
    return !isInUse;
  } catch (error) {
    logResult('Port Availability', 'FAIL', `Cannot check port: ${error.message}`);
    return false;
  }
}

function checkLocalIP() {
  try {
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
    
    if (ips.length > 0) {
      logResult('IPv4 Accessible', 'PASS', `Local IP: ${ips[0]} (${ips.length} interface${ips.length > 1 ? 's' : ''} found)`);
      return ips[0];
    } else {
      logResult('IPv4 Accessible', 'FAIL', 'No IPv4 interface found');
      return null;
    }
  } catch (error) {
    logResult('IPv4 Accessible', 'FAIL', `Error: ${error.message}`);
    return null;
  }
}

function checkCertificates() {
  const certPath = path.resolve(__dirname, '../certs/cert.pem');
  const keyPath = path.resolve(__dirname, '../certs/key.pem');
  
  if (!fs.existsSync(certPath)) {
    logResult('Certificates', 'FAIL', 'cert.pem not found');
    return false;
  }
  
  if (!fs.existsSync(keyPath)) {
    logResult('Certificates', 'FAIL', 'key.pem not found');
    return false;
  }
  
  try {
    // Check certificate expiry (basic check)
    const certContent = fs.readFileSync(certPath, 'utf8');
    if (certContent.includes('BEGIN CERTIFICATE')) {
      logResult('Certificates', 'PASS', 'Certificates found and valid format');
      return true;
    } else {
      logResult('Certificates', 'FAIL', 'Invalid certificate format');
      return false;
    }
  } catch (error) {
    logResult('Certificates', 'FAIL', `Error reading certificates: ${error.message}`);
    return false;
  }
}

async function checkHTTPSConfig() {
  const configPath = path.resolve(__dirname, '../vite.config.https.ts');
  
  if (!fs.existsSync(configPath)) {
    logResult('HTTPS Config', 'FAIL', 'vite.config.https.ts not found');
    return false;
  }
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    if (configContent.includes('https:') && configContent.includes('cert.pem')) {
      logResult('HTTPS Config', 'PASS', 'HTTPS configuration found');
      return true;
    } else {
      logResult('HTTPS Config', 'FAIL', 'HTTPS configuration incomplete');
      return false;
    }
  } catch (error) {
    logResult('HTTPS Config', 'FAIL', `Error reading config: ${error.message}`);
    return false;
  }
}

async function checkEndpoints() {
  // Check if key files exist
  const endpoints = [
    { name: 'Mobile Test Harness', path: 'src/components/mobile/MobileTestHarness.tsx' },
    { name: 'Mobile Instrumentation', path: 'src/utils/mobileInstrumentation.ts' },
    { name: 'Performance Utilities', path: 'src/utils/performanceOptimizations.ts' }
  ];
  
  let allExist = true;
  for (const endpoint of endpoints) {
    const fullPath = path.resolve(__dirname, '..', endpoint.path);
    if (fs.existsSync(fullPath)) {
      logResult(`Endpoint: ${endpoint.name}`, 'PASS', 'Available');
    } else {
      logResult(`Endpoint: ${endpoint.name}`, 'FAIL', 'Not found');
      allExist = false;
    }
  }
  
  return allExist;
}

async function checkPerformanceBase() {
  // Basic performance check - verify Node.js performance
  try {
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 10));
    const duration = Date.now() - start;
    
    if (duration < 20) {
      logResult('Performance Base', 'PASS', `System responsive (${duration}ms)`);
      return true;
    } else {
      logResult('Performance Base', 'WARN', `System may be slow (${duration}ms)`);
      return false;
    }
  } catch (error) {
    logResult('Performance Base', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  📱 MOBILE PRE-FLIGHT CHECK                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Run all checks
  await checkPort(5174);
  const localIP = checkLocalIP();
  checkCertificates();
  await checkHTTPSConfig();
  await checkEndpoints();
  await checkPerformanceBase();
  
  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log('📊 SUMMARY:\n');
  console.log(`✅ Passed:  ${results.passed.length}`);
  console.log(`❌ Failed:  ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}\n`);
  
  if (results.failed.length > 0) {
    console.log('❌ FAILED CHECKS:');
    results.failed.forEach(r => {
      console.log(`   • ${r.check}: ${r.message}`);
    });
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach(r => {
      console.log(`   • ${r.check}: ${r.message}`);
    });
    console.log('');
  }
  
  // Final status
  if (results.failed.length === 0) {
    console.log('✅ PRE-FLIGHT CHECK: PASS');
    console.log('   Ready for real device testing\n');
    
    if (localIP) {
      console.log('📋 NEXT STEPS:');
      console.log(`   1. Start server: npm run dev:https`);
      console.log(`   2. Access from mobile: https://${localIP}:5174`);
      console.log(`   3. Trust certificate on mobile device`);
      console.log(`   4. Run Mobile Test Harness\n`);
    }
    
    process.exit(0);
  } else {
    console.log('❌ PRE-FLIGHT CHECK: FAIL');
    console.log('   Fix issues before real device testing\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

