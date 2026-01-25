import React from 'react';
import { SelectableToken } from './TokenSelector';

const TokenRow = React.memo(function TokenRow({ token, onSelect, showBalance }: {
    token: SelectableToken | undefined;
    onSelect: (token: SelectableToken) => void;
    showBalance: boolean;
}) {
    // Layer 1: Hard safety guard
    if (!token || !token.address) {
        return null;
    }
    const safeSymbol = token.symbol || 'UNKNOWN';
    const safeName = token.name || token.address.slice(0, 6);
    const safeLogo = token.logoURI || '/placeholder.png';
    return (
        <button
            key={token.address}
            onClick={() => onSelect(token)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
        >
            <div className="flex items-center gap-3">
                <img
                    src={safeLogo}
                    className="w-8 h-8 rounded-full bg-zinc-800"
                    alt={safeSymbol}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                    }}
                />
                <div className="text-left">
                    <div className="text-white font-medium text-sm">{safeSymbol}</div>
                    <div className="text-xs text-zinc-500 truncate max-w-[200px]">{safeName}</div>
                </div>
            </div>
            {showBalance && token.uiBalance !== undefined && (
                <div className="text-right">
                    <div className="text-white font-mono text-sm">
                        {token.uiBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </div>
                </div>
            )}
        </button>
    );
});

export default TokenRow;
