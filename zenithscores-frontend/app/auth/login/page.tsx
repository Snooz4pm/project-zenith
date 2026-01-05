"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { Loader2, Wallet, Zap, Shield, Globe } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import bs58 from "bs58"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Solana Wallet
    const { publicKey, signMessage, connected, disconnect } = useWallet()
    const { setVisible } = useWalletModal()

    // Auto sign-in when wallet connects
    useEffect(() => {
        if (connected && publicKey && !isLoading) {
            handleWalletSignIn()
        }
    }, [connected, publicKey])

    const handleWalletSignIn = async () => {
        if (!publicKey || !signMessage) {
            setVisible(true)
            return
        }

        setIsLoading(true)
        setError("")

        try {
            // Create message to sign
            const message = `Sign in to ZenithScores\n\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`
            const messageBytes = new TextEncoder().encode(message)
            
            // Request signature
            const signature = await signMessage(messageBytes)
            const signatureBase58 = bs58.encode(signature)

            // Sign in via NextAuth
            const res = await signIn("wallet", {
                walletAddress: publicKey.toBase58(),
                signature: signatureBase58,
                message,
                redirect: false,
            })

            if (res?.error) {
                setError("Wallet authentication failed")
                disconnect()
            } else {
                window.location.href = "/command-center"
            }
        } catch (err: any) {
            console.error("Wallet sign-in error:", err)
            if (err.message?.includes("rejected")) {
                setError("Signature rejected. Please try again.")
            } else {
                setError("Failed to authenticate. Please try again.")
            }
            disconnect()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Left Panel - Branding (Desktop) */}
            <div className="hidden lg:flex w-[55%] flex-col justify-center px-16 relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 to-transparent" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 max-w-lg">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-black" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">ZenithScores</span>
                    </div>

                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Market Intelligence,<br />
                        <span className="text-emerald-400">Web3 Native.</span>
                    </h1>

                    <p className="text-xl text-zinc-400 mb-12 leading-relaxed">
                        Connect your Solana wallet. No passwords, no emails required.
                        Pure DeFi, trustless authentication.
                    </p>

                    {/* Features */}
                    <div className="space-y-4">
                        {[
                            { icon: Shield, text: "Non-custodial — your keys, your identity" },
                            { icon: Zap, text: "One-click sign in with Phantom or Solflare" },
                            { icon: Globe, text: "Community profiles, rooms, and messaging" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <item.icon className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-zinc-400">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Auth */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-zinc-950 lg:border-l border-zinc-800">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-black" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">ZenithScores</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-2 text-center lg:text-left">
                        Welcome back
                    </h2>
                    <p className="text-zinc-500 mb-8 text-center lg:text-left">
                        Connect your wallet to continue
                    </p>

                    {/* Auth Card */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <div className="space-y-4">
                            {/* Primary: Wallet Connect */}
                            <button
                                onClick={() => connected ? handleWalletSignIn() : setVisible(true)}
                                disabled={isLoading}
                                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-[1px]"
                            >
                                <div className="relative flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 transition-all group-hover:from-emerald-400 group-hover:to-emerald-500">
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                                    ) : (
                                        <Wallet className="w-5 h-5 text-black" />
                                    )}
                                    <span className="font-semibold text-black">
                                        {isLoading ? "Authenticating..." : connected ? "Sign Message to Continue" : "Connect Wallet"}
                                    </span>
                                </div>
                            </button>

                            {/* Wallet Status */}
                            {connected && publicKey && (
                                <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>{publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
                                    <button 
                                        onClick={() => disconnect()}
                                        className="text-emerald-400 hover:text-emerald-300 ml-2"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {/* Info */}
                            <div className="pt-4 border-t border-zinc-800">
                                <p className="text-xs text-zinc-600 text-center">
                                    Signing a message proves wallet ownership.
                                    No transaction, no gas fees.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-6 text-center">
                        <p className="text-zinc-600 text-sm">
                            New to ZenithScores?{" "}
                            <Link href="/auth/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                                Create account
                            </Link>
                        </p>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-600">
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            Non-custodial
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            Instant access
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
