'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import CreateRoomModal from '@/components/community/CreateRoomModal';
import WalletGate from '@/components/WalletGate';
import { createRoom } from '@/lib/actions/rooms';

export default function CreateRoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { connected } = useWallet();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Show wallet gate if not connected
  if (!connected) {
    return (
      <div className="min-h-screen bg-[var(--void)] text-white">
        <div className="max-w-md mx-auto p-6 pt-20">
          <button
            onClick={() => router.push('/community')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Community
          </button>
          
          <h1 className="text-2xl font-bold mb-6">Create a Room</h1>
          
          <WalletGate 
            message="Engage with the community.&#10;Connect your wallet to create rooms and learn together."
          />
        </div>
      </div>
    );
  }

  async function handleCreateRoom(data: {
    name: string;
    slug: string;
    description: string;
    marketType: 'crypto' | 'stock' | 'forex';
    isPublic: boolean;
    requiresApproval: boolean;
    maxMembers?: number;
  }) {
    if (!session?.user?.id) return;

    try {
      const room = await createRoom(session.user.id, data);
      router.push(`/community/rooms/${room.slug}`);
    } catch (error: any) {
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-[var(--void)] text-white">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.push('/community')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Community
        </button>

        <CreateRoomModal
          isOpen={true}
          onClose={() => router.push('/community')}
          onSubmit={handleCreateRoom}
        />
      </div>
    </div>
  );
}
