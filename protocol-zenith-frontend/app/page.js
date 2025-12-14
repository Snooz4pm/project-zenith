// File: protocol-zenith-frontend/app/page.js

import TokenScoringDashboard from '../components/TokenScoringDashboard';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-950">
            <Header />

            <main className="py-8">
                {/* Main Dashboard Component */}
                <TokenScoringDashboard />

                {/* Worker Status Card */}
                <div className="container mx-auto px-4 md:px-8 mt-12 max-w-5xl">
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-4 text-green-400">Worker Status</h2>
                        <p className="text-gray-400 mb-4">
                            The scoring worker runs in the background, scheduled by QStash.
                            It pulls data from Dexscreener, GoPlus, Moralis, and Gemini for real-time analysis.
                        </p>
                        <button className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg transition duration-200 shadow-lg hover:shadow-green-400/50">
                            Trigger Worker (Optional Feature)
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
