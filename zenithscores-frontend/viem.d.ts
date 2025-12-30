declare module 'viem/chains' {
    interface Chain {
        id: number;
        name: string;
    }
    export const mainnet: Chain;
    export const sepolia: Chain;
    export const base: Chain;
    export const arbitrum: Chain;
}

declare module 'wagmi/connectors' {
    export function injected(options?: { shimDisconnect?: boolean }): any;
    export function walletConnect(options?: { projectId: string }): any;
}
