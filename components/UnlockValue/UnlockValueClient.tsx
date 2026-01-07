'use client';
import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { useUnlockValueStore } from './UnlockValueStore';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function UnlockValueClient() {
  const { publicKey, connected, signTransaction, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const store = useUnlockValueStore();
  const [totalSol, setTotalSol] = useState<number>(0);
  const [claimStatus, setClaimStatus] = useState<string>('');

  // 2️⃣ Frontend: Scan Logic
  async function runScan() {
    if (!connected) {
      setVisible(true);
      return;
    }
    if (!publicKey) return;

    store.loading = true;
    store.setError(null);
    setClaimStatus('');
    try {
      const res = await fetch(`/api/unlock/scan?address=${publicKey.toBase58()}`);
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();

      store.recoverable = data.reclaimable || [];
      store.dust = data.dust || [];
      store.lastScan = Date.now();
      setTotalSol(data.totalSol || 0);

    } catch (err: any) {
      store.setError(err.message || 'Scan failed');
    } finally {
      store.loading = false;
    }
  }

  // 4️⃣ Frontend: Claim Flow (Wallet Signature)
  async function claim(accounts: string[]) {
    if (!publicKey || !signTransaction) return;

    setClaimStatus('Preparing transaction...');
    try {
      const res = await fetch('/api/unlock/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: publicKey.toBase58(),
          accounts,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');

      const { transaction } = data;

      setClaimStatus('Requesting signature...');
      const tx = Transaction.from(Buffer.from(transaction, 'base64'));

      const signed = await signTransaction(tx);

      setClaimStatus('Sending transaction...');
      const sig = await connection.sendRawTransaction(signed.serialize());

      setClaimStatus(`Confirming: ${sig.slice(0, 8)}...`);
      await connection.confirmTransaction(sig, 'confirmed');

      setClaimStatus('Success! SOL Reclaimed.');
      // Refresh scan
      await runScan();
    } catch (err: any) {
      console.error(err);
      store.setError(err.message || 'Claim failed');
      setClaimStatus('');
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* 5️⃣ UI COPY (IMPORTANT – TRUST SIGNAL) */}
      <h1 className="text-3xl font-bold mb-2 text-white">Unlock Value</h1>
      <p className="text-zinc-400 mb-6">
        Scan your wallet for <strong>recoverable on-chain value</strong>.<br />
        No deposits. No custody. You keep full control.
      </p>

      {store.error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4">{store.error}</div>}

      {claimStatus && (
        <div className="bg-blue-500/10 text-blue-400 p-3 rounded mb-4 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          {claimStatus}
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-6">
        {!connected ? (
          <div className="p-8 bg-zinc-900 rounded border border-zinc-800 text-center text-zinc-500">
            <button
              onClick={() => setVisible(true)}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
            >
              Connect Wallet to Scan
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between bg-zinc-900/50 p-6 rounded border border-zinc-800">
              <div>
                <div className="text-lg font-medium text-white">Total Recoverable</div>
                <div className="text-3xl font-bold text-emerald-400">{totalSol.toFixed(4)} SOL</div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={runScan}
                  disabled={store.loading || !!claimStatus}
                  className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-medium disabled:opacity-50"
                >
                  {store.loading ? 'Scanning...' : 'Scan Wallet'}
                </button>

                {totalSol > 0 && (
                  <button
                    onClick={() => claim(store.recoverable.map(i => i.pubkey))}
                    disabled={!!claimStatus}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium disabled:opacity-50"
                  >
                    Claim {totalSol.toFixed(4)} SOL
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <Section
                title="Reclaimable Rent (Empty Accounts)"
                items={store.recoverable}
                renderItem={(item) => (
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm text-zinc-400">{item.mint}</span>
                    <span className="text-emerald-400 font-mono">+{item.rentSol} SOL</span>
                  </div>
                )}
              />
              <Section
                title="Dust (Low Balance)"
                items={store.dust}
                renderItem={(item) => (
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm text-zinc-400">{item.mint}</span>
                    <span className="text-zinc-500 font-mono">{item.amount.toExponential(2)}</span>
                  </div>
                )}
              />
            </div>

            <div className="text-center text-xs text-zinc-500 mt-12">
              Transactions are executed <strong>directly on-chain</strong>.<br />
              ZenithScores never has access to your wallet.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, items, renderItem }: { title: string; items: any[], renderItem: (item: any) => React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3 text-white">{title} <span className="text-sm font-normal text-zinc-500">({items.length})</span></h2>
      <div className="grid gap-2">
        {items.map((item, i) => (
          <div key={i} className="bg-zinc-900 p-3 rounded border border-zinc-800/50">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
