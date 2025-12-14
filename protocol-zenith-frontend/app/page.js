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
            </main>

            <Footer />
        </div>
    );
}
