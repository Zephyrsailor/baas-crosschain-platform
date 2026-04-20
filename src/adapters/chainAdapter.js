import { db } from '../data/store.js';

export class ChainAdapter {
  submitData({ chainId, payload }) {
    const chain = db.chains.find((c) => c.chainId === chainId);
    if (!chain) throw new Error('chain not found');
    const txHash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0').slice(0, 64)}`;
    return { txHash, chainId, payloadHash: this.hashPayload(payload) };
  }

  hashPayload(payload) {
    const raw = JSON.stringify(payload || {});
    let acc = 0;
    for (let i = 0; i < raw.length; i++) acc = (acc + raw.charCodeAt(i) * (i + 1)) % 1_000_000_007;
    return `h${acc}`;
  }
}

export const chainAdapter = new ChainAdapter();
