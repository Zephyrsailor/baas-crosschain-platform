import { db } from '../data/store.js';

export function listChainsAndNodes() {
  return {
    chains: db.chains,
    nodes: db.nodes,
  };
}

export function setNodeHealth(nodeId, healthy) {
  const node = db.nodes.find((n) => n.nodeId === nodeId);
  if (!node) return null;
  node.healthy = Boolean(healthy);
  return node;
}

export function alerts() {
  const unhealthy = db.nodes.filter((n) => !n.healthy);
  return unhealthy.map((n) => ({
    level: 'critical',
    type: 'node_offline',
    nodeId: n.nodeId,
    chainId: n.chainId,
  }));
}
