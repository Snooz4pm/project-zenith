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

    return <MobileProfile />;
}
