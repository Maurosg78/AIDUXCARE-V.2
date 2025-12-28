function summarize(h) {
  try {
    const name = (h && h.constructor && h.constructor.name) ? h.constructor.name : typeof h;

    if (name === 'ChildProcess') {
      const pid = h.pid;
      const spawnfile = h.spawnfile || h._handle?.spawnfile;
      const args = h.spawnargs || h.spawnargs;
      return `ChildProcess pid=${pid} spawnfile=${spawnfile} args=${Array.isArray(args) ? args.join(' ') : ''}`.trim();
    }

    if (name === 'Timeout' || name === 'Immediate') {
      const t = h?._idleTimeout;
      return `${name}${t != null ? ` idleTimeout=${t}` : ''}`;
    }

    if (name === 'Socket') {
      const local = h.localAddress ? `${h.localAddress}:${h.localPort}` : '';
      const remote = h.remoteAddress ? `${h.remoteAddress}:${h.remotePort}` : '';
      return `Socket ${local} -> ${remote}`.trim();
    }

    if (name === 'MessagePort') {
      const hasRef = typeof h.ref === 'function';
      const hasUnref = typeof h.unref === 'function';
      return `MessagePort ref=${hasRef} unref=${hasUnref}`;
    }

    if (name === 'WriteStream' || name === 'ReadStream') {
      const path = h.path || '';
      return `${name} ${path}`.trim();
    }

    return name;
  } catch (e) {
    return 'UnknownHandle';
  }
}

function dump(where) {
  try {
    const handles = process._getActiveHandles?.() ?? [];
    const requests = process._getActiveRequests?.() ?? [];
    console.error(`\n[HANDLES] ${where}: handles=${handles.length} requests=${requests.length}`);
    for (const h of handles) console.error(' -', summarize(h));
    if (requests.length) {
      console.error('[REQUESTS]');
      for (const r of requests) console.error(' -', summarize(r));
    }
  } catch (e) {
    console.error('[HANDLES] dump failed', e);
  }
}

process.on('SIGINT', () => { dump('SIGINT'); process.exit(130); });
process.on('beforeExit', () => dump('beforeExit'));
