/// <reference types="node" />
/// <reference lib="dom" />
/// <reference path="./types/node-handles.d.ts" />

/**
 * Test Watchdog
 * 
 * Monitors active handles and requests in test environment
 * for debugging purposes
 */

import type { NodeHandle, NodeProcess } from './types/node-handles';

function summarize(h: NodeHandle): string {
    const name = h?.constructor?.name ?? typeof h;
    const pid = h?.pid ? ` pid=${h.pid}` : '';
    const fd = typeof h?.fd === 'number' ? ` fd=${h.fd}` : '';
    const ref = typeof h?.hasRef === 'function' ? ` ref=${h.hasRef()}` : '';
    return `${name}${pid}${fd}${ref}`;
}

function dump(where: string): void {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processWithHandles = process as any as NodeProcess;
        const handles: NodeHandle[] = processWithHandles._getActiveHandles?.() ?? [];
        const requests: unknown[] = processWithHandles._getActiveRequests?.() ?? [];
        const handlesLength = handles.length;
        const requestsLength = requests.length;
        // eslint-disable-next-line no-console
        console.error(`\n[WATCHDOG] ${where}: handles=${handlesLength} requests=${requestsLength}`);
        for (const h of handles) {
            // eslint-disable-next-line no-console
            console.error(' -', summarize(h));
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[WATCHDOG] dump failed', e);
    }
}

// imprime si el proceso sigue vivo a los 15s
const t = setTimeout(() => dump('15s'), 15_000);
// IMPORTANT: no impedir salida
if (typeof t === 'object' && t !== null && 'unref' in t && typeof t.unref === 'function') {
    t.unref();
}

// y de paso beforeExit
if (typeof process !== 'undefined' && process.on) {
    process.on('beforeExit', () => dump('beforeExit'));
}

