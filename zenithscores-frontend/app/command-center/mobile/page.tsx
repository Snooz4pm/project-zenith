import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import MobileHome from '@/components/mobile/MobileHome';

export const metadata: Metadata = {
    title: 'Command Center | ZenithScores',
    description: 'Your trading command center',
};

export default async function MobileCommandCenterPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    return <MobileHome />;
}
