
export interface CryptoMetadata {
    symbol: string;
    network: string;
    contractAddress: string | null;
    explorerUrl: string; // Direct link to asset page or main explorer
    recommendedWallets: string[];
    acquisitionSteps: string[];
    safetyTips: string[];
}

export const CRYPTO_DB: Record<string, CryptoMetadata> = {
    ETH: {
        symbol: "ETH",
        network: "Ethereum Mainnet",
        contractAddress: null, // Native
        explorerUrl: "https://etherscan.io/",
        recommendedWallets: ["MetaMask", "Rabby", "Ledger"],
        acquisitionSteps: [
            "Install a Web3 wallet like MetaMask or Rabby.",
            "Copy your '0x...' Ethereum address from the wallet.",
            "Withdraw ETH from an exchange (Coinbase, Binance) to your address.",
            "Verify the transaction on Etherscan."
        ],
        safetyTips: [
            "Always check the URL when connecting your wallet.",
            "Never share your seed phrase.",
            "Ensure you are on the Ethereum Mainnet, not a testnet."
        ]
    },
    BTC: {
        symbol: "BTC",
        network: "Bitcoin Network",
        contractAddress: null,
        explorerUrl: "https://www.blockchain.com/explorer/assets/btc",
        recommendedWallets: ["Exodus", "Ledger", "Trezor"],
        acquisitionSteps: [
            "Set up a Bitcoin wallet (hardware wallet recommended for large amounts).",
            "Copy your BTC address (starts with 1, 3, or bc1).",
            "Purchase BTC on an exchange and withdraw to your wallet.",
            "Wait for 3-6 confirmations for finality."
        ],
        safetyTips: [
            "Bitcoin transactions cannot be reversed.",
            "Double-check the first and last 4 characters of the address.",
            "Be patient; BTC blocks take ~10 minutes."
        ]
    },
    SOL: {
        symbol: "SOL",
        network: "Solana Mainnet",
        contractAddress: null,
        explorerUrl: "https://solscan.io/",
        recommendedWallets: ["Phantom", "Solflare"],
        acquisitionSteps: [
            "Install the Phantom wallet browser extension.",
            "Copy your Solana address.",
            "Withdraw SOL from an exchange using the Solana network.",
            "Transaction should confirm in < 5 seconds."
        ],
        safetyTips: [
            "Solana transactions are fast; mistakes happen quickly.",
            "Beware of scam tokens sent to your wallet automatically."
        ]
    },
    default: {
        symbol: "TOKEN",
        network: "Ethereum (ERC-20)",
        contractAddress: "0x...",
        explorerUrl: "https://etherscan.io/",
        recommendedWallets: ["MetaMask", "Rabby"],
        acquisitionSteps: [
            "Ensure you have a Web3 wallet compatible with this chain.",
            "Copy your wallet address.",
            "Withdraw or Swap on a DEX (Uniswap/PancakeSwap).",
            "Confirm the token contract address matches the official one."
        ],
        safetyTips: [
            "Always verify the Token Contract Address on CoinGecko/CMC.",
            "Do not approve unlimited spending on unknown sites."
        ]
    }
};

export function getCryptoMetadata(symbol: string): CryptoMetadata {
    const data = CRYPTO_DB[symbol.toUpperCase()];
    if (data) return data;

    // Return default but update the symbol
    return {
        ...CRYPTO_DB['default'],
        symbol: symbol.toUpperCase(),
        // Try to construct a decent explorer link for unknown tokens (assuming ERC20 for now)
        explorerUrl: `https://etherscan.io/token/`
    };
}
