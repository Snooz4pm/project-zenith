/**
 * SwapReceipt Component
 * 
 * Terminal-style swap completion receipt.
 * Shows after successful swap execution.
 */

'use client';

import { CheckCircle, XCircle, ExternalLink, Copy, Loader2, ArrowRight, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SwapReceipt as SwapReceiptType, formatSwapReceipt, watchTransaction, updateSwapStatus } from '@/lib/hooks/useSwapHistory';

interface SwapReceiptProps {
  receipt: Partial<SwapReceiptType>;
  onClose?: () => void;
  autoWatch?: boolean;
}

export function SwapReceipt({ receipt, onClose, autoWatch = true }: SwapReceiptProps) {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>(
    (receipt.status as any) || 'pending'
  );
  const [copied, setCopied] = useState(false);

  // Watch transaction status
  useEffect(() => {
    if (!autoWatch || !receipt.txid || status !== 'pending') return;

    const unwatch = watchTransaction(receipt.txid, async (newStatus, error) => {
      setStatus(newStatus);
      
      // Update in database
      if (receipt.txid) {
        await updateSwapStatus(receipt.txid, newStatus, error);
      }
    });

    return unwatch;
  }, [receipt.txid, status, autoWatch]);

  const handleCopyTxid = () => {
    if (receipt.txid) {
      navigator.clipboard.writeText(receipt.txid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const explorerUrl = receipt.txid ? `https://solscan.io/tx/${receipt.txid}` : '#';

  return (
    <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {status === 'confirmed' && (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
          )}
          {status === 'failed' && (
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          )}
          {status === 'pending' && (
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold text-white">
              {status === 'confirmed' && 'Swap Completed'}
              {status === 'failed' && 'Swap Failed'}
              {status === 'pending' && 'Confirming...'}
            </h3>
            <p className="text-sm text-zinc-400">
              {status === 'pending' ? 'Waiting for blockchain confirmation' : 'Transaction processed'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Swap Details */}
      <div className="bg-black/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-center gap-4">
          {/* Input */}
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {receipt.inAmountUi?.toFixed(4) || '?'}
            </p>
            <p className="text-sm text-zinc-400">{receipt.inputSymbol || 'Input'}</p>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-6 h-6 text-zinc-500" />

          {/* Output */}
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {receipt.outAmountUi?.toFixed(4) || '?'}
            </p>
            <p className="text-sm text-zinc-400">{receipt.outputSymbol || 'Output'}</p>
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        {receipt.routeType && (
          <div>
            <span className="text-zinc-500">Route</span>
            <p className="text-white capitalize">{receipt.routeType}</p>
          </div>
        )}
        {receipt.routeHops && (
          <div>
            <span className="text-zinc-500">Hops</span>
            <p className="text-white">{receipt.routeHops}</p>
          </div>
        )}
        {receipt.priceImpactPct !== undefined && (
          <div>
            <span className="text-zinc-500">Price Impact</span>
            <p className={`${receipt.priceImpactPct > 1 ? 'text-yellow-400' : 'text-white'}`}>
              {(receipt.priceImpactPct * 100).toFixed(2)}%
            </p>
          </div>
        )}
        {receipt.feeAmount !== undefined && (
          <div>
            <span className="text-zinc-500">Fee</span>
            <p className="text-white">{receipt.feeAmount.toFixed(6)} SOL</p>
          </div>
        )}
      </div>

      {/* Jito Badge */}
      {receipt.jitoBundle && (
        <div className="flex items-center gap-2 text-sm text-purple-400 mb-4">
          <Shield className="w-4 h-4" />
          <span>MEV Protected (Jito Bundle)</span>
        </div>
      )}

      {/* Error Message */}
      {status === 'failed' && receipt.errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">{receipt.errorMessage}</p>
        </div>
      )}

      {/* Transaction Link */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
        <button
          onClick={handleCopyTxid}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Copy className="w-4 h-4" />
          {copied ? 'Copied!' : 'Copy TX'}
        </button>

        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View on Solscan
        </a>

        {status === 'confirmed' && onClose && (
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 bg-emerald-500 text-black rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Mini receipt for history list
 */
export function SwapReceiptMini({ receipt }: { receipt: SwapReceiptType }) {
  const formatted = formatSwapReceipt(receipt);

  return (
    <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full ${
          receipt.status === 'confirmed' ? 'bg-emerald-400' :
          receipt.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
        }`} />

        {/* Tokens */}
        <div>
          <p className="text-sm text-white">
            {formatted.inputDisplay} → {formatted.outputDisplay}
          </p>
          <p className="text-xs text-zinc-500">{formatted.timeAgo}</p>
        </div>
      </div>

      <a
        href={formatted.explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-500 hover:text-white transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
