import { ChevronLeft, ChevronRight } from "lucide-react";

interface ZenithPaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

export function ZenithPagination({ page, totalPages, onChange }: ZenithPaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const start = Math.max(1, page - 2);
        const end = Math.min(totalPages, page + 2);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return { pages, start, end };
    };

    const { pages, start, end } = getPageNumbers();

    return (
        <div className="flex items-center justify-center gap-2 mt-8 select-none">
            {/* Prev Button */}
            <button
                disabled={page === 1}
                onClick={() => onChange(page - 1)}
                className={`p-2 rounded-lg border transition-all ${page === 1
                        ? "border-white/5 text-zinc-700 cursor-not-allowed"
                        : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/5"
                    }`}
            >
                <ChevronLeft size={16} />
            </button>

            {/* First Page + Ellipsis */}
            {start > 1 && (
                <>
                    <button
                        onClick={() => onChange(1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-xs font-medium text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all"
                    >
                        1
                    </button>
                    {start > 2 && <span className="text-zinc-600 px-1">...</span>}
                </>
            )}

            {/* Page Numbers */}
            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${p === page
                            ? "bg-blue-500 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/5"
                        }`}
                >
                    {p}
                </button>
            ))}

            {/* Last Page + Ellipsis */}
            {end < totalPages && (
                <>
                    {end < totalPages - 1 && <span className="text-zinc-600 px-1">...</span>}
                    <button
                        onClick={() => onChange(totalPages)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-xs font-medium text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all"
                    >
                        {totalPages}
                    </button>
                </>
            )}

            {/* Next Button */}
            <button
                disabled={page === totalPages}
                onClick={() => onChange(page + 1)}
                className={`p-2 rounded-lg border transition-all ${page === totalPages
                        ? "border-white/5 text-zinc-700 cursor-not-allowed"
                        : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/5"
                    }`}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
