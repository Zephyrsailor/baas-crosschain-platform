import test from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.js';

async function withServer(fn) {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function req(port, path, options = {}) {
  return fetch(`http://127.0.0.1:${port}${path}`, options);
}

test('API 主链路可用', async () => {
  await withServer(async (port) => {
    const health = await req(port, '/api/v1/health');
    const h = await health.json();
    assert.equal(h.data.ok, true);

    const onchain = await req(port, '/api/v1/onchain/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'u-admin' },
      body: JSON.stringify({ tenantId: 't1', chainId: 'evm-testnet', bizKey: 'b1', payload: { hello: 'world' } }),
    });
    const o = await onchain.json();
    assert.equal(Boolean(o.data.taskId), true);

    const explorer = await req(port, '/api/v1/explorer/overview', { headers: { 'x-user-id': 'u-admin' } });
    const e = await explorer.json();
    assert.equal(Array.isArray(e.data), true);

    const forbidden = await req(port, '/api/v1/contracts/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'u-ops' },
      body: JSON.stringify({ templateId: 'tpl', chainIds: ['evm-testnet'] }),
    });
    assert.equal(forbidden.status, 403);
  });
});

test('缺失 x-user-id 时拒绝默认提权', async () => {
  await withServer(async (port) => {
    const res = await req(port, '/api/v1/onchain/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: 't1', chainId: 'evm-testnet', bizKey: 'b2', payload: {} }),
    });
    assert.equal(res.status, 401);
  });
});

test('敏感接口未授权访问拒绝', async () => {
  await withServer(async (port) => {
    const cases = [
      ['GET', '/api/v1/chainops', null, 'u-ghost'],
      ['POST', '/api/v1/did/register', { did: 'did:gfshui:002', subject: '企业B' }, 'u-ops'],
      ['GET', '/api/v1/did/list', null, 'u-ops'],
      ['GET', '/api/v1/audit/logs', null, 'u-ops'],
    ];

    for (const [method, path, body, userId] of cases) {
      const res = await req(port, path, {
        method,
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      assert.equal(res.status, 403, `${method} ${path} should be 403`);
    }
  });
});

test('非法 JSON 返回 400', async () => {
  await withServer(async (port) => {
    const res = await req(port, '/api/v1/contracts/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'u-admin' },
      body: '{"templateId":',
    });
    assert.equal(res.status, 400);
  });
});

test('超大 body 返回 413', async () => {
  await withServer(async (port) => {
    const large = 'a'.repeat(1024 * 1024 + 1);
    const res = await req(port, '/api/v1/contracts/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'u-admin' },
      body: JSON.stringify({ templateId: 'tpl', chainIds: ['evm-testnet'], params: { blob: large } }),
    });
    assert.equal(res.status, 413);
  });
});
