'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Stepper, { Step } from '@/components/onboarding/Stepper';

export default function OnboardingPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    // Form state
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [usernameValid, setUsernameValid] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);

    const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isIdle, setIsIdle] = useState(false);

    // Idle detection for ambient bar
    useEffect(() => {
        let idleTimer: NodeJS.Timeout;
        const resetIdle = () => {
            setIsIdle(false);
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => setIsIdle(true), 15000);
        };
        resetIdle();
        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('keypress', resetIdle);
        return () => {
            clearTimeout(idleTimer);
            window.removeEventListener('mousemove', resetIdle);
            window.removeEventListener('keypress', resetIdle);
        };
    }, []);

    // Redirect if already onboarded (but not if we're in the middle of completing)
    useEffect(() => {
        if (!isCompleting && status === 'authenticated' && session?.user?.hasCompletedOnboarding) {
            router.replace('/command-center');
        }
    }, [session, status, router, isCompleting]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/auth/login');
        }
    }, [status, router]);

    // Username validation
    useEffect(() => {
        const validateUsername = async () => {
            if (!username) {
                setUsernameError('');
                setUsernameValid(false);
                return;
            }

            // Regex validation: 3-20 chars, a-z, 0-9, underscore
            const usernameRegex = /^[a-z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                setUsernameError('3-20 characters, lowercase letters, numbers, and underscores only');
                setUsernameValid(false);
                return;
            }

            // Check uniqueness
            setCheckingUsername(true);
            try {
                const res = await fetch(`/api/onboarding/check-username?username=${encodeURIComponent(username)}`);
                const data = await res.json();

                if (data.available) {
                    setUsernameError('');
                    setUsernameValid(true);
                } else {
                    setUsernameError('This username is already taken');
                    setUsernameValid(false);
                }
            } catch (e) {
                setUsernameError('Error checking username');
                setUsernameValid(false);
            } finally {
                setCheckingUsername(false);
            }
        };

        const debounce = setTimeout(validateUsername, 500);
        return () => clearTimeout(debounce);
    }, [username]);

    // Determine if user can proceed based on current step
    const canProceed = () => {
        if (currentStep === 1) return usernameValid && !checkingUsername;
        if (currentStep === 2) return true; // Optional step
        if (currentStep === 3) return agreedToTerms;
        return false;
    };

    // Handle final submission
    const handleComplete = async () => {
        if (!session?.user?.id || isCompleting) return;

        setIsCompleting(true);
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/onboarding/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    experienceLevel,
                })
            });

            if (res.ok) {
                // Use window.location for hard redirect to avoid React state issues
                window.location.href = '/command-center?welcome=true';
            } else {
                setIsCompleting(false);
                console.error('Failed to complete onboarding');
            }
        } catch (e) {
            setIsCompleting(false);
            console.error('Onboarding error:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-emerald-500 text-sm">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">

            {/* Ambient Activity Bar */}
            <div className="fixed left-0 top-0 bottom-0 w-1 z-50 flex items-end">
                <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-full transition-all ease-in-out"
                    style={{
                        height: isIdle ? '30%' : '40%',
                        animation: isIdle
                            ? 'ambientPulseIdle 6s ease-in-out infinite'
                            : 'ambientPulse 4s ease-in-out infinite',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                    }}
                />
            </div>

            <style jsx>{`
                @keyframes ambientPulse {
                    0%, 100% { height: 40%; }
                    50% { height: 70%; }
                }
                @keyframes ambientPulseIdle {
                    0%, 100% { height: 30%; }
                    50% { height: 50%; }
                }
            `}</style>

            <div className="min-h-screen flex items-center justify-center p-6">
                <Stepper
                    initialStep={1}
                    onStepChange={(step) => setCurrentStep(step)}
                    onFinalStepCompleted={handleComplete}
                    canProceed={canProceed()}
                    disableStepIndicators={true}
                >
                    {/* Step 1: Identity */}
                    <Step>
                        <div className="py-4">
                            <h2 className="text-xl font-bold text-white mb-2">Set your public identity</h2>
                            <p className="text-zinc-500 text-sm mb-6">This is how you'll appear across ZenithScores.</p>

                            <div className="space-y-2">
                                <label className="block text-sm text-zinc-400">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                    placeholder="trader_z"
                                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                                />
                                {checkingUsername && (
                                    <p className="text-xs text-zinc-500">Checking availability...</p>
                                )}
                                {usernameError && (
                                    <p className="text-xs text-red-400">{usernameError}</p>
                                )}
                                {usernameValid && !checkingUsername && (
                                    <p className="text-xs text-emerald-500">Username available ✓</p>
                                )}
                            </div>
                        </div>
                    </Step>

                    {/* Step 2: Trading Context (Optional) */}
                    <Step>
                        <div className="py-4">
                            <h2 className="text-xl font-bold text-white mb-2">Your trading background</h2>
                            <p className="text-zinc-500 text-sm mb-6">Help us tailor insights for you. (Optional)</p>

                            <div className="space-y-3">
                                {[
                                    { value: 'beginner', label: 'Beginner', desc: 'Learning the fundamentals' },
                                    { value: 'intermediate', label: 'Intermediate', desc: 'Active trader' },
                                    { value: 'advanced', label: 'Advanced', desc: 'Professional / systematic' }
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${experienceLevel === option.value
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="experience"
                                            value={option.value}
                                            checked={experienceLevel === option.value}
                                            onChange={(e) => setExperienceLevel(e.target.value)}
                                            className="mt-1 accent-emerald-500"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-white">{option.label}</div>
                                            <div className="text-xs text-zinc-500">{option.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </Step>

                    {/* Step 3: Platform Agreement */}
                    <Step>
                        <div className="py-4">
                            <h2 className="text-xl font-bold text-white mb-2">Platform agreement</h2>
                            <p className="text-zinc-500 text-sm mb-6">Please review and accept before continuing.</p>

                            <label className="flex items-start gap-3 p-4 rounded-lg border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-1 accent-emerald-500 w-4 h-4"
                                />
                                <div className="text-sm text-zinc-400">
                                    I understand ZenithScores provides market intelligence, not financial advice.
                                </div>
                            </label>
                        </div>
                    </Step>
                </Stepper>
            </div>
        </div>
    );
}
