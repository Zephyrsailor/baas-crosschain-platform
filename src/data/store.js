export const db = {
  chains: [
    { chainId: 'evm-testnet', name: 'EVM Testnet', status: 'healthy', height: 123456 },
    { chainId: 'fisco-dev', name: 'FISCO Dev', status: 'healthy', height: 88991 },
  ],
  nodes: [
    { nodeId: 'n-evm-1', chainId: 'evm-testnet', url: 'http://node-evm-1', healthy: true, weight: 100 },
    { nodeId: 'n-fisco-1', chainId: 'fisco-dev', url: 'http://node-fisco-1', healthy: true, weight: 100 },
  ],
  onchainTasks: [],
  contracts: [],
  didProfiles: [],
  auditLogs: [],
  users: [
    { userId: 'u-admin', username: 'admin', roles: ['admin'] },
    { userId: 'u-ops', username: 'ops', roles: ['ops'] },
  ],
  roles: {
    admin: ['onchain:write', 'onchain:read', 'explorer:read', 'contract:deploy', 'did:write', 'chainops:write', 'iam:write'],
    ops: ['onchain:read', 'explorer:read', 'chainops:write'],
    viewer: ['explorer:read'],
  },
};
