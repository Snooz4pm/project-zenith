"use client";
export const dynamic = "force-dynamic";
import { EmptyState } from '@/components/ui/EmptyState';

export default function SettingsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
            <EmptyState text="Preferences" subtext="App configuration coming soon." />
        </div>
    );
}
