'use client';

import { useState, useEffect } from 'react';

interface CommunityAction {
    id: string;
    username: string;
    avatar: string;
    action: string;
}

export default function CommunityFeedTile() {
    const [actions, setActions] = useState<CommunityAction[]>([]);

    useEffect(() => {
        // Fetch real user actions from DB
        // For now: sample data (NO suggestions, NO fake users)
        const sampleActions: CommunityAction[] = [
            { id: '1', username: 'alex_trader', avatar: 'A', action: 'Bullish on ETH' },
            { id: '2', username: 'sarah_m', avatar: 'S', action: 'Commented on L2s' },
            { id: '3', username: 'mike_crypto', avatar: 'M', action: 'Posted analysis' },
            { id: '4', username: 'jen_defi', avatar: 'J', action: 'Shared signal' },
        ];
        setActions(sampleActions);
    }, []);

    return (
        <div className="h-full bg-black border border-white/[0.06] rounded-lg p-5 flex flex-col hover:border-emerald-500/20 transition-colors">
            <div className="mb-4">
                <h3 className="text-sm font-medium text-white mb-1">Community</h3>
                <p className="text-xs text-zinc-500">Recent activity</p>
            </div>

            {/* Minimal list - real users only */}
            <div className="flex-1 overflow-auto space-y-3">
                {actions.length === 0 ? (
                    <p className="text-xs text-zinc-600">No recent activity</p>
                ) : (
                    actions.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400 shrink-0">
                                {item.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate">{item.username}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">{item.action}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
