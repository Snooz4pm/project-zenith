"use client";
'use client'

type Props = {
  tokens: any[];
  onSelect: (token: any) => void;
};

export function SimpleTokenGrid({ tokens, onSelect }: Props) {
  if (!tokens?.length) {
    return (
      <div className="text-zinc-500 text-center py-10">
        No tokens available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tokens.map((token, idx) => (
        <button
          key={token.address || token.mint || idx}
          onClick={() => onSelect(token)}
          className="flex items-center gap-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 p-3 text-left"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs">
            {token.symbol?.[0] || "?"}
          </div>

          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">
              {token.symbol || "Unknown"}
            </span>
            <span className="text-zinc-400 text-xs truncate">
              {token.name || token.address || token.mint}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
