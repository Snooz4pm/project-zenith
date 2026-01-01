'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, AlertTriangle, Lock, Globe, Shield, Users } from 'lucide-react';
import { getRoomBySlug, updateRoom, deleteRoom, getPendingJoinRequests, approveJoinRequest, rejectJoinRequest } from '@/lib/actions/rooms';

interface SettingsPageProps {
    params: { slug: string };
}

export default function RoomSettingsPage({ params }: SettingsPageProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Form State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        isPublic: true,
        requiresApproval: false,
        maxMembers: null as number | null
    });

    // Delete Confirmation
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        // Load room when component mounts or params change
        if (params.slug) {
            loadRoom(params.slug);
        }
    }, [params.slug]);

    const loadRoom = async (roomSlug: string) => {
        try {
            const room = await getRoomBySlug(roomSlug);

            if (!room) {
                router.push('/community');
                return;
            }

            // Authorization check handled in UI render logic too, but quick redirect here
            if (session?.user?.id && room.creatorId !== session.user.id) {
                router.push(`/community/rooms/${roomSlug}`);
                return;
            }

            setFormData({
                id: room.id,
                name: room.name,
                description: room.description,
                isPublic: room.isPublic,
                requiresApproval: room.requiresApproval,
                maxMembers: room.maxMembers
            });

            // Load pending requests if approval is required
            if (room.requiresApproval && session?.user?.id) {
                const pending = await getPendingJoinRequests(session.user.id, room.id);
                setRequests(pending);
            }
        } catch (error) {
            console.error('Failed to load room:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        if (!session?.user?.id) return;
        try {
            await approveJoinRequest(session.user.id, requestId);
            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            console.error('Failed to approve request:', error);
            alert('Failed to approve request');
        }
    };

    const handleReject = async (requestId: string) => {
        if (!session?.user?.id) return;
        try {
            await rejectJoinRequest(session.user.id, requestId);
            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            console.error('Failed to reject request:', error);
            alert('Failed to reject request');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id || isSaving) return;

        setIsSaving(true);
        try {
            await updateRoom(session.user.id, formData.id, {
                name: formData.name,
                description: formData.description,
                isPublic: formData.isPublic,
                requiresApproval: formData.requiresApproval,
                maxMembers: formData.maxMembers
            });
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!session?.user?.id || isDeleting) return;
        if (deleteConfirmation !== 'DELETE') return;

        setIsDeleting(true);
        try {
            await deleteRoom(session.user.id, formData.id);
            router.push('/community');
        } catch (error) {
            console.error('Failed to delete room:', error);
            alert('Failed to delete room');
            setIsDeleting(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
                <div className="text-zinc-500">Loading settings...</div>
            </div>
        );
    }

    if (!session) {
        router.push('/auth/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--void)] text-white p-6">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.push(`/community/rooms/${params.slug}`)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Room
                </button>

                <h1 className="text-2xl font-bold mb-8">Room Settings</h1>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* General Settings */}
                    <div className="bg-[#0c0c10] border border-white/10 rounded-xl p-6 space-y-6">
                        <h2 className="text-lg font-medium flex items-center gap-2">
                            <span className="w-1 h-6 bg-[var(--accent-mint)] rounded-full"></span>
                            General
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Room Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                maxLength={100}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-[var(--accent-mint)]/50 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                maxLength={300}
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-[var(--accent-mint)]/50 focus:outline-none resize-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Privacy & Access */}
                    <div className="bg-[#0c0c10] border border-white/10 rounded-xl p-6 space-y-6">
                        <h2 className="text-lg font-medium flex items-center gap-2">
                            <Shield size={20} className="text-[var(--accent-mint)]" />
                            Privacy & Access
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                onClick={() => setFormData({ ...formData, isPublic: true })}
                                className={`p-4 rounded-xl border cursor-pointer transition-colors ${formData.isPublic
                                    ? 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Globe size={18} className={formData.isPublic ? 'text-[var(--accent-mint)]' : 'text-zinc-400'} />
                                    <span className="font-medium">Public</span>
                                </div>
                                <p className="text-xs text-zinc-500">Anyone can find and see this room.</p>
                            </div>

                            <div
                                onClick={() => setFormData({ ...formData, isPublic: false })}
                                className={`p-4 rounded-xl border cursor-pointer transition-colors ${!formData.isPublic
                                    ? 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Lock size={18} className={!formData.isPublic ? 'text-[var(--accent-mint)]' : 'text-zinc-400'} />
                                    <span className="font-medium">Private</span>
                                </div>
                                <p className="text-xs text-zinc-500">Only members can see content.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div>
                                <h3 className="text-sm font-medium">Require Approval</h3>
                                <p className="text-xs text-zinc-500 mt-1">Creator must approve new members</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.requiresApproval}
                                    onChange={e => setFormData({ ...formData, requiresApproval: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-mint)]"></div>
                            </label>
                        </div>
                    </div>

                    {/* Pending Requests */}
                    {formData.requiresApproval && requests.length > 0 && (
                        <div className="bg-[#0c0c10] border border-amber-500/20 rounded-xl p-6 space-y-4">
                            <h2 className="text-lg font-medium flex items-center gap-2 text-amber-400">
                                <Users size={20} />
                                Pending Join Requests
                            </h2>
                            <div className="divide-y divide-white/10">
                                {requests.map(req => (
                                    <div key={req.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                                {req.user.image ? (
                                                    <img src={req.user.image} alt={req.user.name || 'User'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users size={16} className="text-zinc-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-white">{req.user.name || 'Anonymous'}</p>
                                                <p className="text-xs text-zinc-500">Requested {new Date(req.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleReject(req.id)}
                                                className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleApprove(req.id)}
                                                className="px-3 py-1.5 text-xs bg-[var(--accent-mint)] text-[var(--void)] font-bold rounded-lg hover:opacity-90 transition-opacity"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-mint)] text-[var(--void)] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                {/* Danger Zone */}
                <div className="mt-12 pt-12 border-t border-white/10">
                    <h2 className="text-lg font-medium text-red-500 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        Danger Zone
                    </h2>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">Delete Room</h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Permanently delete this room and all its content. This action cannot be undone.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            Delete Room
                        </button>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#1a1a1e] border border-white/10 rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold text-white mb-2">Delete Room?</h3>
                            <p className="text-sm text-zinc-400 mb-6">
                                Are you sure you want to delete <span className="text-white font-medium">{formData.name}</span>? This allows no recovery.
                            </p>

                            <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide">
                                Type <span className="font-mono text-red-400">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={e => setDeleteConfirmation(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white mb-6 focus:border-red-500/50 focus:outline-none"
                                placeholder="DELETE"
                            />

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteConfirmation('');
                                    }}
                                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={16} />
                                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
