/**
 * ReplayControls Component
 * 
 * Playback controls for REPLAY mode.
 * Play/Pause, Speed, Scrubber, Timestamp display.
 * 
 * REPLAY MODE ONLY - No live data access.
 */

'use client';

import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { ReplaySpeed, ReplayStatus } from '@/lib/market/replay-v2/types';

interface ReplayControlsProps {
    status: ReplayStatus;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSeek: (index: number) => void;
    onSpeedChange: (speed: ReplaySpeed) => void;
    className?: string;
}

export default function ReplayControls({
    status,
    onPlay,
    onPause,
    onStop,
    onSeek,
    onSpeedChange,
    className = '',
}: ReplayControlsProps) {
    const speedOptions: ReplaySpeed[] = [1, 2, 4];

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const index = parseInt(e.target.value);
        onSeek(index);
    };

    return (
        <div className={`bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 ${className}`}>
            {/* Top Row: Controls */}
            <div className="flex items-center justify-between mb-4">
                {/* Play/Pause/Stop */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={status.isPlaying ? onPause : onPlay}
                        className="
              flex items-center justify-center w-10 h-10 rounded-full
              bg-blue-500 hover:bg-blue-600 text-white
              transition-colors duration-200
            "
                        title={status.isPlaying ? 'Pause' : 'Play'}
                    >
                        {status.isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>

                    <button
                        onClick={onStop}
                        className="
              flex items-center justify-center w-8 h-8 rounded-full
              bg-zinc-700 hover:bg-zinc-600 text-zinc-300
              transition-colors duration-200
            "
                        title="Reset"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>

                {/* Speed Selector */}
                <div className="flex items-center gap-1">
                    <FastForward size={14} className="text-zinc-500 mr-1" />
                    {speedOptions.map((speed) => (
                        <button
                            key={speed}
                            onClick={() => onSpeedChange(speed)}
                            className={`
                px-2.5 py-1 rounded text-xs font-medium transition-colors
                ${status.speed === speed
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }
              `}
                        >
                            {speed}×
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="relative">
                <input
                    type="range"
                    min={0}
                    max={Math.max(0, status.total - 1)}
                    value={status.currentIndex}
                    onChange={handleSliderChange}
                    className="
            w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-lg
          "
                />

                {/* Progress bar overlay */}
                <div
                    className="absolute top-0 left-0 h-2 bg-blue-500/30 rounded-lg pointer-events-none"
                    style={{ width: `${status.progress * 100}%` }}
                />
            </div>

            {/* Bottom Row: Time Info */}
            <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-zinc-500">
                    Candle {status.currentIndex + 1} / {status.total}
                </span>
                <span className="text-zinc-400 font-medium">
                    {status.displayTime}
                </span>
                <span className={`
          px-2 py-0.5 rounded text-[10px] font-medium
          ${status.isPlaying
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-700 text-zinc-400'
                    }
        `}>
                    {status.isPlaying ? 'PLAYING' : 'PAUSED'}
                </span>
            </div>
        </div>
    );
}
