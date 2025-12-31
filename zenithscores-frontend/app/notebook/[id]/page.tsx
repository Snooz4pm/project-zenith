import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import JournalEditor from '@/components/notebook/JournalEditor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function JournalPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return <div>Access Denied</div>;
    }

    const { id } = await params;

    // Fetch journal with proper typing
    const journal = await prisma.tradeJournal.findUnique({
        where: { id },
    });

    if (!journal) {
        notFound();
    }

    // SECURITY: Verify ownership - users can only view their own journals
    if (journal.userId !== session.user.id) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-zinc-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
            <JournalEditor journal={journal} userId={session.user.id} />
        </div>
    );
}
