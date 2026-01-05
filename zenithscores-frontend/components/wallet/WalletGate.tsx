'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import ConnectWallet from './ConnectWallet';

export default function WalletGate({ children }: { children: React.ReactNode }) {
    const { publicKey } = useWallet();

    if (!publicKey) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <ConnectWallet />
            </div>
        );
    }

    return <>{children}</>;
}
