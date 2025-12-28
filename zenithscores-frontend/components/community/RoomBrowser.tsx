'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Hash, Plus, Lock } from 'lucide-react';
import { getAllRooms, getUserRooms, joinRoom, leaveRoom } from '@/lib/actions/rooms';

interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  marketType: string;
  memberCount: number;
  postCount: number;
  isSystem: boolean;
  isPublic: boolean;
  requiresApproval: boolean;
  creatorId: string | null;
}

interface RoomBrowserProps {
  userId?: string;
  currentRoomSlug?: string;
}

const marketTypeColors = {
  crypto: 'border-amber-500/20 bg-amber-500/5',
  stock: 'border-blue-500/20 bg-blue-500/5',
  forex: 'border-emerald-500/20 bg-emerald-500/5'
};

export default function RoomBrowser({ userId, currentRoomSlug }: RoomBrowserProps) {
  const router = useRouter();
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [userRoomIds, setUserRoomIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
  }, [userId]);

  async function loadRooms() {
    setLoading(true);
    const rooms = await getAllRooms();
    setAllRooms(rooms);

    if (userId) {
      const userRooms = await getUserRooms(userId);
      setUserRoomIds(new Set(userRooms.map(r => r.id)));
    }

    setLoading(false);
  }

  async function handleJoinLeave(room: Room, e: React.MouseEvent) {
    e.stopPropagation();
    if (!userId || joiningRoomId) return;

    setJoiningRoomId(room.id);

    try {
      const isMember = userRoomIds.has(room.id);

      if (isMember) {
        await leaveRoom(userId, room.id);
        setUserRoomIds(prev => {
          const next = new Set(prev);
          next.delete(room.id);
          return next;
        });
      } else {
        const result = await joinRoom(userId, room.id);

        if (result.requestPending) {
          alert('Join request sent! Waiting for approval.');
        } else {
          setUserRoomIds(prev => new Set(prev).add(room.id));
        }
      }

      // Reload to update counts
      await loadRooms();
    } catch (error: any) {
      alert(error?.message || 'Failed to join/leave room');
    } finally {
      setJoiningRoomId(null);
    }
  }

  function handleRoomClick(room: Room) {
    router.push(`/community/rooms/${room.slug}`);
  }

  function handleCreateRoom() {
    router.push('/community/create-room');
  }

  const groupedRooms = allRooms.reduce((acc, room) => {
    if (!acc[room.marketType]) acc[room.marketType] = [];
    acc[room.marketType].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  if (loading) {
    return (
      <div className="border border-white/5 rounded-xl p-4 bg-[#0c0c10]">
        <div className="text-zinc-500 text-sm">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="border border-white/5 rounded-xl p-4 bg-[#0c0c10]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-zinc-500" />
          <h2 className="font-semibold text-white">Trader Rooms</h2>
        </div>
        {userId && (
          <button
            onClick={handleCreateRoom}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            title="Create Room"
          >
            <Plus size={16} className="text-zinc-500" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(groupedRooms).map(([marketType, rooms]) => (
          <div key={marketType}>
            <div className="text-xs font-medium text-zinc-500 uppercase mb-2">
              {marketType}
            </div>
            <div className="space-y-2">
              {rooms.map(room => {
                const isMember = userRoomIds.has(room.id);
                const isActive = currentRoomSlug === room.slug;

                return (
                  <div
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    className={`
                      border rounded-lg p-3 cursor-pointer transition-all
                      ${isActive
                        ? 'border-[var(--accent-mint)] bg-[var(--accent-mint)]/5'
                        : `border-white/5 hover:border-white/10 ${marketTypeColors[marketType as keyof typeof marketTypeColors]}`
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-medium text-white">{room.name}</h3>
                        {!room.isPublic && <Lock size={12} className="text-zinc-500" />}
                      </div>
                      {userId && (
                        <button
                          onClick={(e) => handleJoinLeave(room, e)}
                          disabled={joiningRoomId === room.id}
                          className={`
                            text-xs px-2 py-1 rounded transition-colors whitespace-nowrap
                            ${isMember
                              ? 'text-zinc-400 hover:text-red-400 border border-white/10'
                              : 'bg-[var(--accent-mint)] text-[var(--void)] hover:opacity-90'
                            }
                            ${joiningRoomId === room.id ? 'opacity-50' : ''}
                          `}
                        >
                          {joiningRoomId === room.id
                            ? '...'
                            : isMember
                            ? 'Leave'
                            : room.requiresApproval
                            ? 'Request'
                            : 'Join'
                          }
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mb-2 line-clamp-2">
                      {room.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {room.memberCount}
                      </span>
                      <span>{room.postCount} posts</span>
                      {room.requiresApproval && (
                        <span className="text-amber-500">Approval required</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
