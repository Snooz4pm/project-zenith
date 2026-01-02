"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
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

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (res?.error) {
                setError("Invalid email or password")
            } else {
                window.location.href = "/command-center"
            }
        } catch (err) {
            setError("An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl: "/command-center" })
    }

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

                {/* Logo */}
                <Link href="/" style={{
                    position: 'absolute',
                    top: '2rem',
                    left: '3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textDecoration: 'none'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: '#10b981',
                            opacity: 0.2,
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                        }} />
                        <div style={{
                            position: 'absolute',
                            inset: '2px',
                            backgroundColor: '#0a0a0f',
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                        }} />
                        <span style={{ position: 'relative', color: '#10b981', fontWeight: 'bold', fontSize: '1.25rem' }}>Z</span>
                    </div>
                    <span style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white' }}>ZenithScores</span>
                </Link>

                <div style={{ maxWidth: '480px' }}>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '1.5rem',
                        lineHeight: 1.1
                    }}>
                        Market Intelligence,<br />
                        <span style={{ color: '#10b981' }}>Engineered.</span>
                    </h1>

                    <p style={{
                        fontSize: '1.125rem',
                        color: '#a1a1aa',
                        marginBottom: '2.5rem',
                        lineHeight: 1.6
                    }}>
                        Real-time analytics and AI-powered insights for professional traders.
                        Non-custodial. Transparent. Built for precision.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            'Institutional-grade data from Finnhub & DexScreener',
                            'Zero custody — your keys, your assets',
                            'Decision Lab for behavioral optimization'
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

            {/* Right Panel - Login Card (35%) */}
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

                    {/* Mobile Logo */}
                    <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <Link href="/" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            textDecoration: 'none'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: '#10b981',
                                    opacity: 0.2,
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    inset: '2px',
                                    backgroundColor: '#0a0a0f',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                }} />
                                <span style={{ position: 'relative', color: '#10b981', fontWeight: 'bold', fontSize: '1.25rem' }}>Z</span>
                            </div>
                            <span style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white' }}>ZenithScores</span>
                        </Link>
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                        Welcome back
                    </h2>
                    <p style={{ color: '#71717a', marginBottom: '2rem' }}>
                        Sign in to access your dashboard
                    </p>

                    {/* Login Card */}
                    <div style={{
                        backgroundColor: '#111116',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Google Sign-in */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
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
                                Continue with Google
                            </button>

                            {/* Divider */}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ padding: '0 0.75rem', color: '#52525b', fontSize: '0.75rem', textTransform: 'uppercase' }}>or</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            {/* Email/Password Form */}
                            <form onSubmit={handleCredentialsLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>Password</label>
                                        <Link href="/auth/forgot-password" style={{ fontSize: '0.75rem', color: '#10b981', textDecoration: 'none' }}>
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#52525b' }} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
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
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign in
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#71717a', marginTop: '1.5rem' }}>
                        Don't have an account?{" "}
                        <Link href="/auth/register" style={{ color: '#10b981', fontWeight: 500, textDecoration: 'none' }}>
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
