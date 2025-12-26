'use client';

import { useParams } from 'next/navigation';
import { TerminalView } from '@/components/terminal';

// Forex pair names
const FOREX_NAMES: Record<string, string> = {
    'EURUSD': 'Euro / US Dollar',
    'GBPUSD': 'British Pound / US Dollar',
    'USDJPY': 'US Dollar / Japanese Yen',
    'USDCHF': 'US Dollar / Swiss Franc',
    'AUDUSD': 'Australian Dollar / US Dollar',
    'USDCAD': 'US Dollar / Canadian Dollar',
    'NZDUSD': 'New Zealand Dollar / US Dollar',
    'EURGBP': 'Euro / British Pound',
    'EURJPY': 'Euro / Japanese Yen',
    'GBPJPY': 'British Pound / Japanese Yen',
    'AUDJPY': 'Australian Dollar / Japanese Yen',
    'CADJPY': 'Canadian Dollar / Japanese Yen',
    'CHFJPY': 'Swiss Franc / Japanese Yen',
    'NZDJPY': 'New Zealand Dollar / Japanese Yen',
};

export default function ForexDetailPage() {
    const params = useParams();
    const pair = (params.pair as string)?.toUpperCase()?.replace('-', '') || '';
    const name = FOREX_NAMES[pair] || formatPairName(pair);

    if (!pair) {
        return (
            <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <TerminalView
            symbol={pair}
            name={name}
            assetType="forex"
            backLink="/forex"
            backLabel="Forex"
        />
    );
}

function formatPairName(pair: string): string {
    if (pair.length === 6) {
        return `${pair.slice(0, 3)} / ${pair.slice(3)}`;
    }
    return pair;
}
