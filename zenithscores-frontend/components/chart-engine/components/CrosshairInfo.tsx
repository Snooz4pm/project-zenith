'use client';

interface CrosshairInfoProps {
    position: { x: number; y: number; price: number; time: Date | null };
    containerRef: React.RefObject<HTMLDivElement>;
}

export default function CrosshairInfo({ position, containerRef }: CrosshairInfoProps) {
    const formatPrice = (price: number) => {
        return price.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatTime = (date: Date | null) => {
        if (!date) return '--';
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            ref={containerRef}
            className="absolute z-30 pointer-events-none"
            style={{
                left: position.x + 10,
                top: position.y + 10
            }}
        >
            <div className="bg-black/90 backdrop-blur border border-white/10 rounded-lg px-3 py-2 shadow-lg">
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-white/50">Price:</span>
                        <span className="text-white font-semibold">{formatPrice(position.price)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-white/50">Time:</span>
                        <span className="text-white font-medium">{formatTime(position.time)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
