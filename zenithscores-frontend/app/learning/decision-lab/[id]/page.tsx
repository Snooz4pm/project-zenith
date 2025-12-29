'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@/components/ui/PageLoader';
import DecisionEngine from '@/components/learning/DecisionEngine';

export default function DecisionLabRunnerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [scenario, setScenario] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchScenario() {
            try {
                const res = await fetch(`/api/decision-lab/${params.id}`);

                if (!res.ok) {
                    if (res.status === 404) throw new Error('Scenario not found');
                    if (res.status === 401) {
                        router.push('/auth/login');
                        return;
                    }
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to load scenario');
                }

                const data = await res.json();

                // Safety check on chartData
                if (!data.chartData || !Array.isArray(data.chartData) || data.chartData.length === 0) {
                    throw new Error('Scenario data is corrupt (Missing Chart Snapshot)');
                }

                setScenario(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        if (params.id) {
            fetchScenario();
        }
    }, [params.id, router]);

    const handleDecision = async (choice: string, timeToDecisionMs: number, leverage: number = 1) => {
        if (!scenario) return;

        const res = await fetch('/api/decision-lab/attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scenarioId: scenario.id,
                choice,
                timeToDecisionMs,
                leverage
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to log decision');
        }

        return res.json(); // Return the result (PnL, newBalance)
    };

    if (isLoading) return <PageLoader pageName="Simulation" />;

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Simulation Error</h2>
                    <p className="text-red-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/learning/decision-lab')}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                        Return to Lab
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[var(--void)] p-4 md:p-6 flex flex-col">
            <div className="flex-1 h-full max-w-[1920px] mx-auto w-full">
                <DecisionEngineWrapper
                    scenario={scenario}
                    onDecision={handleDecision}
                />
            </div>
        </div>
    );
}

// Wrapper to manage choice state for reflection
function DecisionEngineWrapper({ scenario, onDecision }: { scenario: any, onDecision: any }) {
    const router = useRouter();
    const [choice, setChoice] = useState<string | null>(null);

    const handleDecisionInternal = async (c: string, t: number, l: number) => {
        setChoice(c);
        return await onDecision(c, t, l);
    };

    const handleReflectInternal = async (content: string) => {
        if (!choice) return; // Should not happen

        const res = await fetch('/api/decision-lab/reflect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scenarioId: scenario.id,
                symbol: scenario.symbol,
                timeframe: scenario.timeframe,
                userChoice: choice,
                content
            })
        });

        if (res.ok) {
            router.push('/learning/decision-lab');
        } else {
            throw new Error('Failed to save reflection');
        }
    };

    return (
        <DecisionEngine
            scenario={scenario}
            onDecision={handleDecisionInternal}
            onReflect={handleReflectInternal}
        />
    );
}
