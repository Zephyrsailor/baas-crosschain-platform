import { db } from '../data/store.js';

export function permissionsOf(userId) {
  const user = db.users.find((u) => u.userId === userId);
  if (!user) return [];
  const perms = new Set();
  for (const role of user.roles) {
    for (const p of db.roles[role] ?? []) perms.add(p);
  }
  return [...perms];
}

export function authorize(userId, requiredPerm) {
  return permissionsOf(userId).includes(requiredPerm);
}
