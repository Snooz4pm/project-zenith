'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';
import { ArrowDown, Loader2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getChainConfig, isChainSupported } from '@/lib/arena/chains';
import { DiscoveredToken } from '@/lib/arena/discovery';
import { getFallbackLogo } from '@/lib/arena/token-metadata';

interface SwapPanelProps {
  selectedToken: DiscoveredToken | null;
  onSwapComplete?: () => void;
}

export default function SwapPanel({ selectedToken, onSwapComplete }: SwapPanelProps) {
  const { address, isConnected, chainId: connectedChainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [sellAmount, setSellAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapState, setSwapState] = useState<'idle' | 'quote' | 'approving' | 'swapping' | 'success' | 'error'>('idle');

  const targetChainId = selectedToken ? parseInt(selectedToken.chainId) : 1;
  const chain = getChainConfig(targetChainId);
  const needsChainSwitch = connectedChainId !== targetChainId;

  // Reset state when token changes
  useEffect(() => {
    setSellAmount('');
    setQuote(null);
    setError(null);
    setSwapState('idle');
  }, [selectedToken?.address]);

  // Fetch quote when sellAmount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!sellAmount || parseFloat(sellAmount) <= 0 || !selectedToken || !address || needsChainSwitch) {
        setQuote(null);
        return;
      }

      setIsLoadingQuote(true);
      setError(null);

      try {
        const sellTokenAddress = chain?.defaultSellToken.address || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        const sellTokenDecimals = chain?.defaultSellToken.decimals || 18;
        const sellAmountWei = parseUnits(sellAmount, sellTokenDecimals).toString();

        const response = await fetch(
          `/api/arena/swap/quote?` +
            `chainId=${targetChainId}` +
            `&sellToken=${sellTokenAddress}` +
            `&buyToken=${selectedToken.address}` +
            `&sellAmount=${sellAmountWei}` +
            `&takerAddress=${address}` +
            `&slippageBps=100`
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
  }, [sellAmount, selectedToken, address, targetChainId, needsChainSwitch, chain]);

  const handleSwap = async () => {
    if (!quote || !selectedToken || !address) return;

    setSwapState('swapping');
    setError(null);

    try {
      // Execute swap via wagmi
      writeContract({
        address: quote.to as Address,
        abi: [], // 0x doesn't need ABI, just send raw data
        functionName: '',
        args: [],
        value: BigInt(quote.value || '0'),
        data: quote.data as `0x${string}`,
      });

      // Record swap to database
      if (txHash) {
        await recordSwap(txHash);
      }

      setSwapState('success');
      onSwapComplete?.();
    } catch (err: any) {
      console.error('Swap error:', err);
      setError(err.message || 'Swap failed');
      setSwapState('error');
    }
  };

  const recordSwap = async (txHash: `0x${string}`) => {
    if (!selectedToken || !address) return;

    try {
      await fetch('/api/arena/swap/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          chainId: targetChainId,
          sellToken: chain?.defaultSellToken.symbol,
          sellTokenAddress: chain?.defaultSellToken.address,
          buyToken: selectedToken.symbol,
          buyTokenAddress: selectedToken.address,
          sellAmount: quote.sellAmount,
          buyAmount: quote.buyAmount,
          sellAmountUSD: parseFloat(sellAmount) * 1, // Would need actual price
          txHash,
          tokenAge: selectedToken.pairAge,
          liquidityUSD: selectedToken.liquidity,
          volumeAccel: selectedToken.volumeAccel,
        }),
      });
    } catch (err) {
      console.error('Failed to record swap:', err);
    }
  };

  const handleSwitchChain = () => {
    if (switchChain) {
      switchChain({ chainId: targetChainId });
    }
  };

  const getButtonState = () => {
    if (!isConnected) {
      return { text: 'Connect Wallet', disabled: true, onClick: () => {} };
    }

    if (!selectedToken) {
      return { text: 'Select Token', disabled: true, onClick: () => {} };
    }

    if (needsChainSwitch) {
      return {
        text: `Switch to ${chain?.name}`,
        disabled: false,
        onClick: handleSwitchChain,
      };
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

    if (isWritePending || isTxPending) {
      return { text: 'Executing Swap...', disabled: true, onClick: () => {} };
    }

    return { text: `Buy ${selectedToken.symbol}`, disabled: false, onClick: handleSwap };
  };

  const button = getButtonState();

  // Success state
  if (isTxSuccess && txHash) {
    const explorerUrl = chain ? `${chain.blockExplorerUrls[0]}/tx/${txHash}` : '';

    return (
      <div className="bg-[#111116] border border-white/10 rounded-xl p-6">
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Swap Successful!</h3>
          <p className="text-zinc-400 text-sm mb-6">
            Your transaction has been confirmed on {chain?.name}
          </p>

          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-emerald-500 rounded-lg transition-colors"
            >
              View on Explorer
              <ExternalLink size={14} />
            </a>
          )}

          <button
            onClick={() => {
              setSwapState('idle');
              setSellAmount('');
              setQuote(null);
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
      <h3 className="text-lg font-semibold text-white mb-4">Execute Swap</h3>

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
          />
          <div className="px-3 py-1.5 bg-white/5 rounded-lg font-medium text-white text-sm whitespace-nowrap">
            {chain?.nativeCurrency.symbol || 'ETH'}
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
              src={selectedToken.metadata.logo || getFallbackLogo(selectedToken.symbol, selectedToken.metadata.color)}
              alt={selectedToken.symbol}
              className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = getFallbackLogo(selectedToken.symbol, selectedToken.metadata.color);
              }}
            />
          )}
          <div className="text-2xl font-mono text-white flex-1 truncate">
            {quote ? formatUnits(BigInt(quote.buyAmount), 18) : '0.0'}
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
            <span className="text-white">{(parseFloat(quote.estimatedPriceImpact) * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Platform Fee</span>
            <span className="text-emerald-500">0.4% INCLUDED</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Network</span>
            <span className="text-white">{chain?.name}</span>
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
            : 'bg-emerald-500 hover:bg-emerald-400 text-black'
        }`}
      >
        {(isWritePending || isTxPending) && <Loader2 className="w-5 h-5 animate-spin" />}
        {button.text}
      </button>

      {/* Disclaimer */}
      <p className="text-[10px] text-zinc-600 mt-3 text-center">
        Non-custodial. Your funds never leave your wallet until swap execution.
      </p>
    </div>
  );
}
