import { type Metadata } from 'next';
import PathsDashboard from '@/components/paths/PathsDashboard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'My Paths | Zenith Academy',
    description: 'Your calibrated trading psychology profile and career roadmap.',
};

export default async function PathsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/login?callbackUrl=/learn/paths');
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12">
            <PathsDashboard />
        </div>
    );
}
