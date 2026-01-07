'use client';

import { Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { connectWallet } from '@/lib/connectWallet';
import { useState } from 'react';

export default function ConnectWallet() {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await connectWallet();
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
            <p className="text-zinc-500 mb-6 max-w-sm">
                Connect your Solana wallet to access this feature.
            </p>
            <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
        </div>
    );
}
