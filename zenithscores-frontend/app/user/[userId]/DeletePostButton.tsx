'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deletePost } from '@/lib/actions/community';

export default function DeletePostButton({ postId }: { postId: string }) {
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const result = await deletePost(postId);
            if (result.success) {
                router.refresh();
            }
        } catch (e) {
            console.error('Failed to delete post:', e);
        } finally {
            setDeleting(false);
            setConfirming(false);
        }
    };

    if (confirming) {
        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                    {deleting ? '...' : 'Delete'}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="px-2 py-1 text-xs bg-white/10 text-zinc-400 rounded hover:bg-white/20 transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete post"
        >
            <Trash2 size={14} />
        </button>
    );
}
