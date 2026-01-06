/**
 * Phantom Detection Helper
 * 
 * Direct access to Phantom extension — bypasses wallet adapter UI.
 * Used by Jupiter, Raydium, Drift, Tensor.
 */

export interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString: () => string } | null;
  isConnected: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signAndSendTransaction: (transaction: any, options?: any) => Promise<{ signature: string }>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
}

/**
 * Get Phantom provider if installed
 * Returns null if not available (SSR or not installed)
 */
export function getPhantom(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;

  const anyWindow = window as any;

  // Check for Phantom specifically
  if (anyWindow.solana?.isPhantom) {
    return anyWindow.solana as PhantomProvider;
  }

  // Check phantom namespace (newer versions)
  if (anyWindow.phantom?.solana?.isPhantom) {
    return anyWindow.phantom.solana as PhantomProvider;
  }

  return null;
}

/**
 * Check if Phantom is installed
 */
export function isPhantomInstalled(): boolean {
  return getPhantom() !== null;
}

/**
 * Check if already connected to Phantom
 */
export function isPhantomConnected(): boolean {
  const phantom = getPhantom();
  return phantom?.isConnected ?? false;
}

/**
 * Get current connected public key (if any)
 */
export function getConnectedPublicKey(): string | null {
  const phantom = getPhantom();
  return phantom?.publicKey?.toString() ?? null;
}
