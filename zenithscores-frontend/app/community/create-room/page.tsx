'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import CreateRoomModal from '@/components/community/CreateRoomModal';
import { createRoom } from '@/lib/actions/rooms';

export default function CreateRoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  async function handleCreateRoom(data: any) {
    if (!session?.user?.id) return;

    const room = await createRoom(session.user.id, data);
    router.push(`/community/rooms/${room.slug}`);
  }

  function handleClose() {
    setIsModalOpen(false);
    router.push('/community');
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--void)] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/community')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Community
        </button>

        <CreateRoomModal
          isOpen={isModalOpen}
          onClose={handleClose}
          onSubmit={handleCreateRoom}
        />
      </div>
    </div>
  );
}
