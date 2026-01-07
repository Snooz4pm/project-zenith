"use client";

/**
 * @deprecated - This is a legacy component kept for compatibility
 * Auth is now handled by WalletIdentityProvider in providers.tsx
 * TODO: Remove this and its usages once all components migrate
 */

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    // Pass-through - auth is now handled by WalletIdentityProvider
    return <>{children}</>;
}
