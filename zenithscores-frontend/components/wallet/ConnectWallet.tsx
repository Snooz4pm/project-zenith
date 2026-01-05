'use client';

import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ConnectWallet() {
    const { setVisible } = useWalletModal();

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
            <p className="text-zinc-500 mb-6 max-w-sm">
                Connect your Solana wallet to access this feature.
            </p>
            <Button onClick={() => setVisible(true)}>
                <Wallet className="w-4 h-4" />
                Connect Wallet
            </Button>
        </div>
    );
}
