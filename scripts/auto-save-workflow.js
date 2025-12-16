#!/usr/bin/env node

/**
 * ✅ Auto-Save Workflow Script (ES Modules version)
 * Este script crea backups locales automáticamente SIN usar Git
 * Uso: node scripts/auto-save-workflow.js [intervalo_en_segundos]
 * Ejemplo: node scripts/auto-save-workflow.js 300  (cada 5 minutos)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const INTERVAL = parseInt(process.argv[2]) || 300; // Default: 5 minutos
const PROJECT_ROOT = process.cwd();
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups', 'auto-save');
const SNAPSHOT_DIR = path.join(PROJECT_ROOT, 'canonical_snapshots', 'auto');

// Colores para output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Crear directorios si no existen
[BACKUP_DIR, SNAPSHOT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Función para verificar si hay cambios en archivos importantes
function hasChanges() {
  try {
    // Verificar cambios en archivos fuente (últimos 5 minutos)
    const srcDir = path.join(PROJECT_ROOT, 'src');
    if (!fs.existsSync(srcDir)) return false;
    
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    function checkDir(dir) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Ignorar node_modules, dist, etc.
          if (entry.name.startsWith('.') || 
              entry.name === 'node_modules' || 
              entry.name === 'dist' ||
              entry.name === '.git') {
            continue;
          }
          
          if (entry.isDirectory()) {
            if (checkDir(fullPath)) return true;
          } else {
            const stats = fs.statSync(fullPath);
            if (stats.mtimeMs > fiveMinutesAgo) {
              return true;
            }
          }
        }
      } catch (error) {
        // Ignorar errores
      }
      return false;
    }
    
    return checkDir(srcDir);
  } catch (error) {
    return true; // Si hay error, asumir que hay cambios
  }
}

// Función para crear snapshot local
function createSnapshot() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotName = `snapshot_${timestamp}`;
  const snapshotPath = path.join(SNAPSHOT_DIR, snapshotName);
  
  if (!fs.existsSync(snapshotPath)) {
    fs.mkdirSync(snapshotPath, { recursive: true });
  }
  
  console.log(`${colors.yellow}[${new Date().toLocaleTimeString()}] 📸 Creando snapshot local...${colors.reset}`);
  
  let copiedCount = 0;
  
  // Archivos y directorios a copiar
  const itemsToCopy = [
    { src: 'src', dest: 'src' },
    { src: 'package.json', dest: 'package.json' },
    { src: 'tsconfig.json', dest: 'tsconfig.json' },
    { src: 'vite.config.ts', dest: 'vite.config.ts' },
    { src: 'docs', dest: 'docs' }
  ];
  
  itemsToCopy.forEach(item => {
    const srcPath = path.join(PROJECT_ROOT, item.src);
    const destPath = path.join(snapshotPath, item.dest);
    
    if (fs.existsSync(srcPath)) {
      try {
        if (fs.statSync(srcPath).isDirectory()) {
          copyDir(srcPath, destPath);
          copiedCount++;
        } else {
          fs.copyFileSync(srcPath, destPath);
          copiedCount++;
        }
      } catch (error) {
        // Ignorar errores de copia silenciosamente
      }
    }
  });
  
  if (copiedCount > 0) {
    console.log(`${colors.green}[${new Date().toLocaleTimeString()}] ✅ Snapshot creado: ${snapshotName} (${copiedCount} items)${colors.reset}`);
  } else {
    console.log(`${colors.yellow}[${new Date().toLocaleTimeString()}] ⚠️ No se copiaron archivos (¿directorio vacío?)${colors.reset}`);
  }
  
  // Limpiar snapshots antiguos (mantener solo los últimos 20)
  cleanupOldFiles(SNAPSHOT_DIR, 20);
}

// Función auxiliar para copiar directorios
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Función para crear backup comprimido
function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}.tar.gz`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    console.log(`${colors.yellow}[${new Date().toLocaleTimeString()}] 📦 Creando backup comprimido...${colors.reset}`);
    
    // Archivos y directorios a incluir en el backup
    const itemsToBackup = [
      'src',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'docs'
    ];
    
    // Crear comando tar para comprimir
    const itemsList = itemsToBackup
      .filter(item => {
        const itemPath = path.join(PROJECT_ROOT, item);
        return fs.existsSync(itemPath);
      })
      .join(' ');
    
    if (!itemsList) {
      console.log(`${colors.yellow}[${new Date().toLocaleTimeString()}] ⚠️ No hay archivos para respaldar${colors.reset}`);
      return;
    }
    
    // Ejecutar tar para crear backup comprimido
    try {
      execSync(
        `cd "${PROJECT_ROOT}" && tar -czf "${backupPath}" ${itemsList} 2>/dev/null || true`,
        { stdio: 'ignore' }
      );
      
      if (fs.existsSync(backupPath)) {
        const stats = fs.statSync(backupPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`${colors.green}[${new Date().toLocaleTimeString()}] ✅ Backup creado: ${backupName} (${sizeMB} MB)${colors.reset}`);
        
        // Limpiar backups antiguos (mantener solo los últimos 10)
        cleanupOldFiles(BACKUP_DIR, 10, '.tar.gz');
      } else {
        console.log(`${colors.yellow}[${new Date().toLocaleTimeString()}] ⚠️ Backup no se pudo crear (tar no disponible o error)${colors.reset}`);
      }
    } catch (error) {
      // Si tar falla, simplemente no crear backup (no crítico)
      console.log(`${colors.yellow}[${new Date().toLocaleTimeString()}] ⚠️ Backup comprimido omitido (tar no disponible)${colors.reset}`);
    }
  } catch (error) {
    // Ignorar errores de backup (no crítico)
    console.log(`${colors.yellow}[${new Date().toLocaleTimeString()}] ⚠️ Error creando backup: ${error.message}${colors.reset}`);
  }
}

// Función para limpiar archivos antiguos
function cleanupOldFiles(dir, keepCount, extension = '') {
  try {
    const files = fs.readdirSync(dir)
      .filter(file => extension === '' || file.endsWith(extension))
      .map(file => ({
        name: file,
        path: path.join(dir, file),
        time: fs.statSync(path.join(dir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    files.slice(keepCount).forEach(file => {
      try {
        if (fs.statSync(file.path).isDirectory()) {
          fs.rmSync(file.path, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        // Ignorar errores de eliminación
      }
    });
  } catch (error) {
    // Ignorar errores
  }
}

// Función principal
function main() {
  console.log(`${colors.green}🚀 Iniciando auto-save workflow (SIN Git)${colors.reset}`);
  console.log(`${colors.yellow}Intervalo: ${INTERVAL} segundos (${INTERVAL}s = ${Math.floor(INTERVAL/60)} minutos)${colors.reset}`);
  console.log(`${colors.yellow}Modo: Solo snapshots locales y backups${colors.reset}`);
  console.log(`${colors.yellow}Presiona Ctrl+C para detener${colors.reset}`);
  console.log('');
  
  // Crear snapshot inicial
  createSnapshot();
  
  let cycleCount = 0;
  
  // Loop principal
  const intervalId = setInterval(() => {
    cycleCount++;
    console.log('');
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}[${new Date().toLocaleString()}] Ejecutando auto-save...${colors.reset}`);
    
    // Verificar si hay cambios recientes
    if (!hasChanges() && cycleCount % 3 !== 0) {
      console.log(`${colors.yellow}[${new Date().toLocaleTimeString()}] No hay cambios recientes, saltando...${colors.reset}`);
      return;
    }
    
    // 1. Crear snapshot local (cada ciclo si hay cambios, o cada 3 ciclos siempre)
    createSnapshot();
    
    // 2. Crear backup comprimido (cada 6 ciclos)
    if (cycleCount % 6 === 0) {
      createBackup();
    }
    
    console.log(`${colors.green}[${new Date().toLocaleTimeString()}] ✅ Auto-save completado${colors.reset}`);
  }, INTERVAL * 1000);
  
  // Manejar Ctrl+C
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}🛑 Deteniendo auto-save workflow...${colors.reset}`);
    clearInterval(intervalId);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log(`\n${colors.yellow}🛑 Deteniendo auto-save workflow...${colors.reset}`);
    clearInterval(intervalId);
    process.exit(0);
  });
}

// Ejecutar
main();

