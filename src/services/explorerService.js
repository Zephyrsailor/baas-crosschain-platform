import { db } from '../data/store.js';

export function overview() {
  return db.chains.map((c) => ({
    chainId: c.chainId,
    name: c.name,
    status: c.status,
    height: c.height,
    tps: 120,
    tx24h: 9000,
  }));
}

export function search(q) {
  const key = String(q || '').trim();
  const tasks = db.onchainTasks.filter((t) => t.taskId.includes(key) || t.txHash.includes(key));
  const chains = db.chains.filter((c) => c.chainId.includes(key) || c.name.includes(key));
  return { tasks, chains };
}
