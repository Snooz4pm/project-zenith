/**
 * Zenith Replay Engine (V1)
 * Deterministic market playback for testing and verification.
 * 
 * LOGIC:
 * - Loads full history array.
 * - Emits one candle at a time (V1).
 * - Control speed via timer interval.
 */

import { OHLCV } from '@/lib/market-data/types';

type TickCallback = (candle: OHLCV, index: number) => void;

export class ReplayEngine {
    private data: OHLCV[] = [];
    private currentIndex: number = 0;
    private isPlaying: boolean = false;
    private speed: number = 1; // 1 = 1 candle per second (default base)
    private intervalId: NodeJS.Timeout | null = null;
    private onTick: TickCallback;

    constructor(data: OHLCV[], onTick: TickCallback) {
        this.data = data;
        this.onTick = onTick;
    }

    public start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.runLoop();
    }

    public pause() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    public stop() {
        this.pause();
        this.currentIndex = 0;
        // Emit reset state if needed
    }

    public seek(index: number) {
        this.currentIndex = Math.max(0, Math.min(index, this.data.length - 1));
        // Emit current state immediately
        this.onTick(this.data[this.currentIndex], this.currentIndex);
    }

    public setSpeed(multiplier: number) {
        this.speed = multiplier;
        if (this.isPlaying) {
            this.pause();
            this.start();
        }
    }

    public next() {
        if (this.currentIndex >= this.data.length - 1) {
            this.pause();
            return;
        }
        this.currentIndex++;
        this.onTick(this.data[this.currentIndex], this.currentIndex);
    }

    private runLoop() {
        // Base speed 1x = 1000ms per candle
        // Speed 10x = 100ms per candle
        const baseInterval = 1000;
        const interval = baseInterval / this.speed;

        this.intervalId = setInterval(() => {
            if (!this.isPlaying) return;
            this.next();
        }, interval);
    }

    public getStatus() {
        return {
            isPlaying: this.isPlaying,
            currentIndex: this.currentIndex,
            total: this.data.length,
            currentTimestamp: this.data[this.currentIndex]?.time,
            progress: this.currentIndex / this.data.length
        };
    }
}
