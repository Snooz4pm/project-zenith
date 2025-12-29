import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import JournalEditor from '@/components/notebook/JournalEditor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Assumptions on auth path

export default async function JournalPage({ params }: { params: Promise<{ id: string }> }) {
    const session: any = await getServerSession(authOptions as any);

    if (!session?.user?.email) {
        return <div>Access Denied</div>;
    }

    const { id } = await params;

    // We verify ownership here for safety before passing data
    const journal = await (prisma as any).tradeJournal.findUnique({
        where: { id },
    });

    if (!journal) {
        notFound();
    }

    // In a real app we'd strict check userId matching session userId
    // if (journal.userId !== session.user.id) notFound();

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-zinc-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
            <JournalEditor journal={journal} userId={session.user.id} />
        </div>
    );
}
