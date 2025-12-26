'use client';

import type { Scenario } from '@/lib/types/market';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, TrendingDown, AlertTriangle } from 'lucide-react';

interface ScenarioOutlookProps {
    scenarios: Scenario[];
    className?: string;
}

const scenarioConfig = {
    bull: {
        label: 'Bullish Scenario',
        icon: TrendingUp,
        color: 'emerald',
        bgGradient: 'from-emerald-500/10 to-emerald-600/5',
        borderColor: 'border-emerald-500/30',
    },
    base: {
        label: 'Base Case',
        icon: ArrowRight,
        color: 'blue',
        bgGradient: 'from-blue-500/10 to-blue-600/5',
        borderColor: 'border-blue-500/30',
    },
    bear: {
        label: 'Bearish Scenario',
        icon: TrendingDown,
        color: 'red',
        bgGradient: 'from-red-500/10 to-red-600/5',
        borderColor: 'border-red-500/30',
    },
};

function ScenarioCard({ scenario, index }: { scenario: Scenario; index: number }) {
    const config = scenarioConfig[scenario.id];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} rounded-xl p-5`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon size={18} className={`text-${config.color}-400`} />
                    <h4 className="font-semibold text-white">{config.label}</h4>
                </div>
                <div className={`text-lg font-bold text-${config.color}-400`}>
                    {scenario.probability}%
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-300 mb-4">
                {scenario.description}
            </p>

            {/* Details */}
            <div className="space-y-3 text-xs">
                <div>
                    <span className="text-zinc-500 uppercase tracking-wider">Trigger</span>
                    <p className="text-zinc-300 mt-1">{scenario.trigger}</p>
                </div>
                <div>
                    <span className="text-zinc-500 uppercase tracking-wider">Expected Behavior</span>
                    <p className="text-zinc-300 mt-1">{scenario.expectedBehavior}</p>
                </div>
                <div className="flex items-start gap-2">
                    <AlertTriangle size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-zinc-500 uppercase tracking-wider">Risk Signal</span>
                        <p className="text-yellow-400/80 mt-1">{scenario.riskSignal}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function ScenarioOutlook({ scenarios, className = '' }: ScenarioOutlookProps) {
    // Validate probabilities sum to 100 (with tolerance)
    const totalProb = scenarios.reduce((sum, s) => sum + s.probability, 0);
    const isValidDistribution = Math.abs(totalProb - 100) <= 5;

    // Sort by probability descending
    const sortedScenarios = [...scenarios].sort((a, b) => b.probability - a.probability);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Section Header */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Probabilistic Outlook</h3>
                <p className="text-sm text-zinc-400">
                    Forward-looking scenarios based on current market structure and historical analogs.
                    These are probabilistic assessments, not predictions.
                </p>
            </div>

            {/* Probability Distribution Bar */}
            <div className="mb-6">
                <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800">
                    {sortedScenarios.map((scenario) => (
                        <div
                            key={scenario.id}
                            style={{ width: `${scenario.probability}%` }}
                            className={`h-full ${scenario.id === 'bull' ? 'bg-emerald-500' :
                                    scenario.id === 'base' ? 'bg-blue-500' :
                                        'bg-red-500'
                                }`}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
                    <span>Bullish {sortedScenarios.find(s => s.id === 'bull')?.probability}%</span>
                    <span>Base {sortedScenarios.find(s => s.id === 'base')?.probability}%</span>
                    <span>Bearish {sortedScenarios.find(s => s.id === 'bear')?.probability}%</span>
                </div>
            </div>

            {/* Probability Warning */}
            {!isValidDistribution && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-400">
                    <AlertTriangle size={12} className="inline mr-2" />
                    Scenario probabilities do not sum to 100%. Analysis may be incomplete.
                </div>
            )}

            {/* Scenario Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.map((scenario, index) => (
                    <ScenarioCard key={scenario.id} scenario={scenario} index={index} />
                ))}
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-zinc-600 mt-4 italic">
                Scenarios represent one interpretation of possible outcomes. Actual results may differ materially.
                This is not a forecast or guarantee of any outcome. Do not trade based solely on this analysis.
            </p>
        </div>
    );
}
