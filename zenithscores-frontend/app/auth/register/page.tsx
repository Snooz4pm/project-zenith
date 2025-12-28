"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, Mail, Lock, User, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { signIn } from "next-auth/react"

export default function RegisterPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [termsAccepted, setTermsAccepted] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!termsAccepted) {
            setError("You must accept the terms of service.")
            return
        }
        setIsLoading(true)
        setError("")

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to register")
            }

            router.push("/auth/login?registered=true")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignup = () => {
        signIn("google", { callbackUrl: "/command-center" })
    }

    // Password strength logic
    const getPasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 5) score++;
        if (pass.length > 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score; // 0 to 5
    }
    const strength = getPasswordStrength(password);

    return (
        <div className="min-h-screen bg-[var(--void)] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_rgba(0,212,255,0.1),_transparent_50%)]" />
                <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_rgba(20,241,149,0.05),_transparent_50%)]" />
                {/* Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
            </div>


            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md z-10"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-4 group justify-center mb-6">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <div
                                className="absolute inset-0 bg-[var(--accent-mint)] opacity-20 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            />
                            <div
                                className="absolute inset-[2px] bg-[var(--surface-3)]"
                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            />
                            <span className="relative text-[var(--accent-mint)] font-bold text-2xl" style={{ fontFamily: "var(--font-display)" }}>Z</span>
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                        Create Account
                    </h1>
                    <p className="text-[var(--text-secondary)]">Begin your trading journey</p>
                </div>

                {/* Card */}
                <div className="bg-[rgba(10,10,15,0.6)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-mint)] to-[var(--accent-cyan)] opacity-50" />

                    <div className="space-y-6">
                        {/* Google Signup */}
                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            className="w-full flex items-center justify-center gap-3 bg-[rgba(255,255,255,0.05)] text-white font-medium py-3 rounded-xl hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] transition-colors group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign up with Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[rgba(255,255,255,0.1)]" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[var(--surface-2)] px-2 text-[var(--text-muted)]">or continue with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-mint)] transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Trader One"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-mint)] focus:border-[var(--accent-mint)] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-mint)] transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="trader@zenith.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-mint)] focus:border-[var(--accent-mint)] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-mint)] transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-3 bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-mint)] focus:border-[var(--accent-mint)] transition-all"
                                    />
                                </div>
                                {/* Password Strength Indicator */}
                                <div className="h-1 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden mt-2">
                                    <div
                                        className={`h-full transition-all duration-300 ${strength < 2 ? 'bg-red-500 w-[20%]' :
                                                strength < 4 ? 'bg-yellow-500 w-[60%]' :
                                                    'bg-[var(--accent-mint)] w-[100%]'
                                            }`}
                                    />
                                </div>
                                <div className="text-[10px] text-right text-[var(--text-muted)]">
                                    {strength < 2 ? 'Weak' : strength < 4 ? 'Moderate' : 'Strong'}
                                </div>
                            </div>

                            <div className="flex items-start gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setTermsAccepted(!termsAccepted)}
                                    className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-colors ${termsAccepted
                                            ? 'bg-[var(--accent-mint)] border-[var(--accent-mint)] text-black'
                                            : 'border-[var(--text-muted)] bg-transparent'
                                        }`}
                                >
                                    {termsAccepted && <Check size={10} />}
                                </button>
                                <p className="text-xs text-[var(--text-secondary)] leading-tight">
                                    I agree to the <Link href="/terms" className="text-white hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-white hover:underline">Privacy Policy</Link>.
                                </p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[var(--accent-danger)] text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-[var(--accent-mint)] text-[var(--void)] font-bold rounded-xl hover:shadow-[0_0_30px_rgba(20,241,149,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ fontFamily: "var(--font-body)" }}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Initialize Account
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-sm text-[var(--text-secondary)]">
                            Already registered?{" "}
                            <Link href="/auth/login" className="text-[var(--accent-mint)] hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
