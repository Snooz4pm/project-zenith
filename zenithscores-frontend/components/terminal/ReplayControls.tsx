/**
 * Zenith Replay Controls
 * UI for controlling the ReplayEngine.
 */

'use client';

import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

interface ReplayControlsProps {
    isPlaying: boolean;
    progress: number; // 0 to 1
    speed: number;
    currentTime: number;
    onPlayPause: () => void;
    onReset: () => void;
    onSpeedChange: (speed: number) => void;
    onSeek: (percent: number) => void;
}

export default function ReplayControls({
    isPlaying,
    progress,
    speed,
    currentTime,
    onPlayPause,
    onReset,
    onSpeedChange,
    onSeek
}: ReplayControlsProps) {
    return (
        <div className="flex items-center gap-4 bg-amber-950/30 border border-amber-900/50 rounded-lg p-2 backdrop-blur-md">
            {/* Play/Pause */}
            <button
                onClick={onPlayPause}
                className="w-8 h-8 flex items-center justify-center rounded bg-amber-500 text-black hover:bg-amber-400 transition-colors"
            >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>

            {/* Reset */}
            <button
                onClick={onReset}
                className="text-amber-500 hover:text-amber-400 transition-colors"
            >
                <RotateCcw size={16} />
            </button>

            {/* Scrubber */}
            <div className="flex-1 flex flex-col gap-1 w-48">
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress * 100}
                    onChange={(e) => onSeek(parseFloat(e.target.value) / 100)}
                    className="w-full h-1.5 bg-amber-900/50 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-[10px] font-mono text-amber-500/80 text-center">
                    {new Date(currentTime).toLocaleString()}
                </span>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-1 bg-amber-900/40 rounded p-0.5">
                {[1, 5, 10, 50].map(s => (
                    <button
                        key={s}
                        onClick={() => onSpeedChange(s)}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded ${speed === s
                                ? 'bg-amber-500 text-black font-bold'
                                : 'text-amber-500/60 hover:text-amber-400'
                            }`}
                    >
                        {s}x
                    </button>
                ))}
            </div>
        </div>
    );
}
