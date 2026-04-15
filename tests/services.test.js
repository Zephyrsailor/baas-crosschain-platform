import test from 'node:test';
import assert from 'node:assert/strict';
import { submitOnchain } from '../src/services/onchainService.js';
import { deployContract } from '../src/services/contractService.js';
import { registerDid, revokeDid } from '../src/services/didService.js';
import { authorize } from '../src/iam/rbac.js';

test('onchain 幂等 requestId', () => {
  const a = submitOnchain({ tenantId: 't1', chainId: 'evm-testnet', bizKey: 'k1', payload: { x: 1 } });
  const b = submitOnchain({ tenantId: 't1', chainId: 'evm-testnet', bizKey: 'k1', payload: { x: 1 } });
  assert.equal(a.requestId, b.requestId);
  assert.equal(a.taskId, b.taskId);
});

test('跨链部署返回逐链结果', () => {
  const job = deployContract({ templateId: 'tpl-1', chainIds: ['evm-testnet', 'fisco-dev'] });
  assert.equal(job.results.length, 2);
  assert.equal(job.results[0].deployStatus, 'SUCCESS');
});

test('部署 jobId 不冲突', () => {
  const a = deployContract({ templateId: 'tpl-a', chainIds: ['evm-testnet'] });
  const b = deployContract({ templateId: 'tpl-b', chainIds: ['evm-testnet'] });
  assert.notEqual(a.jobId, b.jobId);
});

test('DID 注册与撤销', () => {
  const p = registerDid({ did: 'did:gfshui:001', subject: '企业A' });
  assert.equal(p.status, 'active');
  const r = revokeDid('did:gfshui:001');
  assert.equal(r.status, 'revoked');
});

test('RBAC 权限校验', () => {
  assert.equal(authorize('u-admin', 'contract:deploy'), true);
  assert.equal(authorize('u-ops', 'contract:deploy'), false);
});
