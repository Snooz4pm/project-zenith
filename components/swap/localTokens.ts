import type { Token } from '@/types/token';

export const localTokens: Token[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'A...USDC', // Replace with real address
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/USDC/logo.png',
    decimals: 6,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'A...SOL', // Replace with real address
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SOL/logo.png',
    decimals: 9,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: 'A...USDT', // Replace with real address
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/USDT/logo.png',
    decimals: 6,
  },
  // Add more popular tokens as needed
];
