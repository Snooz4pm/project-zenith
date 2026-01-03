'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { VersionedTransaction } from '@solana/web3.js';
import { ArrowDown, Loader2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SOL_MINT } from '@/lib/solana/config';
import { getSolanaTokenMetadata, getSolanaFallbackLogo, parseSolanaTokenAmount } from '@/lib/solana/token-metadata';

export interface SolanaToken {
  symbol: string;
  mint: string;
  decimals: number;
  name?: string;
  logo?: string;
}

interface SolanaSwapPanelProps {
  selectedToken: SolanaToken | null;
  onSwapComplete?: () => void;
}

export default function SolanaSwapPanel({ selectedToken, onSwapComplete }: SolanaSwapPanelProps) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [sellAmount, setSellAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapState, setSwapState] = useState<'idle' | 'quote' | 'swapping' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const metadata = selectedToken ? getSolanaTokenMetadata(selectedToken.symbol) : null;

  // Reset state when token changes
  useEffect(() => {
    setSellAmount('');
    setQuote(null);
    setError(null);
    setSwapState('idle');
    setTxSignature(null);
  }, [selectedToken?.mint]);

  // Fetch quote when sellAmount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!sellAmount || parseFloat(sellAmount) <= 0 || !selectedToken || !publicKey) {
        setQuote(null);
        return;
      }

      setIsLoadingQuote(true);
      setError(null);

      try {
        const sellAmountLamports = parseSolanaTokenAmount(sellAmount, 9); // SOL has 9 decimals

        const response = await fetch(
          `/api/arena/jupiter/quote?` +
            `inputMint=${SOL_MINT}` +
            `&outputMint=${selectedToken.mint}` +
            `&amount=${sellAmountLamports}` +
            `&slippageBps=50` // 0.5% slippage
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get quote');
        }

        const data = await response.json();
        setQuote(data.quote);
        setSwapState('quote');
      } catch (err: any) {
        console.error('Quote error:', err);
        setError(err.message || 'Failed to get quote');
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 600);
    return () => clearTimeout(debounce);
  }, [sellAmount, selectedToken, publicKey]);

  const handleSwap = async () => {
    if (!quote || !selectedToken || !publicKey) return;

    setSwapState('swapping');
    setError(null);

    try {
      // Get swap transaction from Jupiter
      const swapResponse = await fetch('/api/arena/jupiter/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
        }),
      });

      if (!swapResponse.ok) {
        const errorData = await swapResponse.json();
        throw new Error(errorData.error || 'Failed to create swap transaction');
      }

      const { swap } = await swapResponse.json();

      // Deserialize and send transaction
      const swapTransactionBuf = Buffer.from(swap.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Record swap to database
      await recordSwap(signature);

      setSwapState('success');
      onSwapComplete?.();
    } catch (err: any) {
      console.error('Swap error:', err);
      setError(err.message || 'Swap failed');
      setSwapState('error');
    }
  };

  const recordSwap = async (signature: string) => {
    if (!selectedToken || !publicKey) return;

    try {
      await fetch('/api/arena/jupiter/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          sellToken: 'SOL',
          sellTokenAddress: SOL_MINT,
          buyToken: selectedToken.symbol,
          buyTokenAddress: selectedToken.mint,
          sellAmount: quote.inAmount,
          buyAmount: quote.outAmount,
          sellAmountUSD: parseFloat(sellAmount) * 1, // Would need actual SOL price
          txHash: signature,
        }),
      });
    } catch (err) {
      console.error('Failed to record swap:', err);
    }
  };

  const getButtonState = () => {
    if (!connected) {
      return { text: 'Connect Solana Wallet', disabled: true, onClick: () => {} };
    }

    if (!selectedToken) {
      return { text: 'Select Token', disabled: true, onClick: () => {} };
    }

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      return { text: 'Enter Amount', disabled: true, onClick: () => {} };
    }

    if (isLoadingQuote) {
      return { text: 'Getting Quote...', disabled: true, onClick: () => {} };
    }

    if (!quote) {
      return { text: 'No Quote Available', disabled: true, onClick: () => {} };
    }

    if (swapState === 'swapping') {
      return { text: 'Executing Swap...', disabled: true, onClick: () => {} };
    }

    return { text: `Buy ${selectedToken.symbol}`, disabled: false, onClick: handleSwap };
  };

  const button = getButtonState();

  // Success state
  if (swapState === 'success' && txSignature) {
    const explorerUrl = `https://solscan.io/tx/${txSignature}`;

    return (
      <div className="bg-[#111116] border border-white/10 rounded-xl p-6">
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Swap Successful!</h3>
          <p className="text-zinc-400 text-sm mb-6">
            Your transaction has been confirmed on Solana
          </p>

          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-emerald-500 rounded-lg transition-colors"
          >
            View on Solscan
            <ExternalLink size={14} />
          </a>

          <button
            onClick={() => {
              setSwapState('idle');
              setSellAmount('');
              setQuote(null);
              setTxSignature(null);
            }}
            className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors"
          >
            Make Another Swap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111116] border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Solana Swap</h3>
        <div className="text-xs text-emerald-500 font-bold">1% FEE INCLUDED</div>
      </div>

      {!connected && (
        <div className="mb-4">
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-500 !rounded-lg !font-bold !text-sm !py-3 w-full" />
        </div>
      )}

      {/* Sell Input */}
      <div className="bg-[#0a0a0f] rounded-lg p-4 mb-2">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-zinc-500">You Pay</span>
          <span className="text-xs text-zinc-500">Balance: --</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-2xl font-mono text-white outline-none w-full"
            step="0.01"
            disabled={!connected}
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-emerald-500/20 border border-purple-500/30 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-emerald-400" />
            <span className="font-bold text-white text-sm">SOL</span>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center -my-1 relative z-10">
        <div className="bg-[#111116] p-2 rounded-full border border-white/10">
          <ArrowDown size={16} className="text-zinc-500" />
        </div>
      </div>

      {/* Buy Output */}
      <div className="bg-[#0a0a0f] rounded-lg p-4 mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-zinc-500">You Receive</span>
          {quote && <span className="text-xs text-emerald-500">BEST PRICE</span>}
        </div>
        <div className="flex items-center gap-3">
          {selectedToken && (
            <img
              src={metadata?.logo || getSolanaFallbackLogo(selectedToken.symbol, metadata?.color)}
              alt={selectedToken.symbol}
              className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = getSolanaFallbackLogo(selectedToken.symbol, metadata?.color);
              }}
            />
          )}
          <div className="text-2xl font-mono text-white flex-1 truncate">
            {quote
              ? (parseInt(quote.outAmount) / Math.pow(10, selectedToken?.decimals || 9)).toFixed(6)
              : '0.0'
            }
          </div>
          <div className="px-3 py-1.5 bg-white/5 rounded-lg font-medium text-white text-sm whitespace-nowrap flex-shrink-0">
            {selectedToken?.symbol || 'TOKEN'}
          </div>
        </div>
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="bg-[#0a0a0f] rounded-lg p-3 mb-4 space-y-2 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Price Impact</span>
            <span className="text-white">{parseFloat(quote.priceImpactPct).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Platform Fee</span>
            <span className="text-emerald-500">1.0% + 0.1% REFERRAL</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Network</span>
            <span className="text-purple-400">Solana</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-xs text-red-500">{error}</span>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={button.onClick}
        disabled={button.disabled}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
          button.disabled
            ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white'
        }`}
      >
        {swapState === 'swapping' && <Loader2 className="w-5 h-5 animate-spin" />}
        {button.text}
      </button>

      {/* Disclaimer */}
      <p className="text-[10px] text-zinc-600 mt-3 text-center">
        Non-custodial. Powered by Jupiter. 1.1% total fee per swap.
      </p>
    </div>
  );
}
