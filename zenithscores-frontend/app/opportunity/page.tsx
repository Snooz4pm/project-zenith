
"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Package, Users, DollarSign } from 'lucide-react';

interface Opportunity {
    keyword: string;
    opportunity_score: number;
    avg_price: number;
    supplier_count: number;
    listing_count: number;
    confidence: string;
    is_red_ocean: boolean;
}

// Demo data for production (when backend isn't deployed)
const DEMO_OPPORTUNITIES: Opportunity[] = [
    { keyword: "yoga mat", opportunity_score: 72.5, avg_price: 12.50, supplier_count: 45, listing_count: 60, confidence: "HIGH", is_red_ocean: false },
    { keyword: "portable blender", opportunity_score: 68.3, avg_price: 8.75, supplier_count: 38, listing_count: 50, confidence: "HIGH", is_red_ocean: true },
    { keyword: "gaming mouse", opportunity_score: 55.2, avg_price: 15.20, supplier_count: 52, listing_count: 55, confidence: "HIGH", is_red_ocean: true },
    { keyword: "bamboo toothbrush", opportunity_score: 81.4, avg_price: 2.30, supplier_count: 18, listing_count: 48, confidence: "HIGH", is_red_ocean: false },
    { keyword: "resistance bands", opportunity_score: 63.7, avg_price: 4.50, supplier_count: 42, listing_count: 52, confidence: "HIGH", is_red_ocean: true },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Calculate score components for visualization
function getScoreBreakdown(opp: Opportunity) {
    const supplyPressure = opp.listing_count > 0 ? opp.supplier_count / opp.listing_count : 0;
    const priceSignal = Math.min(opp.avg_price / 50, 1);

    // Reverse supply pressure for display (lower is better)
    const supplyScore = Math.round((1 - supplyPressure) * 100);
    const priceScore = Math.round(priceSignal * 100);

    return { supplyScore, priceScore, supplyPressure };
}

// Get market insight based on data
function getMarketInsight(opp: Opportunity): { text: string; type: 'opportunity' | 'warning' | 'danger' } {
    const { supplyPressure } = getScoreBreakdown(opp);

    if (!opp.is_red_ocean && opp.opportunity_score > 60) {
        return { text: "Low competition + healthy margins. Strong entry point.", type: 'opportunity' };
    } else if (supplyPressure > 0.9) {
        return { text: "Extremely saturated. Most suppliers are fighting for the same customers.", type: 'danger' };
    } else if (opp.is_red_ocean) {
        return { text: "High supplier density. Differentiation or unique sourcing required.", type: 'warning' };
    } else {
        return { text: "Moderate competition. Room for well-positioned entrants.", type: 'opportunity' };
    }
}

export default function OpportunityDashboard() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/catalog/top10`);
                if (!response.ok) throw new Error('API not available');
                const data = await response.json();
                setOpportunities(data.top_opportunities);
            } catch (error) {
                console.warn('Using demo data - Backend API not reachable:', error);
                setOpportunities(DEMO_OPPORTUNITIES);
                setIsDemo(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xl">Scanning Markets...</span>
                </div>
            </div>
        );
    }

    const blueOceanCount = opportunities.filter(o => !o.is_red_ocean).length;
    const avgScore = opportunities.length > 0
        ? Math.round(opportunities.reduce((sum, o) => sum + o.opportunity_score, 0) / opportunities.length)
        : 0;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="w-8 h-8 text-blue-500" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            E-commerce Opportunity Engine
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        Supply-side market analysis. Find gaps before they close.
                    </p>
                    {isDemo && (
                        <div className="mt-4 px-4 py-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm inline-block">
                            ⚠️ Demo Mode - Connect backend for live data
                        </div>
                    )}
                </header>

                {/* Methodology Banner */}
                <div className="mb-8 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BarChart3 size={16} /> How We Score
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <Users size={16} className="text-green-400" />
                            </div>
                            <div>
                                <div className="font-semibold text-white">Supply Pressure (70%)</div>
                                <div className="text-gray-400">Fewer suppliers per listing = less competition = higher score</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <DollarSign size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <div className="font-semibold text-white">Price Signal (30%)</div>
                                <div className="text-gray-400">Higher avg price = better margin potential = higher score</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                        <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Top Score</h3>
                        <p className="text-2xl font-bold text-white">{opportunities[0]?.opportunity_score.toFixed(1) || "N/A"}</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                        <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Avg Score</h3>
                        <p className="text-2xl font-bold text-white">{avgScore}</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                        <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Blue Ocean</h3>
                        <p className="text-2xl font-bold text-green-400">{blueOceanCount}</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                        <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Scanned</h3>
                        <p className="text-2xl font-bold text-white">{opportunities.length}</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Opportunities List */}
                    <div className="lg:col-span-2 space-y-3">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-400" /> Top Opportunities
                        </h2>

                        {opportunities.map((opp, index) => {
                            const { supplyScore, priceScore } = getScoreBreakdown(opp);
                            const insight = getMarketInsight(opp);
                            const isSelected = selectedOpp?.keyword === opp.keyword;

                            return (
                                <div
                                    key={opp.keyword}
                                    onClick={() => setSelectedOpp(isSelected ? null : opp)}
                                    className={`bg-gray-900/80 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-500/50 ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-gray-800'
                                        }`}
                                >
                                    {/* Top Row */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-600 font-mono text-sm w-6">{String(index + 1).padStart(2, '0')}</span>
                                            <div>
                                                <div className="font-bold text-white capitalize">{opp.keyword}</div>
                                                <div className="text-xs text-gray-500">${opp.avg_price.toFixed(2)} avg • {opp.supplier_count} suppliers</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Status Badge */}
                                            {opp.is_red_ocean ? (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-900/30 border border-red-500/30 text-red-400 text-xs font-bold">
                                                    <AlertTriangle size={12} /> Saturated
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/30 border border-green-500/30 text-green-400 text-xs font-bold">
                                                    <CheckCircle size={12} /> Open
                                                </span>
                                            )}
                                            {/* Score */}
                                            <div className={`text-2xl font-bold ${opp.opportunity_score > 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {opp.opportunity_score.toFixed(0)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score Breakdown Bars */}
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-500">Supply Score</span>
                                                <span className="text-gray-400">{supplyScore}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${supplyScore > 30 ? 'bg-green-500' : 'bg-red-500'}`}
                                                    style={{ width: `${supplyScore}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-500">Price Signal</span>
                                                <span className="text-gray-400">{priceScore}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${priceScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded View */}
                                    {isSelected && (
                                        <div className="mt-4 pt-4 border-t border-gray-800">
                                            <div className={`p-3 rounded-lg text-sm ${insight.type === 'opportunity' ? 'bg-green-900/20 text-green-300' :
                                                    insight.type === 'warning' ? 'bg-yellow-900/20 text-yellow-300' :
                                                        'bg-red-900/20 text-red-300'
                                                }`}>
                                                <strong>Market Insight:</strong> {insight.text}
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                                                <div>
                                                    <div className="text-2xl font-bold text-white">{opp.listing_count}</div>
                                                    <div className="text-xs text-gray-500">Listings</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-white">{opp.supplier_count}</div>
                                                    <div className="text-xs text-gray-500">Suppliers</div>
                                                </div>
                                                <div>
                                                    <div className={`text-lg font-bold px-2 py-1 rounded ${opp.confidence === 'HIGH' ? 'bg-blue-900/30 text-blue-400' :
                                                            opp.confidence === 'MEDIUM' ? 'bg-gray-700 text-gray-300' :
                                                                'bg-red-900/30 text-red-400'
                                                        }`}>
                                                        {opp.confidence}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">Confidence</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">

                        {/* Legend */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                            <h3 className="font-bold text-white mb-4">Understanding Scores</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-6 rounded bg-gradient-to-r from-green-600 to-green-400"></div>
                                    <div>
                                        <div className="font-medium text-white">70+ Score</div>
                                        <div className="text-gray-500">Strong opportunity</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-6 rounded bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
                                    <div>
                                        <div className="font-medium text-white">40-70 Score</div>
                                        <div className="text-gray-500">Moderate potential</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-6 rounded bg-gradient-to-r from-red-600 to-red-400"></div>
                                    <div>
                                        <div className="font-medium text-white">&lt;40 Score</div>
                                        <div className="text-gray-500">High competition</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Market Status */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                            <h3 className="font-bold text-white mb-4">Market Status</h3>
                            {opportunities.every(o => o.is_red_ocean) ? (
                                <div className="flex items-start gap-3 text-red-400">
                                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium">All Markets Saturated</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            Consider niche products or unique sourcing strategies.
                                        </div>
                                    </div>
                                </div>
                            ) : blueOceanCount > 0 ? (
                                <div className="flex items-start gap-3 text-green-400">
                                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium">{blueOceanCount} Open Markets Found</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            Low competition opportunities available.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 text-yellow-400">
                                    <TrendingDown className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium">Mixed Signals</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            Some opportunities, proceed with research.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Data Freshness */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                            <h3 className="font-bold text-white mb-2">Data Source</h3>
                            <div className="text-sm text-gray-400">
                                <p>Real-time analysis of <span className="text-white font-medium">Alibaba supplier listings</span>.</p>
                                <p className="mt-2 text-xs text-gray-600">Updated every batch run.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
