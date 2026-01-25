'use client';

export const dynamic = "force-dynamic";

/**
 * /arena → /swap redirect
 * Kept for SEO / backward compatibility
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArenaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/swap');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500">Redirecting to Swap...</p>
    </div>
  );
}
