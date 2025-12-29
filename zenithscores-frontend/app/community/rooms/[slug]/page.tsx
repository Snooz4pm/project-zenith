import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRoomBySlug, isUserInRoom } from '@/lib/actions/rooms';
import RoomFeed from '@/components/community/RoomFeed';

interface RoomPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const isMember = await isUserInRoom(session.user.id, room.id);

  return (
    <RoomFeed
      room={room}
      userId={session.user.id}
      isMember={isMember}
    />
  );
}
