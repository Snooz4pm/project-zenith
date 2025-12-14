// File: protocol-zenith-frontend/app/page.js

import TokenScoringDashboard from '../components/TokenScoringDashboard';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-8 text-center text-indigo-400">
                    Protocol Zenith: DeFi Oracle Dashboard
                </h1>

                {/* --- Main Dashboard Component --- */}
                <TokenScoringDashboard />

                <div className="mt-12 p-6 bg-gray-800 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-semibold mb-4 text-orange-400">Worker Status</h2>
                    <p className="text-gray-400">
                        The scoring worker is running in the background, scheduled by QStash.
                        It pulls data from Dexscreener, GoPlus, and Gemini for real-time analysis.
                    </p>
                    <button className="mt-4 px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition duration-150">
                        Trigger Worker (Optional Feature)
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}
