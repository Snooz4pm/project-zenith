/**
 * TokenUI - The ONLY shape your UI is allowed to know
 * 
 * NO address
 * NO mint
 * NO logoURI
 * NO execution data
 */

export type TokenUI = {
    id: string;      // Index-based, crash-proof
    symbol: string;
    name: string;
};
