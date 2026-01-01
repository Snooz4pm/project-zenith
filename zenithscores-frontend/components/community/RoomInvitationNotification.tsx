'use client';

import { useState } from 'react';
import { Check, X, Loader2, UserPlus } from 'lucide-react';
import { acceptInvitation, rejectInvitation } from '@/lib/actions/room-invitations';

interface RoomInvitationNotificationProps {
    invitationId: string;
    userId: string;
    roomName: string;
    inviterName: string;
    inviterImage: string | null;
    onRespond?: () => void; // Callback to refresh notification list
}

export default function RoomInvitationNotification({
    invitationId,
    userId,
    roomName,
    inviterName,
    inviterImage,
    onRespond
}: RoomInvitationNotificationProps) {
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [responded, setResponded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        setIsAccepting(true);
        setError(null);

        try {
            await acceptInvitation(invitationId, userId);
            setResponded(true);
            onRespond?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to accept invitation');
        } finally {
            setIsAccepting(false);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        setError(null);

        try {
            await rejectInvitation(invitationId, userId);
            setResponded(true);
            onRespond?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject invitation');
        } finally {
            setIsRejecting(false);
        }
    };

    if (responded) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02]">
                <div className="mt-0.5">
                    <UserPlus size={14} className="text-[var(--accent-mint)]" />
                </div>
                <div className="flex-1">
                    <p className="text-sm text-zinc-400">
                        Invitation responded to
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-3 bg-white/[0.02] border-l-2 border-[var(--accent-mint)]">
            <div className="flex items-start gap-3 mb-3">
                {/* Inviter Avatar */}
                {inviterImage ? (
                    <img
                        src={inviterImage}
                        alt={inviterName}
                        className="w-8 h-8 rounded-full mt-0.5"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-mint)]/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-medium text-[var(--accent-mint)]">
                            {inviterName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Message */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                        <span className="font-medium">{inviterName}</span> invited you to join{' '}
                        <span className="font-medium text-[var(--accent-mint)]">{roomName}</span>
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-2 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleAccept}
                    disabled={isAccepting || isRejecting}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--accent-mint)] text-[var(--void)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAccepting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Accepting...
                        </>
                    ) : (
                        <>
                            <Check size={12} />
                            Accept
                        </>
                    )}
                </button>
                <button
                    onClick={handleReject}
                    disabled={isAccepting || isRejecting}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-zinc-400 text-xs font-semibold rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRejecting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Rejecting...
                        </>
                    ) : (
                        <>
                            <X size={12} />
                            Decline
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
