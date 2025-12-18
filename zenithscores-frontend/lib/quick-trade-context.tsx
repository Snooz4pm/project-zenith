'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import QuickTradePrompt from '@/components/QuickTradePrompt';
import TradeModal from '@/components/TradeModal';

interface Asset {
    symbol: string;
    name: string;
    current_price: number;
    price_change_24h: number;
    asset_type: 'crypto' | 'stock' | 'forex';
    max_leverage?: number;
    image?: string;
}

interface QuickTradeContextType {
    openQuickTrade: (asset: Asset) => void;
    closeQuickTrade: () => void;
}

const QuickTradeContext = createContext<QuickTradeContextType | null>(null);

export function useQuickTrade() {
    const context = useContext(QuickTradeContext);
    if (!context) {
        throw new Error('useQuickTrade must be used within QuickTradeProvider');
    }
    return context;
}

interface QuickTradeProviderProps {
    children: ReactNode;
    availableBalance?: number;
    onExecuteTrade?: (trade: any) => Promise<boolean>;
}

export function QuickTradeProvider({
    children,
    availableBalance = 10000,
    onExecuteTrade
}: QuickTradeProviderProps) {
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [showTradeModal, setShowTradeModal] = useState(false);

    const openQuickTrade = useCallback((asset: Asset) => {
        setSelectedAsset(asset);
        setShowPrompt(true);
    }, []);

    const closeQuickTrade = useCallback(() => {
        setShowPrompt(false);
        setSelectedAsset(null);
    }, []);

    const handleOpenTradeModal = useCallback((asset: Asset) => {
        setShowPrompt(false);
        setSelectedAsset(asset);
        setShowTradeModal(true);
    }, []);

    const handleCloseTradeModal = useCallback(() => {
        setShowTradeModal(false);
        setSelectedAsset(null);
    }, []);

    const handleExecuteTrade = async (trade: any) => {
        if (onExecuteTrade) {
            return onExecuteTrade(trade);
        }
        // Default mock implementation
        console.log('Trade executed:', trade);
        return true;
    };

    return (
        <QuickTradeContext.Provider value={{ openQuickTrade, closeQuickTrade }}>
            {children}

            {/* Quick Trade Prompt */}
            <QuickTradePrompt
                asset={selectedAsset}
                isOpen={showPrompt}
                onClose={closeQuickTrade}
                onTrade={handleOpenTradeModal}
            />

            {/* Full Trade Modal */}
            <TradeModal
                isOpen={showTradeModal}
                onClose={handleCloseTradeModal}
                asset={selectedAsset ? {
                    symbol: selectedAsset.symbol,
                    name: selectedAsset.name,
                    current_price: selectedAsset.current_price,
                    price_change_24h: selectedAsset.price_change_24h,
                    asset_type: selectedAsset.asset_type,
                    max_leverage: selectedAsset.max_leverage || 10
                } : null}
                availableBalance={availableBalance}
                onExecuteTrade={handleExecuteTrade}
            />
        </QuickTradeContext.Provider>
    );
}
