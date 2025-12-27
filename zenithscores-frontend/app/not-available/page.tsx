import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotAvailablePage() {
    return (
        <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 mb-6">
                    <AlertCircle size={32} className="text-amber-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">
                    Analysis Not Available
                </h1>

                <p className="text-zinc-400 mb-6 leading-relaxed">
                    Deep analysis is available for all assets with live price data.
                    This asset may not have sufficient data or the analysis is being generated.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/crypto"
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
                    >
                        View Crypto
                    </Link>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                    >
                        Go Home
                    </Link>
                </div>

                <p className="text-xs text-zinc-600 mt-8">
                    All assets with live price data have deep analysis available.
                </p>
            </div>
        </div>
    );
}
