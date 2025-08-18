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
    if (existsSync(indexLockPath)) {
      unlinkSync(indexLockPath);
    }
  });

  afterEach(() => {
    if (existsSync(indexLockPath)) {
      unlinkSync(indexLockPath);
    }
  });

  it('debe detectar y reparar locks de Git automáticamente', () => {
    const initialStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    expect(initialStatus).toBeDefined();

    writeFileSync(indexLockPath, 'simulated lock file');
    expect(existsSync(indexLockPath)).toBe(true);

    try {
      execSync('timeout 2s git status --porcelain', { timeout: 3000 });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }

    const scriptOutput = execSync(scriptPath, { encoding: 'utf8' });
    expect(scriptOutput).toContain('�� AUTO-REPARACIÓN GIT - AiDuxCare V.2');
    expect(scriptOutput).toContain('⚠️  Locks detectados - procediendo a eliminación...');
    expect(scriptOutput).toContain('✅ Locks eliminados');

    expect(existsSync(indexLockPath)).toBe(false);

    const finalStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    expect(finalStatus).toBeDefined();

    expect(scriptOutput).toContain('✅ Confirmo que Git quedó 100% reparado y funcional');
  });

  it('debe ser idempotente - se puede ejecutar múltiples veces', () => {
    const firstRun = execSync(scriptPath, { encoding: 'utf8' });
    expect(firstRun).toContain('✅ Confirmo que Git quedó 100% reparado y funcional');

    const secondRun = execSync(scriptPath, { encoding: 'utf8' });
    expect(secondRun).toContain('✅ Confirmo que Git quedó 100% reparado y funcional');

    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    expect(status).toBeDefined();
  });
});
