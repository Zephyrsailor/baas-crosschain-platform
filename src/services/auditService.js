import { db } from '../data/store.js';

export function appendAudit(record) {
  db.auditLogs.push({ ...record, ts: new Date().toISOString() });
}

export function listAudits(limit = 100) {
  return db.auditLogs.slice(-limit);
}
