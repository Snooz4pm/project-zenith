'use client';

import { useDirectWallet } from './DirectConnectButton';
import ConnectWallet from './ConnectWallet';

export default function WalletGate({ children }: { children: React.ReactNode }) {
    const { publicKey } = useDirectWallet();

    if (!publicKey) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <ConnectWallet />
            </div>
        );
    }

    return <>{children}</>;
}
