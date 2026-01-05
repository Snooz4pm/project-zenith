import { Search } from 'lucide-react';

interface FiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
}

export function Filters({ search, onSearchChange }: FiltersProps) {
    return (
        <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search tokens..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-[#111116] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-white/10"
                />
            </div>
        </div>
    );
}
