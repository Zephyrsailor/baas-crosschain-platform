import { db } from '../data/store.js';
import { chainAdapter } from '../adapters/chainAdapter.js';

export function submitOnchain({ tenantId, chainId, bizKey, payload }) {
  const payloadHash = chainAdapter.hashPayload(payload);
  const requestId = `${tenantId}:${bizKey}:${payloadHash}`;

  const existing = db.onchainTasks.find((x) => x.requestId === requestId);
  if (existing) return existing;

  const tx = chainAdapter.submitData({ chainId, payload });
  const task = {
    taskId: `task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    requestId,
    tenantId,
    chainId,
    bizKey,
    txHash: tx.txHash,
    status: 'SUCCESS',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  db.onchainTasks.push(task);
  return task;
}

export function getOnchainTask(taskId) {
  return db.onchainTasks.find((x) => x.taskId === taskId) ?? null;
}
