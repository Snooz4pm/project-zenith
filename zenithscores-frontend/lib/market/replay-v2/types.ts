/**
 * REPLAY MODE TYPES
 * Strictly for historical Alpha Vantage data + simulation.
 * NO API calls during playback. NO Finnhub imports.
 */

export interface Candle {
    time: number;    // Unix timestamp (seconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export type ReplaySpeed = 1 | 2 | 4;

export interface ReplayState {
    candles: Candle[];
    currentIndex: number;
    replayTime: number;     // Virtual clock (Unix timestamp)
    speed: ReplaySpeed;
    isPlaying: boolean;
    interpolatedPrice: number;
    progress: number;       // 0 to 1
}

export interface ReplayControls {
    play: () => void;
    pause: () => void;
    seek: (index: number) => void;
    setSpeed: (speed: ReplaySpeed) => void;
    getStatus: () => ReplayStatus;
}

export interface ReplayStatus {
    isPlaying: boolean;
    currentIndex: number;
    total: number;
    currentTimestamp: number;
    displayTime: string;    // Formatted: "2023-10-12 14:35"
    progress: number;
    speed: ReplaySpeed;
}

// Constants
export const DEFAULT_REPLAY_SPEED: ReplaySpeed = 1;
export const INTERPOLATION_FPS = 30;  // Smooth animation at 30fps
