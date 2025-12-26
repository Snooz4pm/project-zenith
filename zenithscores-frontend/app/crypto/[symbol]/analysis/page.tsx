import { getAnalysis } from '@/lib/api/zenith-adapter';
import { analysisGuard } from '@/lib/guards/analysisGuard';
import dynamic from 'next/dynamic';

// Analysis components
import ExecutiveThesis from '@/components/analysis/ExecutiveThesis';
import { FactorStack, ScenarioOutlook, TradeLogic, InvalidationPanel } from '@/components/analysis';

// Chart component (client-only)
const FullChart = dynamic(() => import('@/components/charts/FullChart'), { ssr: false });

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export default async function CryptoAnalysisPage({ params }: PageProps) {
    const { symbol } = await params;

    // Fetch data
    const data = await getAnalysis('crypto', symbol.toUpperCase());

    // HARD STOP IF NOT VALID - redirects to /not-available
    analysisGuard(data);

    return (
        <main className="min-h-screen bg-[#0a0a12] px-6 py-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* SECTION 1: Executive Thesis */}
                <ExecutiveThesis asset={data.asset} />

                {/* SECTION 2: Advanced Chart */}
                <section>
                    <FullChart
                        ohlcv={data.ohlcv}
                        regime={data.asset.regime}
                        entryZone={data.tradeLogic.entryZone}
                        invalidationLevel={data.tradeLogic.invalidationLevel.price}
                    />
                </section>

                {/* SECTION 3: Quantitative Breakdown */}
                <section>
                    <FactorStack factors={data.factors} />
                </section>

                {/* SECTION 4: Probabilistic Scenarios */}
                <section>
                    <ScenarioOutlook scenarios={data.scenarios} />
                </section>

                {/* SECTION 5: Trade Expression */}
                <section>
                    <TradeLogic tradeLogic={data.tradeLogic} symbol={data.asset.symbol} />
                </section>

                {/* SECTION 6: What Breaks the Thesis */}
                <section>
                    <InvalidationPanel invalidations={data.invalidationSignals} />
                </section>

            </div>
        </main>
    );
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
    const { symbol } = await params;
    return {
        title: `${symbol.toUpperCase()} Analysis | ZenithScore`,
        description: `Deep quantitative analysis for ${symbol.toUpperCase()} - regime detection, factor breakdown, and probabilistic scenarios.`,
    };
}
