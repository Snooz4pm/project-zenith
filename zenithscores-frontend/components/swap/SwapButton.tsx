import { Wallet, Loader2, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SwapButtonProps {
    onClick: () => void;
    state: 'idle' | 'loading' | 'success' | 'error' | 'connect';
    disabled?: boolean;
}

export function SwapButton({ onClick, state, disabled }: SwapButtonProps) {
    // Premium "Connect to Swap" State with Spinning Emerald Border
    if (state === 'connect') {
        return (
            <div className="relative group rounded-xl p-[1px] overflow-hidden cursor-pointer" onClick={onClick}>
                {/* Spinning Emerald Border Layer */}
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,var(--color-accent-mint)_360deg)] animate-spin-slow opacity-100" />

                {/* Button Inner */}
                <button
                    className="relative w-full py-4 px-6 bg-surface-2 hover:bg-surface-3 text-accent-mint font-bold rounded-[11px] transition-all duration-300 flex items-center justify-center gap-3 group-hover:shadow-[0_0_20px_rgba(0,255,196,0.15)] z-10"
                >
                    <Wallet className="w-5 h-5" />
                    <span>Connect to Swap</span>
                </button>
            </div>
        );
    }

    // Standard Swap Button States
    return (
        <button
            onClick={onClick}
            disabled={disabled || state === 'loading'}
            className={cn(
                "w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2",
                "relative overflow-hidden group hover:scale-[1.02]",
                // Idle State: Primary Mint
                state === 'idle' && "bg-accent-mint text-black hover:shadow-[0_0_30px_rgba(0,255,196,0.4)]",
                // Loading State
                state === 'loading' && "bg-surface-3 text-zinc-500 cursor-not-allowed",
                // Success State
                state === 'success' && "bg-emerald-500 text-white",
                // Error State
                state === 'error' && "bg-red-500 text-white"
            )}
        >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

            {state === 'idle' && (
                <>
                    <span>Swap Now</span>
                    <ArrowRightLeft className="w-5 h-5 opacity-50 group-hover:rotate-180 transition-transform duration-500" />
                </>
            )}

            {state === 'loading' && (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Confirming...</span>
                </>
            )}

            {state === 'success' && <span>Swap Complete!</span>}
            {state === 'error' && <span>Swap Failed</span>}
        </button>
    );
}
