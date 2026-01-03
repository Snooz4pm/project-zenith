"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet/WalletContext";
import { X, ArrowDown, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

type Token = {
  address: string;
  symbol: string;
  name: string;
  chainType?: 'SOLANA' | 'EVM';
};

export function SwapDrawer({
  isOpen,
  onClose,
  token
}: {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
}) {
  const { address, chainType, connect, signAndSendTx } = useWallet();

  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setQuote(null);
      setError(null);
      setTxHash(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // Fetch quote when amount changes
  useEffect(() => {
    if (!amount || !address || !token || !chainType) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setLoading(true);
      setError(null);

      try {
        // Determine native token
        const sellToken = chainType === 'SOLANA'
          ? 'So11111111111111111111111111111111111111112' // SOL
          : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // ETH

        // Convert amount to lamports/wei (simple: amount * 1e9 for now)
        const amountInSmallestUnit = (parseFloat(amount) * 1e9).toString();

        const res = await fetch("/api/swap/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chainType,
            sellToken,
            buyToken: token.address,
            amount: amountInSmallestUnit,
            userAddress: address
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch quote');
        }

        const data = await res.json();
        setQuote(data);
      } catch (err: any) {
        console.error('[SwapDrawer] Quote error:', err);
        setError(err.message || "Failed to fetch quote");
      } finally {
        setLoading(false);
      }
    };

    // Debounce quote fetching
    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [amount, address, chainType, token]);

  const executeSwap = async () => {
    if (!quote || !address || !chainType) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainType,
          quote,
          quoteResponse: quote, // Jupiter needs this
          userPublicKey: address, // Solana
          userAddress: address, // EVM
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to build transaction');
      }

      const txPayload = await res.json();

      // Sign and send transaction
      const hash = await signAndSendTx(txPayload);
      setTxHash(hash);
      setSuccess(true);

      // Reset form after successful swap
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      console.error('[SwapDrawer] Swap error:', err);
      setError(err.message || "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !token) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-[#0a0a0f] text-white border-l border-white/10 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">Swap</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <X size={20} className="text-zinc-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!address ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">Connect your wallet to swap</p>
            <button
              onClick={connect}
              className="px-6 py-3 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : success ? (
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Swap Successful!</h3>
            {txHash && (
              <a
                href={chainType === 'SOLANA'
                  ? `https://solscan.io/tx/${txHash}`
                  : `https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-500 hover:underline text-sm"
              >
                View transaction
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        ) : (
          <>
            {/* You Pay */}
            <div className="mb-2">
              <label className="text-sm text-zinc-400 block mb-2">You Pay</label>
              <div className="bg-[#111116] rounded-lg p-4">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-semibold outline-none"
                />
                <div className="text-sm text-zinc-500 mt-2">
                  {chainType === 'SOLANA' ? 'SOL' : 'ETH'}
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-1 relative z-10">
              <div className="p-2 bg-[#0a0a0f] border border-white/10 rounded-lg">
                <ArrowDown size={16} className="text-zinc-400" />
              </div>
            </div>

            {/* You Receive */}
            <div className="mb-4">
              <label className="text-sm text-zinc-400 block mb-2">You Receive (Estimated)</label>
              <div className="bg-[#111116] rounded-lg p-4">
                <div className="text-2xl font-semibold">
                  {loading ? '...' : quote ? (Number(quote.buyAmount) / 1e9).toFixed(6) : '0.0'}
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  {token.symbol}
                </div>
              </div>
            </div>

            {/* Quote Details */}
            {quote && !loading && (
              <div className="bg-[#111116] rounded-lg p-3 mb-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Slippage</span>
                  <span>Auto (0.5%)</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Route</span>
                  <span>Best price</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Fee</span>
                  <span>{quote.fee?.percentage || 0}%</span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Swap Button */}
            <button
              onClick={executeSwap}
              disabled={!quote || loading || !amount}
              className="w-full py-4 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Swap'}
            </button>

            {/* Disclaimer */}
            <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-500/80 text-center">
                ⚠️ Swaps are non-custodial. Verify transaction before signing.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
