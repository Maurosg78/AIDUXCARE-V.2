#!/usr/bin/env node

/**
 * Mobile Harness Test Script
 * 
 * Launches HTTPS dev server, opens logs, verifies local connection,
 * and shows network warnings.
 * 
 * Usage: npm run harness:test
 */

const { spawn } = require('child_process');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  📱 MOBILE HARNESS TEST - HTTPS SERVER                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Check if certificates exist
const certPath = path.resolve(__dirname, '../certs/cert.pem');
const keyPath = path.resolve(__dirname, '../certs/key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.log('❌ Certificates not found!');
  console.log('   Run: bash scripts/setup-https-dev.sh\n');
  process.exit(1);
}

console.log('✅ Certificates found\n');

// Get local IP address
function getLocalIP() {
  return new Promise((resolve, reject) => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          resolve(iface.address);
          return;
        }
      }
    }
    reject(new Error('No local IP found'));
  });
}

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error) => {
      resolve(!error); // Port is available if lsof returns error (no process found)
    });
  });
}

// Main execution
async function main() {
  try {
    // Get local IP
    const localIP = await getLocalIP();
    console.log(`📡 Local IP: ${localIP}\n`);

    // Check port availability
    const port = 5174;
    const portAvailable = await checkPort(port);
    
    if (!portAvailable) {
      console.log(`⚠️  Port ${port} is in use`);
      console.log(`   Vite will try another port automatically\n`);
    } else {
      console.log(`✅ Port ${port} is available\n`);
    }

    // Display connection info
    console.log('📋 CONNECTION INFORMATION:');
    console.log(`   Local:   https://localhost:${port}/`);
    console.log(`   Network: https://${localIP}:${port}/\n`);

    console.log('📋 MOBILE ACCESS INSTRUCTIONS:');
    console.log('   1. Ensure mobile device is on same WiFi network');
    console.log(`   2. Open Safari/Chrome on mobile`);
    console.log(`   3. Navigate to: https://${localIP}:${port}/`);
    console.log('   4. Trust certificate when prompted');
    console.log('   5. Open Mobile Test Harness (purple button)\n');

    console.log('🚀 Starting HTTPS dev server...\n');
    console.log('   Press Ctrl+C to stop\n');
    console.log('─'.repeat(60));

    // Start Vite HTTPS server
    const viteProcess = spawn('node', [
      'node_modules/vite/bin/vite.js',
      '--config',
      'vite.config.https.ts',
      '--port',
      port.toString(),
      '--host'
    ], {
      stdio: 'inherit',
      shell: false,
      cwd: path.resolve(__dirname, '..')
    });

    // Handle process exit
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping server...');
      viteProcess.kill('SIGINT');
      process.exit(0);
    });

    viteProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\n❌ Server exited with code ${code}`);
        process.exit(code);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

