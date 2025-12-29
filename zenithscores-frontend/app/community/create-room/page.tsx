'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import CreateRoomModal from '@/components/community/CreateRoomModal';
import { createRoom } from '@/lib/actions/rooms';

export default function CreateRoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login');
    return null;
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
