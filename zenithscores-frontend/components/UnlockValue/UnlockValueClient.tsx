'use client';
import React, { useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useUnlockValueStore } from './UnlockValueStore';
import { runUnlockValueScan } from './UnlockValueScanner';

export default function UnlockValueClient() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const store = useUnlockValueStore();
  const lastWallet = useRef<string | null>(null);

  useEffect(() => {
    if (connected && publicKey && lastWallet.current !== publicKey.toString()) {
      lastWallet.current = publicKey.toString();
      runUnlockValueScan(connection, publicKey);
    }
  }, [connected, publicKey, connection]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2 text-white">UNLOCK VALUE</h1>
      <p className="text-zinc-400 mb-6">Deep scan your wallet for hidden, recoverable value.<br />No deposits. No promises. You keep full control.</p>
      {store.error && <div className="bg-red-500/10 text-red-400 p-2 rounded mb-4">{store.error}</div>}
      <button onClick={() => runUnlockValueScan(connection, publicKey!)} disabled={store.loading || !connected} className="mb-6 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded">{store.loading ? 'Scanning...' : 'Refresh Scan'}</button>
      <div className="space-y-8">
        <Section title="Recoverable" items={store.recoverable} />
        <Section title="Dust" items={store.dust} />
        <Section title="Idle" items={store.idle} />
        <Section title="Structure" items={store.structure} />
        <Section title="Optimization" items={store.optimization} />
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: any[] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-white">{title}</h2>
      {items.length === 0 ? (
        <div className="text-zinc-500">No items found.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="bg-white/5 p-3 rounded text-white">{JSON.stringify(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
