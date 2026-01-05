import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-2xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Zenith Scores
          </h1>
          <p className="text-xl text-zinc-400">
            Professional Solana Trading Terminal
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/swap">
            <Button className="w-full sm:w-auto px-8 py-6 text-lg">
              Launch Terminal <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/discover">
            <Button variant="secondary" className="w-full sm:w-auto px-8 py-6 text-lg">
              Discover Tokens
            </Button>
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-zinc-500">
          <div>
            <div className="font-bold text-white text-lg mb-1">Fast</div>
            Jupiter Aggregation
          </div>
          <div>
            <div className="font-bold text-white text-lg mb-1">Secure</div>
            Non-custodial
          </div>
          <div>
            <div className="font-bold text-white text-lg mb-1">Pro</div>
            Advanced Analytics
          </div>
        </div>
      </div>
    </div>
  );
}
