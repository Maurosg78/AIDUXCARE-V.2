// scripts/mem-watch.cjs
const usage = process.memoryUsage();

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function logMemory(label) {
  const mem = process.memoryUsage();
  console.error(`[MEM] ${label}: heapUsed=${formatBytes(mem.heapUsed)} heapTotal=${formatBytes(mem.heapTotal)} rss=${formatBytes(mem.rss)}`);
}

logMemory('start');

// Log cada 2 segundos
const interval = setInterval(() => {
  logMemory(new Date().toISOString());
}, 2000);

// Cleanup on exit
process.on('exit', () => {
  clearInterval(interval);
  logMemory('exit');
});

