import { cn } from "@/lib/utils";

interface TokenChipProps {
    symbol: string;
    onClick: () => void;
    Icon?: React.ReactNode;
    className?: string;
}

export function TokenChip({ symbol, onClick, className }: TokenChipProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                "bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 hover:border-white/10",
                "transition-all duration-200 text-xs font-medium text-zinc-300 hover:text-white",
                className
            )}
        >
            {/* Simple colored dot fallback if no icon provided */}
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
            {symbol}
        </button>
    );
}
