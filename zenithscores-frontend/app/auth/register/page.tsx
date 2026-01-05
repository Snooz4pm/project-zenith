"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { Loader2, Wallet, Zap, Shield, Users, MessageSquare, Trophy, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import bs58 from "bs58"

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [step, setStep] = useState<'connect' | 'sign' | 'success'>('connect')

    // Solana Wallet
    const { publicKey, signMessage, connected, disconnect } = useWallet()
    const { setVisible } = useWalletModal()

    // When wallet connects, move to sign step
    useEffect(() => {
        if (connected && publicKey && step === 'connect') {
            setStep('sign')
        }
    }, [connected, publicKey, step])

    const handleCreateAccount = async () => {
        if (!publicKey || !signMessage) {
            setVisible(true)
            return
        }

        setIsLoading(true)
        setError("")

        try {
            // Create message to sign - no gas, no transaction
            const message = `Sign to create your ZenithScores account.\n\nNo gas fees. No transactions.\nThis only verifies wallet ownership.\n\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`
            const messageBytes = new TextEncoder().encode(message)
            
            // Request signature
            const signature = await signMessage(messageBytes)
            const signatureBase58 = bs58.encode(signature)

            // Create account via NextAuth
            const res = await signIn("wallet", {
                walletAddress: publicKey.toBase58(),
                signature: signatureBase58,
                message,
                redirect: false,
            })

            if (res?.error) {
                setError("Failed to create account. Please try again.")
            } else {
                setStep('success')
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = "/command-center"
                }, 2000)
            }
        } catch (err: any) {
            console.error("Account creation error:", err)
            if (err.message?.includes("rejected")) {
                setError("Signature rejected. Please try again.")
                setStep('connect')
            } else {
                setError("Failed to create account. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Left Panel - Value Proposition (Desktop) */}
            <div className="hidden lg:flex w-[55%] flex-col justify-center px-16 relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 to-transparent" />
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 max-w-lg">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-black" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">ZenithScores</span>
                    </div>

                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Join the<br />
                        <span className="text-emerald-400">Community.</span>
                    </h1>

                    <p className="text-xl text-zinc-400 mb-12 leading-relaxed">
                        Connect your wallet to unlock full platform access.
                        No passwords. No emails. Just your wallet.
                    </p>

                    {/* What you unlock */}
                    <div className="space-y-4">
                        <p className="text-sm uppercase tracking-widest text-zinc-600 mb-4">What you unlock</p>
                        {[
                            { icon: Users, text: "Public profile & reputation", color: "emerald" },
                            { icon: MessageSquare, text: "Community rooms & messaging", color: "purple" },
                            { icon: Trophy, text: "XP, badges & leaderboards", color: "yellow" },
                            { icon: Shield, text: "Saved watchlists & alerts", color: "blue" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg bg-${item.color}-500/10 flex items-center justify-center`}>
                                    <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                                </div>
                                <span className="text-zinc-300">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Trust note */}
                    <div className="mt-12 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <p className="text-sm text-zinc-500">
                            <span className="text-emerald-400 font-medium">💡 Note:</span> Signing a message 
                            is free and doesn't create any blockchain transaction. It only proves you own this wallet.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Registration Flow */}
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
                        Create Account
                    </h2>
                    <p className="text-zinc-500 mb-8 text-center lg:text-left">
                        Two steps. Zero passwords.
                    </p>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                            step === 'connect' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                            {step !== 'connect' ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 flex items-center justify-center">1</span>}
                            Connect
                        </div>
                        <div className="w-8 h-px bg-zinc-800" />
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                            step === 'sign' ? 'bg-emerald-500/20 text-emerald-400' : 
                            step === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                            {step === 'success' ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 flex items-center justify-center">2</span>}
                            Sign
                        </div>
                    </div>

                    {/* Registration Card */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        
                        {/* Step 1: Connect Wallet */}
                        {step === 'connect' && (
                            <div className="space-y-4">
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                        <Wallet className="w-8 h-8 text-zinc-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                                    <p className="text-zinc-500 text-sm">
                                        Use Phantom, Solflare, or any Solana wallet
                                    </p>
                                </div>

                                <button
                                    onClick={() => setVisible(true)}
                                    className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-[1px]"
                                >
                                    <div className="relative flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 transition-all group-hover:from-emerald-400 group-hover:to-emerald-500">
                                        <Wallet className="w-5 h-5 text-black" />
                                        <span className="font-semibold text-black">Connect Wallet</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Step 2: Sign Message */}
                        {step === 'sign' && (
                            <div className="space-y-4">
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Wallet Connected!</h3>
                                    <p className="text-zinc-500 text-sm mb-2">
                                        Now sign a message to verify ownership
                                    </p>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full text-sm">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-zinc-400">
                                            {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                                        </span>
                                    </div>
                                </div>

                                {/* What signing does */}
                                <div className="p-4 rounded-xl bg-zinc-800/50 space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <span>No gas fees</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <span>No blockchain transaction</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <span>Just proves wallet ownership</span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleCreateAccount}
                                    disabled={isLoading}
                                    className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-[1px]"
                                >
                                    <div className="relative flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 transition-all group-hover:from-emerald-400 group-hover:to-emerald-500">
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-black" />
                                        ) : (
                                            <Shield className="w-5 h-5 text-black" />
                                        )}
                                        <span className="font-semibold text-black">
                                            {isLoading ? "Creating Account..." : "Sign & Create Account"}
                                        </span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { disconnect(); setStep('connect'); }}
                                    className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    Use different wallet
                                </button>
                            </div>
                        )}

                        {/* Step 3: Success */}
                        {step === 'success' && (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-10 h-10 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-emerald-400">Welcome to ZenithScores!</h3>
                                <p className="text-zinc-500 mb-6">
                                    Your account is ready. Redirecting...
                                </p>
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                            </div>
                        )}
                    </div>

                    {/* Footer Links */}
                    <div className="mt-6 text-center">
                        <p className="text-zinc-600 text-sm">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    {/* Terms */}
                    <p className="mt-6 text-xs text-zinc-600 text-center">
                        By creating an account, you agree to our{" "}
                        <Link href="/terms" className="text-zinc-400 hover:text-zinc-300">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-zinc-400 hover:text-zinc-300">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
