import { EmptyState } from '@/components/ui/EmptyState';

export default function TokenPage({ params }: { params: { address: string } }) {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Token Analysis</h1>
            <p className="text-zinc-500 mb-8 font-mono">{params.address}</p>
            <EmptyState text="Asset Intelligence" subtext="Deep chart analysis and signals coming soon." />
        </div>
    );
}
