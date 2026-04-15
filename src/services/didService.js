import { db } from '../data/store.js';
import { caAdapter } from '../adapters/caAdapter.js';

export function registerDid({ did, subject }) {
  const exists = db.didProfiles.find((x) => x.did === did);
  if (exists) return exists;
  const cert = caAdapter.issueCertificate({ did, subject });
  const profile = { did, subject, cert, status: 'active', createdAt: Date.now() };
  db.didProfiles.push(profile);
  return profile;
}

export function revokeDid(did) {
  const profile = db.didProfiles.find((x) => x.did === did);
  if (!profile) return null;
  profile.status = 'revoked';
  profile.revokedAt = Date.now();
  return profile;
}

export function listDid() {
  return db.didProfiles;
}
