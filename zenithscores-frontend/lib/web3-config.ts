import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, polygon, arbitrum, base } from 'wagmi/chains';
import { cookieStorage, createStorage } from 'wagmi';

// Get projectId from WalletConnect Cloud  
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
    console.error('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set! Get from https://cloud.walletconnect.com/');
}

// Metadata for WalletConnect
const metadata = {
    name: 'ZenithScores',
    description: 'DeFi Trading & Analytics Platform',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://zenithscores.com',
    icons: ['/zenith-logo.png'],
};

// Supported chains
export const chains = [mainnet, polygon, arbitrum, base] as const;

// Chain configurations with RPC endpoints
export const chainConfig = {
    [mainnet.id]: {
        name: 'Ethereum',
        icon: '⟠',
        color: '#627EEA',
        rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth.llamarpc.com',
        explorer: 'https://etherscan.io',
    },
    [polygon.id]: {
        name: 'Polygon',
        icon: '⬡',
        color: '#8247E5',
        rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon.llamarpc.com',
        explorer: 'https://polygonscan.com',
    },
    [arbitrum.id]: {
        name: 'Arbitrum',
        icon: '🔵',
        color: '#28A0F0',
        rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
        explorer: 'https://arbiscan.io',
    },
    [base.id]: {
        name: 'Base',
        icon: '🔷',
        color: '#0052FF',
        rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org',
        explorer: 'https://basescan.org',
    },
} as const;

// Wagmi config
export const wagmiConfig = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
    ssr: true,
    storage: createStorage({
        storage: cookieStorage,
    }),
});

// Helper to get chain info
export function getChainInfo(chainId: number) {
    return chainConfig[chainId as keyof typeof chainConfig] || null;
}

// Truncate address for display
export function truncateAddress(address: string, chars = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format balance with symbol
export function formatBalance(balance: bigint, decimals: number, symbol: string): string {
    const value = Number(balance) / Math.pow(10, decimals);
    if (value < 0.0001) return `<0.0001 ${symbol}`;
    if (value < 1) return `${value.toFixed(4)} ${symbol}`;
    if (value < 1000) return `${value.toFixed(2)} ${symbol}`;
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`;
}
