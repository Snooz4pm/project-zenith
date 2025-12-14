// src/app/page.js (Updated Theme)

import Leaderboard from '../components/Leaderboard';

async function fetchLeaderboardData() {
    const res = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/leaderboard`, {
        cache: 'no-store'
    });

    if (!res.ok) {
        console.error("Failed to fetch leaderboard:", res.status, await res.text());
        return { leaderboard: [], error: 'Failed to load data.' };
    }

    const data = await res.json();
    return data;
}

export default async function Home() {
    const { leaderboard, error } = await fetchLeaderboardData();

    return (
        // Updated background to a very dark gray/near-black
        <main className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 text-lime-400">
                    Protocol Zenith <span className="text-gray-400 font-light text-2xl">| Oracle v1.0</span>
                </h1>
                <p className="text-gray-500 mb-8 max-w-2xl">
                    Real-time DeFi Token Ranking based on weighted Security Score and Sharpe Ratio (Risk-Adjusted Return), refreshed via QStash worker.
                </p>

                {error && <div className="p-4 bg-red-900 text-red-300 rounded-lg border border-red-700">{error}</div>}

                {leaderboard.length === 0 && !error && (
                    <div className="p-4 bg-yellow-900 text-yellow-300 rounded-lg border border-yellow-700">
                        The leaderboard is currently empty. Please ensure the backend worker has run at least once.
                    </div>
                )}

                {leaderboard.length > 0 && <Leaderboard data={leaderboard} />}
            </div>
        </main>
    );
}
