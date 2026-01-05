import { ReactNode } from 'react';

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`bg-[#111116] border border-white/5 rounded-xl p-4 ${className}`}>
            {children}
        </div>
    );
}
