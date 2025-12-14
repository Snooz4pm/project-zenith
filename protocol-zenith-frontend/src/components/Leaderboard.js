// src/components/Leaderboard.js (Enhanced Robinhood Style)

export default function Leaderboard({ data }) {

    const getScoreColor = (score) => {
        // Use a gradient-like system for the zenith score
        if (score >= 9) return 'text-lime-400';
        if (score >= 7) return 'text-green-500';
        if (score >= 5) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="bg-gray-800 shadow-2xl rounded-xl overflow-hidden border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50 backdrop-blur-sm sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Token / Chain</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Zenith Score</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider hidden md:table-cell">Sharpe Ratio</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider hidden sm:table-cell">Security</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {data.map((token) => (
                        // Add subtle hover effects and transition for smoothness
                        <tr
                            key={token.address}
                            className="bg-gray-900 hover:bg-gray-800/80 transition-all duration-300 cursor-pointer transform hover:scale-[1.01] shadow-lg"
                        >
                            <td className="px-6 py-4 whitespace-nowrap text-lg font-extrabold text-green-400">{token.rank}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="text-base font-semibold text-white">
                                        {token.coingecko_id ? token.coingecko_id.toUpperCase() : 'N/A'}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 truncate w-32 md:w-auto mt-0.5">
                                    {token.chain.toUpperCase()} • {token.address.substring(0, 6)}...{token.address.substring(token.address.length - 4)}
                                </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-xl font-extrabold ${getScoreColor(token.finalScore)}`}>
                                {token.finalScore}
                                {/* Optional: Add a subtle glow/animation for top scores */}
                                {token.rank <= 3 && (
                                    <span className="text-xs ml-1 inline-block animate-pulse">🌟</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 hidden md:table-cell">
                                {/* Use color to indicate profitability */}
                                <span className={token.sharpeRatio >= 1.5 ? 'text-green-400' : token.sharpeRatio >= 0.5 ? 'text-yellow-400' : 'text-red-400'}>
                                    {token.sharpeRatio}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full transition-colors ${token.securityScore >= 9 ? 'bg-green-600/20 text-green-400' :
                                        token.securityScore >= 7 ? 'bg-yellow-600/20 text-yellow-400' :
                                            'bg-red-600/20 text-red-400'
                                    }`}>
                                    {token.securityScore} / 10
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
