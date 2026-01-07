/**
 * Direct Wallet Connection Logic
 * 
 * Production-grade Phantom connection — no modal, no bullshit.
 * Same behavior as Jupiter, Raydium, Drift.
 */

import { getPhantom } from '@/lib/phantom';

export type ConnectionResult = {
  success: boolean;
  publicKey: string | null;
  error?: string;
};

/**
 * Connect to Phantom directly
 * 
 * - If Phantom installed → opens extension immediately
 * - If not installed:
 *   - Desktop → opens install page
 *   - Mobile → deep links to Phantom app
 */
export async function connectWallet(): Promise<ConnectionResult> {
  const phantom = getPhantom();

  // ✅ Phantom is installed — connect directly
  if (phantom) {
    try {
      const response = await phantom.connect({
        onlyIfTrusted: false // Always prompt (user must approve)
      });

      return {
        success: true,
        publicKey: response.publicKey.toString()
      };
    } catch (err: any) {
      // User rejected or extension error
      console.error('[connectWallet] Connection rejected:', err?.message);
      return {
        success: false,
        publicKey: null,
        error: err?.message || 'Connection rejected'
      };
    }
  }

  // ❌ Phantom NOT installed — redirect appropriately
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isMobile) {
    // Mobile → Deep link to Phantom app with current URL
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `https://phantom.app/ul/browse/${currentUrl}`;
  } else {
    // Desktop → Open Phantom install page
    window.open('https://phantom.app/', '_blank', 'noopener,noreferrer');
  }

  return {
    success: false,
    publicKey: null,
    error: 'Phantom not installed'
  };
}

/**
 * Silent auto-reconnect (for returning users)
 * 
 * Call this on app load. Only connects if user previously approved.
 * No popup if not previously connected.
 */
export async function autoReconnect(): Promise<ConnectionResult> {
  const phantom = getPhantom();

  if (!phantom) {
    return { success: false, publicKey: null };
  }

  try {
    // onlyIfTrusted: true = silent reconnect, no popup
    const response = await phantom.connect({ onlyIfTrusted: true });
    
    return {
      success: true,
      publicKey: response.publicKey.toString()
    };
  } catch {
    // Not previously connected or user revoked — silent fail
    return { success: false, publicKey: null };
  }
}

/**
 * Disconnect from Phantom
 */
export async function disconnectWallet(): Promise<void> {
  const phantom = getPhantom();
  
  if (phantom) {
    try {
      await phantom.disconnect();
    } catch (err) {
      console.error('[disconnectWallet] Error:', err);
    }
  }
}
