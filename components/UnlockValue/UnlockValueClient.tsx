'use client';
import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { useUnlockValueStore } from './UnlockValueStore';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import { Buffer } from 'buffer';

export default function UnlockValueClient() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const store = useUnlockValueStore();

  // Local state for scan/claim
  const [totalSol, setTotalSol] = useState<number>(0);
  const [claimStatus, setClaimStatus] = useState<string>('');
  const [processingIndex, setProcessingIndex] = useState<number>(0);
  const [totalBatches, setTotalBatches] = useState<number>(0);

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

  // Preview Logic
  const handleClaimClick = () => {
    store.setPreview(true);
  };

  const handleConfirmClaim = async () => {
    store.setPreview(false);
    await startClaimProcess();
  };

  // 4️⃣ Frontend: Claim Flow (Sequential Batching)
  async function startClaimProcess() {
    const accounts = store.recoverable.map(i => i.pubkey);

    // Safety Checks
    if (!publicKey) return;
    if (!sendTransaction) {
      store.setError("Wallet does not support transaction sending. Please use Phantom or Solflare.");
      return;
    }
    if (!accounts.length) return;

    setClaimStatus('Preparing transactions...');
    store.setError(null);

    try {
      // 1. Get Batches from API
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

      const { batches } = data; // Array of base64 strings
      if (!batches || !batches.length) throw new Error('No transactions returned');

      setTotalBatches(batches.length);
      setProcessingIndex(0);

      // 2. Sequential Signing Loop
      for (let i = 0; i < batches.length; i++) {
        setProcessingIndex(i + 1);
        setClaimStatus(`Signing batch ${i + 1} of ${batches.length}...`);

        // Deserialize transaction (Versioned)
        const txPath = batches[i];
        const tx = VersionedTransaction.deserialize(Buffer.from(txPath, 'base64'));

        try {
          console.log(`[Unlock] Batch ${i + 1}: Invoking wallet...`);

          // Use standard sendTransaction hook (handles Signing + Sending)
          const sig = await sendTransaction(tx, connection);

          console.log(`[Unlock] Batch ${i + 1}: Sent! Signature: ${sig}`);
          setClaimStatus(`Confirming batch ${i + 1}...`);

          await connection.confirmTransaction(sig, 'confirmed');
          console.log(`[Unlock] Batch ${i + 1}: Confirmed.`);

        } catch (err: any) {
          console.error(`[Unlock] Batch ${i + 1} Failed:`, err);
          throw new Error('Transaction failed or rejected by wallet.');
        }
      }

      // 3. Success State
      setClaimStatus('Success!');
      store.addRecovered(totalSol);

      // Refresh to clear UI
      await runScan();

    } catch (err: any) {
      console.error('[Unlock] Process Error:', err);
      store.setError(err.message || 'Claim failed');
    } finally {
      setClaimStatus('');
      setProcessingIndex(0);
      setTotalBatches(0);
    }
  }

  // Calculations for Preview
  const estimatedRefund = totalSol;
  const estimatedNetworkFee = store.recoverable.length * 0.000005 * 2; // rough estimate
  const netGain = estimatedRefund - estimatedNetworkFee;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 relative">
      {/* 5️⃣ UI COPY (IMPORTANT – TRUST SIGNAL) */}
      <h1 className="text-3xl font-bold mb-2 text-white">Unlock Value</h1>
      <p className="text-zinc-400 mb-6">
        Scan your wallet for <strong>recoverable on-chain value</strong>.<br />
        No deposits. No custody. You keep full control.
      </p>

      {/* Global Recovered Counter (Animation) */}
      {store.totalRecoveredSol > 0 && (
        <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div className="text-sm text-zinc-400">Total Recovered in Session</div>
            <div className="text-2xl font-bold text-emerald-400">+{store.totalRecoveredSol.toFixed(4)} SOL</div>
          </div>
        </div>
      )}

      {store.error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4">{store.error}</div>}

      {claimStatus && (
        <div className="bg-blue-500/10 text-blue-400 p-3 rounded mb-4 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          {claimStatus}
          {totalBatches > 0 && <span className="text-xs ml-2">({processingIndex}/{totalBatches})</span>}
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
                    onClick={handleClaimClick}
                    disabled={!!claimStatus}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium disabled:opacity-50 shadow-lg shadow-emerald-900/20"
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
                    <div className="flex flex-col">
                      <span className="font-mono text-sm text-zinc-300">{item.mint}</span>
                      <span className="text-xs text-zinc-500">Rent-exempt reserve</span>
                    </div>
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

      {/* Preview Modal */}
      {store.showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Reclaim</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Accounts to close</span>
                <span className="text-white">{store.recoverable.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Estimated refund</span>
                <span className="text-emerald-400 font-mono">+{estimatedRefund.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Network fee (est.)</span>
                <span className="text-red-400 font-mono">~{estimatedNetworkFee.toFixed(6)} SOL</span>
              </div>
              <div className="h-px bg-zinc-800 my-2" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-white">Net Gain</span>
                <span className="text-emerald-400 font-mono">~{netGain.toFixed(4)} SOL</span>
              </div>
            </div>

            <div className="bg-amber-900/20 text-amber-500 text-xs p-3 rounded mb-6 border border-amber-500/20">
              ⚠️ This action is <strong>irreversible</strong>. The token accounts will be closed and data removed.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => store.setPreview(false)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClaim}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}
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
