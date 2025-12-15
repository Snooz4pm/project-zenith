
"use client";

import { useEffect, useState } from 'react';

interface Opportunity {
    keyword: string;
    opportunity_score: number;
    avg_price: number;
    supplier_count: number;
    listing_count: number;
    confidence: string;
    is_red_ocean: boolean;
}

export default function OpportunityDashboard() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/catalog/top10');
                const data = await response.json();
                setOpportunities(data.top_opportunities);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">Loading Opportunities...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                        Opportunity Engine
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Daily supply-side analysis of emerging product niches.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Top Opportunity</h3>
                        <p className="text-3xl font-bold text-white">{opportunities[0]?.keyword || "N/A"}</p>
                        <div className="text-green-400 font-mono text-sm mt-2">Score: {opportunities[0]?.opportunity_score || 0}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Scanned</h3>
                        <p className="text-3xl font-bold text-white">{opportunities.length}</p>
                        <div className="text-blue-400 font-mono text-sm mt-2">Keywords Analyzed</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Market Status</h3>
                        <p className="text-lg text-white">
                            {opportunities.some(o => o.is_red_ocean) ? "Warning: Saturation Detected" : "Healthy Markets"}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-medium">Keyword</th>
                                <th className="p-4 font-medium">Opp. Score</th>
                                <th className="p-4 font-medium">Avg Price</th>
                                <th className="p-4 font-medium">Suppliers</th>
                                <th className="p-4 font-medium">Confidence</th>
                                <th className="p-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {opportunities.map((opp) => (
                                <tr key={opp.keyword} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4 font-medium text-white">{opp.keyword}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono font-bold ${opp.opportunity_score > 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {opp.opportunity_score}
                                            </span>
                                            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${opp.opportunity_score > 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                    style={{ width: `${opp.opportunity_score}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300">${opp.avg_price}</td>
                                    <td className="p-4 text-gray-300">
                                        {opp.supplier_count} <span className="text-gray-600 text-xs">/ {opp.listing_count} listings</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${opp.confidence === 'HIGH' ? 'bg-blue-900 text-blue-300' :
                                                opp.confidence === 'MEDIUM' ? 'bg-gray-700 text-gray-300' :
                                                    'bg-red-900 text-red-300'
                                            }`}>
                                            {opp.confidence}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {opp.is_red_ocean ? (
                                            <span className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase">
                                                <span className="w-2 h-2 rounded-full bg-red-500"></span> Red Ocean
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Blue Ocean
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
