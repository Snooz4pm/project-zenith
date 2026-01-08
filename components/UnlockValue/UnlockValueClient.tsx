'use client';
import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { useUnlockValueStore } from './UnlockValueStore';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function UnlockValueClient() {
  const wallet = useWallet();
  const { publicKey, connected, sendTransaction } = wallet;
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

    console.log('[Unlock] Starting claim process...');
    console.log('[Unlock] Wallet connected:', connected);
    console.log('[Unlock] Public key:', publicKey?.toBase58());
    console.log('[Unlock] Accounts to claim:', accounts.length);

    // Safety Checks
    if (!connected) {
      console.error('[Unlock] Wallet not connected!');
      setVisible(true);
      return;
    }

    if (!publicKey) {
      console.error('[Unlock] No public key available!');
      return;
    }

    if (!sendTransaction) {
      console.error('[Unlock] Wallet does not support transactions!');
      store.setError("Wallet does not support transaction sending. Please use Phantom or Solflare.");
      return;
    }

    if (!accounts.length) {
      console.error('[Unlock] No accounts to claim!');
      return;
    }

    setClaimStatus('Preparing transactions...');
    store.setError(null);

    try {
      // 1. Get Batches from API
      console.log('[Unlock] Fetching transaction batches from API...');
      const res = await fetch('/api/unlock/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: publicKey.toBase58(),
          accounts,
        }),
      });

      const data = await res.json();
      console.log('[Unlock] API Response:', data);

      if (!res.ok) throw new Error(data.error || 'Claim failed');

      const { batches } = data; // Array of base64 strings
      if (!batches || !batches.length) throw new Error('No transactions returned');

      console.log('[Unlock] Received', batches.length, 'transaction batches');
      setTotalBatches(batches.length);
      setProcessingIndex(0);

      // 2. Sequential Signing Loop
      for (let i = 0; i < batches.length; i++) {
        setProcessingIndex(i + 1);
        setClaimStatus(`Signing batch ${i + 1} of ${batches.length}...`);

        console.log(`[Unlock] Processing batch ${i + 1}/${batches.length}`);

        // Deserialize transaction (Versioned) - use Uint8Array instead of Buffer
        const txBase64 = batches[i];
        const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
        const tx = VersionedTransaction.deserialize(txBytes);

        console.log(`[Unlock] Batch ${i + 1}: Transaction deserialized successfully`);

        try {
          console.log(`[Unlock] Batch ${i + 1}: Opening wallet for signature...`);

          // Use sendTransaction for VersionedTransactions (it will prompt the wallet)
          const sig = await sendTransaction(tx, connection, {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          });

          console.log(`[Unlock] Batch ${i + 1}: Transaction sent! Signature: ${sig}`);
          setClaimStatus(`Confirming batch ${i + 1}...`);

          // Wait for confirmation with latest blockhash
          const latestBlockhash = await connection.getLatestBlockhash('confirmed');
          const confirmation = await connection.confirmTransaction({
            signature: sig,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          }, 'confirmed');

          if (confirmation.value.err) {
            console.error(`[Unlock] Batch ${i + 1}: Transaction failed on-chain:`, confirmation.value.err);
            throw new Error(`Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
          }

          console.log(`[Unlock] Batch ${i + 1}: Confirmed successfully!`);

        } catch (err: any) {
          console.error(`[Unlock] Batch ${i + 1} Failed:`, err);
          console.error('[Unlock] Error details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });

          // User-friendly error messages
          if (err.message?.includes('User rejected')) {
            throw new Error('Transaction was rejected in your wallet');
          }
          throw new Error(err.message || 'Transaction failed');
        }
      }

      // 3. Success State
      console.log('[Unlock] All transactions completed successfully!');
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <h1 className="text-3xl font-bold text-white font-mono tracking-tight">UNLOCK VALUE SCANNER</h1>
        </div>
        <p className="text-zinc-400 text-sm font-mono ml-5">
          &gt; Deep scan wallet for <span className="text-emerald-400">recoverable on-chain value</span><br />
          &gt; Non-custodial • Zero deposits • Full control
        </p>
      </div>

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
          <div className="p-8 bg-zinc-900/50 rounded border border-zinc-800 text-center backdrop-blur-sm">
            <div className="mb-4 text-zinc-500 font-mono text-sm">
              &gt; WALLET CONNECTION REQUIRED
            </div>
            <button
              onClick={() => setVisible(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono font-medium transition-all hover:shadow-lg hover:shadow-emerald-900/50"
            >
              [ CONNECT WALLET ]
            </button>
          </div>
        ) : store.loading ? (
          // 🔥 SCANNING ANIMATION
          <div className="relative p-8 bg-zinc-900/50 rounded border border-emerald-500/30 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent animate-pulse" />

            {/* Scanner Line Animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan" />
            </div>

            <div className="relative z-10 text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <div className="text-emerald-400 font-mono text-lg font-bold tracking-wider">
                  SCANNING WALLET
                </div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>

              <div className="space-y-2 text-left max-w-md mx-auto font-mono text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">&gt;</span> Analyzing token accounts...
                  <div className="flex gap-1 ml-auto">
                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping delay-75" />
                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping delay-150" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">&gt;</span> Checking rent balances...
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">&gt;</span> Detecting recoverable value...
                </div>
              </div>

              <div className="pt-4">
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full animate-progress" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between bg-zinc-900/50 p-6 rounded border border-zinc-800 backdrop-blur-sm">
              <div>
                <div className="text-sm font-mono text-zinc-500 mb-1">&gt; TOTAL RECOVERABLE</div>
                <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">{totalSol.toFixed(4)} SOL</div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={runScan}
                  disabled={!!claimStatus}
                  className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-mono font-medium disabled:opacity-50 transition-all border border-zinc-600 hover:border-zinc-500"
                >
                  {store.loading ? '[ SCANNING... ]' : '[ SCAN ]'}
                </button>

                {totalSol > 0 && (
                  <button
                    onClick={handleClaimClick}
                    disabled={!!claimStatus}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono font-medium disabled:opacity-50 shadow-lg shadow-emerald-900/20 transition-all border border-emerald-500 hover:border-emerald-400"
                  >
                    [ CLAIM {totalSol.toFixed(4)} SOL ]
                  </button>
                )}
              </div>
            </div>

            {/* NO RESULTS MESSAGE */}
            {store.lastScan && totalSol === 0 && store.recoverable.length === 0 && store.dust.length === 0 && (
              <div className="relative p-8 bg-zinc-900/30 rounded border border-zinc-700/50 backdrop-blur-sm">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-zinc-500">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="font-mono text-lg text-zinc-400">
                    SCAN COMPLETE
                  </div>
                  <div className="font-mono text-sm text-zinc-500">
                    &gt; No recoverable value detected<br />
                    &gt; Your wallet is optimized
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-8">
              <Section
                title="[ RECLAIMABLE RENT - EMPTY ACCOUNTS ]"
                items={store.recoverable}
                renderItem={(item) => (
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm text-zinc-300">{item.mint}</span>
                      <span className="text-xs text-zinc-500 font-mono">&gt; Rent-exempt reserve</span>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold">+{item.rentSol} SOL</span>
                  </div>
                )}
              />
              <Section
                title="[ DUST - LOW BALANCE TOKENS ]"
                items={store.dust}
                renderItem={(item) => (
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm text-zinc-400">{item.mint}</span>
                    <span className="text-zinc-500 font-mono">{item.amount.toExponential(2)}</span>
                  </div>
                )}
              />
            </div>

            <div className="text-center text-xs text-zinc-500 mt-12 font-mono">
              &gt; Transactions executed <strong className="text-emerald-400">directly on-chain</strong><br />
              &gt; ZenithScores has <strong className="text-emerald-400">zero access</strong> to your wallet
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
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
        <h2 className="text-lg font-bold font-mono text-white tracking-wide">{title}</h2>
        <span className="text-sm font-mono text-zinc-500">({items.length})</span>
      </div>
      <div className="grid gap-2">
        {items.map((item, i) => (
          <div key={i} className="bg-zinc-900/50 p-4 rounded border border-zinc-800/50 hover:border-emerald-500/30 transition-all backdrop-blur-sm">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
