'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, User, Camera, Save, Trash2, AlertTriangle,
    Shield, Mail, Calendar, X, Check
} from 'lucide-react';

export default function AccountSettingsPage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [displayName, setDisplayName] = useState(session?.user?.name || '');
    const [image, setImage] = useState(session?.user?.image || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const handleSaveName = async () => {
        // if (!displayName.trim() || (displayName === session?.user?.name && image === session?.user?.image)) return;

        setSaving(true);
        try {
            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: displayName.trim(),
                    image: image.trim()
                })
            });

            if (res.ok) {
                await update({ name: displayName.trim(), image: image.trim() });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (e) {
            console.error('Failed to update profile:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE MY ACCOUNT') return;

        try {
            const res = await fetch('/api/user/delete', {
                method: 'DELETE'
            });

            if (res.ok) {
                await signOut({ callbackUrl: '/' });
            }
        } catch (e) {
            console.error('Failed to delete account:', e);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
                <div className="text-zinc-500">Loading...</div>
            </div>
        );
    }

    const memberSince = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[var(--void)] text-white">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/profile"
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-zinc-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Account Settings</h1>
                        <p className="text-sm text-zinc-500">Manage your account preferences</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0c0c10] border border-white/10 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <User size={20} className="text-[var(--accent-mint)]" />
                            Profile Information
                        </h2>

                        {/* Avatar */}
                        <div className="flex items-center gap-6 mb-6">
                            <div className="relative">
                                {image ? (
                                    <img
                                        src={image}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full border-2 border-[var(--accent-mint)]/30 object-cover"
                                        onError={() => setImage(session.user?.image || '')}
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-mint)]/30 to-cyan-500/30 flex items-center justify-center text-2xl font-bold">
                                        {session.user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                {/* <button className="absolute bottom-0 right-0 p-1.5 bg-[var(--accent-mint)] rounded-full text-black hover:bg-[var(--accent-mint)]/80 transition-colors">
                                    <Camera size={12} />
                                </button> */}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-zinc-400 mb-2">Avatar URL</label>
                                <input
                                    type="text"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/30 text-sm"
                                    placeholder="https://example.com/avatar.jpg"
                                />
                                <p className="text-xs text-zinc-600 mt-1">Enter a direct image link to update your avatar.</p>
                            </div>
                        </div>

                        {/* Display Name */}
                        <div className="mb-4">
                            <label className="block text-sm text-zinc-400 mb-2">Display Name</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/30"
                                    placeholder="Enter your name"
                                />
                                <button
                                    onClick={handleSaveName}
                                    disabled={saving}
                                    className="px-4 py-2.5 bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 text-[var(--accent-mint)] rounded-lg hover:bg-[var(--accent-mint)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : saved ? (
                                        <Check size={16} />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {saved ? 'Saved!' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Email Address</label>
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-400">
                                <Mail size={16} />
                                <span>{session.user?.email}</span>
                                <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">VERIFIED</span>
                            </div>
                            <p className="text-xs text-zinc-600 mt-1">Email is managed by Google</p>
                        </div>
                    </motion.div>

                    {/* Account Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#0c0c10] border border-white/10 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-[var(--accent-mint)]" />
                            Account Details
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} className="text-zinc-500" />
                                    <span className="text-zinc-400">Member Since</span>
                                </div>
                                <span className="text-white">{memberSince}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <Shield size={16} className="text-zinc-500" />
                                    <span className="text-zinc-400">Auth Provider</span>
                                </div>
                                <span className="text-white flex items-center gap-2">
                                    <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <span className="text-[10px]">G</span>
                                    </span>
                                    Google
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <User size={16} className="text-zinc-500" />
                                    <span className="text-zinc-400">Account Status</span>
                                </div>
                                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-sm">Active</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Danger Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#0c0c10] border border-red-500/20 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
                            <AlertTriangle size={20} />
                            Danger Zone
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">Delete Account</p>
                                    <p className="text-sm text-zinc-500">Permanently delete your account and all data</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                                >
                                    <Trash2 size={16} className="inline mr-2" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0c0c10] border border-red-500/20 rounded-2xl p-6 max-w-md w-full"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <AlertTriangle size={24} className="text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-red-400">Delete Account</h3>
                            </div>

                            <p className="text-zinc-400 mb-4">
                                This action cannot be undone. All your data, trading history, notes, and progress will be permanently deleted.
                            </p>

                            <p className="text-sm text-zinc-500 mb-2">
                                Type <span className="text-red-400 font-mono">DELETE MY ACCOUNT</span> to confirm:
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white/5 border border-red-500/20 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 mb-4"
                                placeholder="Type here..."
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText('');
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Delete Forever
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
