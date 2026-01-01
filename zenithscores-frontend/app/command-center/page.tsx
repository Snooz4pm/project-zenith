import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardCockpitNew from '@/components/command-center/DashboardCockpitNew';

export const metadata: Metadata = {
    title: 'Command Center | ZenithScores',
    description: 'Your trading command center dashboard',
};

export default async function CommandCenterPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login');
    }

    return <DashboardCockpitNew user={session.user} />;
}
