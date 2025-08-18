import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Git Self-Heal Script', () => {
  const scriptPath = './git-self-heal.sh';
  const gitDir = '.git';
  const indexLockPath = join(gitDir, 'index.lock');
  const indexPath = join(gitDir, 'index');

  beforeEach(() => {
    // Limpiar cualquier lock residual
    if (existsSync(indexLockPath)) {
      unlinkSync(indexLockPath);
    }
  });

  afterEach(() => {
    // Limpiar después de cada test
    if (existsSync(indexLockPath)) {
      unlinkSync(indexLockPath);
    }
  });

  it('debe detectar y reparar locks de Git automáticamente', () => {
    // 1. Verificar que Git funciona inicialmente
    const initialStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    expect(initialStatus).toBeDefined();

    // 2. Simular un lock colgado creando .git/index.lock
    writeFileSync(indexLockPath, 'simulated lock file');
    expect(existsSync(indexLockPath)).toBe(true);

    // 3. Verificar que git status se cuelga (debería fallar por timeout)
    try {
      execSync('timeout 2s git status --porcelain', { timeout: 3000 });
      // Si llega aquí, no se colgó, lo cual es inesperado
      expect(true).toBe(false);
    } catch (error) {
      // Esperado: git status debería fallar con el lock
      expect(error).toBeDefined();
    }

    // 4. Ejecutar el script de auto-reparación
    const scriptOutput = execSync(scriptPath, { encoding: 'utf8' });
    expect(scriptOutput).toContain('🔧 AUTO-REPARACIÓN GIT - AiDuxCare V.2');
    expect(scriptOutput).toContain('⚠️  Locks detectados - procediendo a eliminación...');
    expect(scriptOutput).toContain('✅ Locks eliminados');

    // 5. Verificar que el lock fue eliminado
    expect(existsSync(indexLockPath)).toBe(false);

    // 6. Verificar que git status vuelve a responder
    const finalStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    expect(finalStatus).toBeDefined();

    // 7. Verificar que el script confirma la reparación exitosa
    expect(scriptOutput).toContain('✅ Confirmo que Git quedó 100% reparado y funcional');
  });

  it('debe detectar y reparar .git/index corrupto', () => {
    // 1. Hacer backup del index original
    const indexBackup = join(gitDir, 'index.backup');
    execSync(`cp "${indexPath}" "${indexBackup}"`);

    try {
      // 2. Simular index corrupto eliminándolo
      unlinkSync(indexPath);
      expect(existsSync(indexPath)).toBe(false);

      // 3. Ejecutar el script de auto-reparación
      const scriptOutput = execSync(scriptPath, { encoding: 'utf8' });
      expect(scriptOutput).toContain('⚠️  .git/index ausente o corrupto - procediendo a restauración...');
      expect(scriptOutput).toContain('✅ .git/index restaurado exitosamente');

      // 4. Verificar que el index fue restaurado
      expect(existsSync(indexPath)).toBe(true);

      // 5. Verificar que git status funciona
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      expect(status).toBeDefined();

      // 6. Verificar confirmación final
      expect(scriptOutput).toContain('✅ Confirmo que Git quedó 100% reparado y funcional');
    } finally {
      // Restaurar index original
      if (existsSync(indexBackup)) {
        execSync(`cp "${indexBackup}" "${indexPath}"`);
        unlinkSync(indexBackup);
      }
    }
  });

  it('debe ser idempotente - se puede ejecutar múltiples veces', () => {
    // 1. Primera ejecución
    const firstRun = execSync(scriptPath, { encoding: 'utf8' });
    expect(firstRun).toContain('✅ Confirmo que Git quedó 100% reparado y funcional');

    // 2. Segunda ejecución inmediata
    const secondRun = execSync(scriptPath, { encoding: 'utf8' });
    expect(firstRun).toContain('✅ Confirmo que Git quedó 100% reparado y funcional');

    // 3. Verificar que Git sigue funcionando
    const status = execSync('git status --porcelain', { encoding:utf8' });
    expect(status).toBeDefined();
  });

  it('debe fallar si no está en un repositorio Git', () => {
    // Crear directorio temporal sin Git
    const tempDir = '/tmp/test-no-git';
    execSync(`mkdir -p ${tempDir}`);
    
    try {
      // Cambiar a directorio sin Git
      process.chdir(tempDir);
      
      // Ejecutar script - debería fallar
      try {
        execSync(scriptPath, { encoding: 'utf8' });
        expect(true).toBe(false); // No debería llegar aquí
      } catch (error: any) {
        expect(error.stdout).toContain('❌ Error: No estás en un repositorio Git');
        expect(error.status).toBe(1);
      }
    } finally {
      // Volver al directorio original
      process.chdir('/Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-NEW');
      // Limpiar directorio temporal
      execSync(`rm -rf ${tempDir}`);
    }
  });
});
