import React from 'react';
import { SelectableToken } from './TokenSelector';

const TokenRow = React.memo(function TokenRow({ token, onSelect, showBalance }: {
    token: SelectableToken | undefined;
    onSelect: (token: SelectableToken) => void;
    showBalance: boolean;
}) {
    if (!token) {
        return <div style={{ minHeight: 48 }} />;
    }
    return (
        <button
            key={token.address}
            onClick={() => onSelect(token)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
        >
            <div className="flex items-center gap-3">
                <img
                    src={token.logoURI || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'}
                    className="w-8 h-8 rounded-full bg-zinc-800"
                    alt={token.symbol}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                    }}
                />
                <div className="text-left">
                    <div className="text-white font-medium text-sm">{token.symbol}</div>
                    <div className="text-xs text-zinc-500 truncate max-w-[200px]">{token.name}</div>
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
