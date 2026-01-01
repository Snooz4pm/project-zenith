import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import MobileProfile from '@/components/mobile/MobileProfile';

export const metadata: Metadata = {
    title: 'Profile | ZenithScores',
    description: 'Your profile and settings',
};

export default async function MobileProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    const user = session.user;

    // Mock stats for now (replace with real data fetching later)
    const mockStats = {
        totalTrades: 124,
        winRate: 67,
        totalPnL: 12500,
        coursesCompleted: 8
    };

    return (
        <MobileProfile
            userId={user.id}
            name={user.name || 'Trader'}
            username={user.email?.split('@')[0] || 'trader'}
            image={user.image || undefined}
            level={5} // Mock level
            isOwnProfile={true}
            stats={mockStats}
        />
    );
}
