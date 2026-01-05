import { ChevronDown } from 'lucide-react';

interface TokenInputProps {
    label: string;
    amount: string;
    onChangeAmount: (val: string) => void;
    tokenSymbol?: string;
    onSelectToken?: () => void;
    balance?: string;
    readOnly?: boolean;
}

export function TokenInput({
    label,
    amount,
    onChangeAmount,
    tokenSymbol,
    onSelectToken,
    balance,
    readOnly = false
}: TokenInputProps) {
    return (
        <div className="bg-[#111116] rounded-xl p-4 border border-white/5">
            <div className="flex justify-between mb-2">
                <span className="text-xs text-zinc-500">{label}</span>
                {balance && <span className="text-xs text-zinc-500">Balance: {balance}</span>}
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onSelectToken}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
                >
                    <span className="font-medium text-white">{tokenSymbol || 'Select'}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                </button>

                <input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => onChangeAmount(e.target.value)}
                    readOnly={readOnly}
                    className="flex-1 bg-transparent text-right text-2xl font-bold text-white outline-none placeholder-zinc-700"
                />
            </div>
        </div>
    );
}
