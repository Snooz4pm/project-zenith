'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    slug: string;
    description: string;
    marketType: 'crypto' | 'stock' | 'forex';
    isPublic: boolean;
    requiresApproval: boolean;
    maxMembers?: number;
  }) => Promise<void>;
}

export default function CreateRoomModal({ isOpen, onClose, onSubmit }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [marketType, setMarketType] = useState<'crypto' | 'stock' | 'forex'>('crypto');
  const [isPublic, setIsPublic] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [maxMembers, setMaxMembers] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    setName(value);
    // Generate slug: lowercase, replace spaces with hyphens, remove special chars
    const autoSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
    setSlug(autoSlug);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        slug,
        description,
        marketType,
        isPublic,
        requiresApproval,
        maxMembers: maxMembers ? parseInt(maxMembers) : undefined
      });
      handleClose();
    } catch (error: any) {
      if (error?.message?.includes('slug')) {
        setError('A room with this name/URL already exists. Please choose another.');
      } else {
        setError(error?.message || 'Failed to create room');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setName('');
    setSlug('');
    setDescription('');
    setMarketType('crypto');
    setIsPublic(true);
    setRequiresApproval(false);
    setMaxMembers('');
    setError('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#0c0c10] border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">Create Trading Room</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} className="text-zinc-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Bitcoin Futures Traders"
                maxLength={100}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--accent-mint)] transition-colors"
              />
              <p className="text-xs text-zinc-600 mt-1">{name.length}/100</p>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Room URL (slug)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600">/community/rooms/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="bitcoin-futures"
                  maxLength={50}
                  required
                  pattern="[a-z0-9-]+"
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--accent-mint)] transition-colors"
                />
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                Only lowercase letters, numbers, and hyphens
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this room about?"
                maxLength={300}
                required
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--accent-mint)] transition-colors resize-none"
              />
              <p className="text-xs text-zinc-600 mt-1">{description.length}/300</p>
            </div>

            {/* Market Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Market Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['crypto', 'stock', 'forex'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMarketType(type)}
                    className={`px-4 py-2.5 rounded-lg border transition-colors capitalize ${marketType === type
                      ? 'border-[var(--accent-mint)] bg-[var(--accent-mint)]/10 text-white'
                      : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Privacy & Access
              </label>

              {/* Public/Private */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <label htmlFor="isPublic" className="text-sm text-white cursor-pointer">
                    Public Room
                  </label>
                  <p className="text-xs text-zinc-600">
                    {isPublic
                      ? 'Anyone can discover this room'
                      : 'Only visible to members and those with the link'}
                  </p>
                </div>
              </div>

              {/* Approval Required */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <label htmlFor="requiresApproval" className="text-sm text-white cursor-pointer">
                    Require Approval to Join
                  </label>
                  <p className="text-xs text-zinc-600">
                    {requiresApproval
                      ? 'You review and approve join requests'
                      : !isPublic
                        ? '⚠️ Warning: Private invite-only (members cannot request)'
                        : 'Anyone can join instantly'}
                  </p>
                </div>
              </div>

              {/* Max Members */}
              <div>
                <label htmlFor="maxMembers" className="text-sm text-zinc-400 mb-2 block">
                  Max Members (optional)
                </label>
                <input
                  type="number"
                  id="maxMembers"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  placeholder="No limit"
                  min="2"
                  max="10000"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--accent-mint)] transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-[var(--accent-mint)] text-[var(--void)] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
