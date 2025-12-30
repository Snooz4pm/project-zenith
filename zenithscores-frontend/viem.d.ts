declare module 'viem/chains' {
    export const mainnet: {
        id: number;
        name: string;
    };
    export const sepolia: {
        id: number;
        name: string;
    };
}

declare module 'wagmi/connectors' {
    export function injected(options?: { shimDisconnect?: boolean }): any;
}
