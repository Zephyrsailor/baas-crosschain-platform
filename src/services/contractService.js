import crypto from 'node:crypto';
import { db } from '../data/store.js';

export function deployContract({ templateId, chainIds = [], params = {} }) {
  const jobId = `deploy-${crypto.randomUUID()}`;
  const results = chainIds.map((chainId, idx) => ({
    chainId,
    deployStatus: 'SUCCESS',
    contractAddress: `0x${(idx + 1).toString(16).padStart(40, '0')}`,
    error: null,
  }));

  const job = { jobId, templateId, params, results, createdAt: Date.now() };
  db.contracts.push(job);
  return job;
}

export function getDeployJob(jobId) {
  return db.contracts.find((x) => x.jobId === jobId) ?? null;
}
