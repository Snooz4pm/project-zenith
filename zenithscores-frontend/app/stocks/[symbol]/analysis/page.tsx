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

export default async function StockAnalysisPage({ params }: PageProps) {
    const { symbol } = await params;

    // Fetch data
    const data = await getAnalysis('stock', symbol.toUpperCase());

    // HARD STOP IF NOT VALID
    analysisGuard(data);

    return (
        <main className="min-h-screen bg-[#0a0a12] px-6 py-8">
            <div className="max-w-5xl mx-auto space-y-8">

                <ExecutiveThesis asset={data.asset} />

                <section>
                    <FullChart
                        ohlcv={data.ohlcv}
                        regime={data.asset.regime}
                        entryZone={data.tradeLogic.entryZone}
                        invalidationLevel={data.tradeLogic.invalidationLevel.price}
                    />
                </section>

                <section>
                    <FactorStack factors={data.factors} />
                </section>

                <section>
                    <ScenarioOutlook scenarios={data.scenarios} />
                </section>

                <section>
                    <TradeLogic tradeLogic={data.tradeLogic} symbol={data.asset.symbol} />
                </section>

                <section>
                    <InvalidationPanel invalidations={data.invalidationSignals} />
                </section>

            </div>
        </main>
    );
}

export async function generateMetadata({ params }: PageProps) {
    const { symbol } = await params;
    return {
        title: `${symbol.toUpperCase()} Stock Analysis | ZenithScore`,
        description: `Deep quantitative analysis for ${symbol.toUpperCase()} stock.`,
    };
}
