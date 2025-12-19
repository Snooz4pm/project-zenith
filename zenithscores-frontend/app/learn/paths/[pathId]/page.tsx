import { type Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PathRoadmap from '@/components/paths/PathRoadmap';
import { PATHS_CONTENT } from '@/lib/paths-content';

interface PageProps {
    params: {
        pathId: string;
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const content = PATHS_CONTENT[params.pathId];
    return {
        title: content ? `${content.name} Roadmap | Zenith Academy` : 'Path Not Found',
    };
}

export default async function RoadmapPage({ params }: PageProps) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect(`/auth/login?callbackUrl=/learn/paths/${params.pathId}`);
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12">
            <PathRoadmap pathId={params.pathId} />
        </div>
    );
}
