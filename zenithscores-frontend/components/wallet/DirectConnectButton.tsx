'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * DirectConnectButton
 * 
 * Bypasses the modal if a wallet is detected/ready.
 * If multiple (e.g. Phantom + Solflare), defaults to the first "Installed".
 */
export function DirectConnectButton() {
    const { connect, connected, connecting, wallet, select, wallets } = useWallet();
    const { setVisible } = useWalletModal();
    const [isTriggering, setIsTriggering] = useState(false);

    // Auto-Select Logic
    const handleConnectClick = async () => {
        setIsTriggering(true);

        try {
            // 1. If a wallet is already selected (by adapter), just connect
            if (wallet) {
                await connect();
                setIsTriggering(false);
                return;
            }

            // 2. Scan for "Installed" wallets (Extensions)
            const installedWallets = wallets.filter(w => w.readyState === "Installed");

            if (installedWallets.length > 0) {
                // Priority: Phantom -> Solflare -> backpack -> First Available
                const priorityOrder = ['Phantom', 'Solflare', 'Backpack'];
                const bestWallet = installedWallets.sort((a, b) => {
                    const idxA = priorityOrder.indexOf(a.adapter.name);
                    const idxB = priorityOrder.indexOf(b.adapter.name);
                    const valA = idxA === -1 ? 999 : idxA;
                    const valB = idxB === -1 ? 999 : idxB;
                    return valA - valB;
                })[0];

                // Select and Auto-Connect
                select(bestWallet.adapter.name);
                // We need to wait a tick for selection to propagate, sometimes. 
                // However, standard adapter behavior requires user interaction for `connect()`.
                // Calling select() usually sets the wallet state.
                // We will rely on the `useEffect` below to trigger connect once `wallet` is set, 
                // OR we can try connecting immediately if the state updates fast enough.
                // Typically, select() is sync-ish for state, but async for internally loading adapter.

                // Let's just select it here. The user might need to click again OR we can rely on auto-connect if configured?
                // No, we want one-click. 
                // Better approach: Select, then immediately call connect() in a timeout or effectively.

                // For now, let's select. The adapter usually handles "connect()" calls best when the wallet is already selected.
                // If we select now, `wallet` becomes defined in next render. 
                // Let's force the modal ONLY if no installed wallets found.
            } else {
                // 3. No extension found -> Show Modal (QR codes etc)
                setVisible(true);
            }
        } catch (error) {
            console.error("Auto-Connect Failed", error);
            // Fallback to modal on error
            setVisible(true);
        } finally {
            setIsTriggering(false);
        }
    };

    // Watch for "Just Selected" and trigger connect if we are in "Triggering" mode?
    // Actually, simple "Select" might not be enough to trigger "Connect" in the same event loop step safely.
    // BUT the @solana/wallet-adapter implementation often requires `select(name)` and then `connect()`.
    // Let's try to detect if we just selected one.

    useEffect(() => {
        if (isTriggering && wallet && !connected && !connecting) {
            connect().catch(() => setVisible(true));
            setIsTriggering(false);
        }
    }, [wallet, isTriggering, connected, connecting, connect, setVisible]);


    if (connected) return null; // Should be handled by parent to show profile

    return (
        <button
            onClick={handleConnectClick}
            disabled={connecting || isTriggering}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium"
        >
            {connecting || isTriggering ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <Wallet size={16} />
            )}
            {connecting || isTriggering ? "Connecting..." : "Connect Wallet"}
        </button>
    );
}
