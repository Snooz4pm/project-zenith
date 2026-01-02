"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
    const [isIdle, setIsIdle] = useState(false)

    useEffect(() => {
        let idleTimer: NodeJS.Timeout
        const resetIdle = () => {
            setIsIdle(false)
            clearTimeout(idleTimer)
            idleTimer = setTimeout(() => setIsIdle(true), 15000)
        }
        resetIdle()
        window.addEventListener('mousemove', resetIdle)
        window.addEventListener('keypress', resetIdle)
        return () => {
            clearTimeout(idleTimer)
            window.removeEventListener('mousemove', resetIdle)
            window.removeEventListener('keypress', resetIdle)
        }
    }, [])

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

    const getPasswordStrength = (pass: string) => {
        let score = 0
        if (pass.length > 5) score++
        if (pass.length > 8) score++
        if (/[A-Z]/.test(pass)) score++
        if (/[0-9]/.test(pass)) score++
        if (/[^A-Za-z0-9]/.test(pass)) score++
        return score
    }
    const strength = getPasswordStrength(password)

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            backgroundColor: '#0a0a0f',
            position: 'relative',
            overflow: 'hidden'
        }}>

            {/* Ambient Activity Bar */}
            <div style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                zIndex: 50,
                display: 'flex',
                alignItems: 'flex-end'
            }}>
                <div
                    style={{
                        width: '100%',
                        background: 'linear-gradient(to top, #10b981, #34d399)',
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                        height: isIdle ? '30%' : '40%',
                        animation: isIdle
                            ? 'ambientPulseIdle 6s ease-in-out infinite'
                            : 'ambientPulse 4s ease-in-out infinite',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                        transition: 'height 0.3s ease'
                    }}
                />
            </div>

            <style jsx global>{`
                @keyframes ambientPulse {
                    0%, 100% { height: 40%; }
                    50% { height: 70%; }
                }
                @keyframes ambientPulseIdle {
                    0%, 100% { height: 30%; }
                    50% { height: 50%; }
                }
            `}</style>

            {/* Left Panel - Brand (65%) - DESKTOP ONLY */}
            <div style={{
                width: '65%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '3rem 4rem',
                position: 'relative'
            }} className="hidden lg:flex">

                <div style={{ maxWidth: '480px' }}>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '1.5rem',
                        lineHeight: 1.1
                    }}>
                        Start Your<br />
                        <span style={{ color: '#10b981' }}>Trading Journey.</span>
                    </h1>

                    <p style={{
                        fontSize: '1.125rem',
                        color: '#a1a1aa',
                        marginBottom: '2.5rem',
                        lineHeight: 1.6
                    }}>
                        Join thousands of traders using institutional-grade analytics
                        to make smarter decisions. No credit card required.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            'Free access to real-time market data',
                            'Paper trading with zero risk',
                            'AI-powered decision support'
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#10b981',
                                    flexShrink: 0
                                }} />
                                <span style={{ color: '#71717a', fontSize: '0.875rem' }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Register Card (35%) */}
            <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                backgroundColor: '#0d0d12',
                borderLeft: '1px solid rgba(255,255,255,0.05)'
            }} className="lg:w-[35%]">
                <div style={{ width: '100%', maxWidth: '420px' }}>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                        Create account
                    </h2>
                    <p style={{ color: '#71717a', marginBottom: '2rem' }}>
                        Begin your trading journey
                    </p>

                    {/* Register Card */}
                    <div style={{
                        backgroundColor: '#111116',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Google Sign-up */}
                            <button
                                type="button"
                                onClick={handleGoogleSignup}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    backgroundColor: 'white',
                                    color: '#27272a',
                                    fontWeight: 500,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign up with Google
                            </button>

                            {/* Divider */}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ padding: '0 0.75rem', color: '#52525b', fontSize: '0.75rem', textTransform: 'uppercase' }}>or</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            {/* Email/Password Form */}
                            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#52525b' }} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            style={{
                                                width: '100%',
                                                paddingLeft: '40px',
                                                paddingRight: '16px',
                                                paddingTop: '12px',
                                                paddingBottom: '12px',
                                                backgroundColor: '#0a0a0f',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '0.875rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#52525b' }} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            required
                                            style={{
                                                width: '100%',
                                                paddingLeft: '40px',
                                                paddingRight: '16px',
                                                paddingTop: '12px',
                                                paddingBottom: '12px',
                                                backgroundColor: '#0a0a0f',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '0.875rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#52525b' }} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            style={{
                                                width: '100%',
                                                paddingLeft: '40px',
                                                paddingRight: '16px',
                                                paddingTop: '12px',
                                                paddingBottom: '12px',
                                                backgroundColor: '#0a0a0f',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '0.875rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    {/* Password Strength */}
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <div style={{
                                            height: '4px',
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            borderRadius: '2px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: strength < 2 ? '20%' : strength < 4 ? '60%' : '100%',
                                                backgroundColor: strength < 2 ? '#ef4444' : strength < 4 ? '#eab308' : '#10b981',
                                                transition: 'all 0.3s ease'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '0.625rem', textAlign: 'right', color: '#71717a', marginTop: '0.25rem' }}>
                                            {strength < 2 ? 'Weak' : strength < 4 ? 'Moderate' : 'Strong'}
                                        </div>
                                    </div>
                                </div>

                                {/* Terms */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setTermsAccepted(!termsAccepted)}
                                        style={{
                                            marginTop: '2px',
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '4px',
                                            border: termsAccepted ? 'none' : '1px solid #52525b',
                                            backgroundColor: termsAccepted ? '#10b981' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            flexShrink: 0
                                        }}
                                    >
                                        {termsAccepted && <Check size={12} color="black" />}
                                    </button>
                                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: 1.4 }}>
                                        I agree to the <Link href="/terms" style={{ color: 'white', textDecoration: 'none' }}>Terms of Service</Link> and <Link href="/privacy" style={{ color: 'white', textDecoration: 'none' }}>Privacy Policy</Link>.
                                    </span>
                                </div>

                                {error && (
                                    <div style={{
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        color: '#f87171',
                                        fontSize: '0.875rem'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: '#10b981',
                                        color: 'black',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        opacity: isLoading ? 0.5 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create account
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#71717a', marginTop: '1.5rem' }}>
                        Already have an account?{" "}
                        <Link href="/auth/login" style={{ color: '#10b981', fontWeight: 500, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
