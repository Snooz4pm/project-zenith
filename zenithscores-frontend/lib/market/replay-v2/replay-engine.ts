/**
 * REPLAY ENGINE V2
 * 
 * Deterministic market playback with smooth interpolation.
 * 
 * RULES:
 * - ZERO API calls during playback
 * - Interpolate between candles for smooth animation
 * - Virtual clock (NOT real time)
 * - Speed control: 1x, 2x, 4x
 */

import { Candle, ReplaySpeed, ReplayStatus, INTERPOLATION_FPS } from './types';

type TickCallback = (
    candle: Candle,
    interpolatedPrice: number,
    index: number,
    timestamp: number
) => void;

export class ReplayEngineV2 {
    private data: Candle[] = [];
    private currentIndex: number = 0;
    private isPlaying: boolean = false;
    private speed: ReplaySpeed = 1;
    private intervalId: NodeJS.Timeout | null = null;
    private onTick: TickCallback;

    // Interpolation state
    private interpolationProgress: number = 0; // 0 to 1 within current candle
    private baseIntervalMs: number = 1000;     // 1 second per candle at 1x speed

    constructor(data: Candle[], onTick: TickCallback) {
        this.data = data;
        this.onTick = onTick;
        console.log(`[REPLAY] Engine initialized with ${data.length} candles`);
    }

    /**
     * Load new data (resets state)
     */
    public loadData(data: Candle[]) {
        this.stop();
        this.data = data;
        this.currentIndex = 0;
        this.interpolationProgress = 0;
        console.log(`[REPLAY] Loaded ${data.length} candles`);
    }

    /**
     * Start playback
     */
    public play() {
        if (this.isPlaying || this.data.length === 0) return;

        this.isPlaying = true;
        this.runInterpolationLoop();
        console.log('[REPLAY] Playback started');
    }

    /**
     * Pause playback
     */
    public pause() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('[REPLAY] Playback paused');
    }

    /**
     * Stop and reset to beginning
     */
    public stop() {
        this.pause();
        this.currentIndex = 0;
        this.interpolationProgress = 0;
        console.log('[REPLAY] Playback stopped and reset');
    }

    /**
     * Seek to specific candle index
     */
    public seek(index: number) {
        this.currentIndex = Math.max(0, Math.min(index, this.data.length - 1));
        this.interpolationProgress = 0;

        const candle = this.data[this.currentIndex];
        if (candle) {
            this.onTick(candle, candle.close, this.currentIndex, candle.time);
        }
        console.log(`[REPLAY] Seeked to candle ${this.currentIndex}/${this.data.length}`);
    }

    /**
     * Set playback speed
     */
    public setSpeed(multiplier: ReplaySpeed) {
        this.speed = multiplier;

        // Restart loop with new speed if playing
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
        console.log(`[REPLAY] Speed set to ${multiplier}x`);
    }

    /**
     * Get current status
     */
    public getStatus(): ReplayStatus {
        const current = this.data[this.currentIndex];
        const timestamp = current?.time || 0;

        return {
            isPlaying: this.isPlaying,
            currentIndex: this.currentIndex,
            total: this.data.length,
            currentTimestamp: timestamp,
            displayTime: this.formatTimestamp(timestamp),
            progress: this.data.length > 0
                ? (this.currentIndex + this.interpolationProgress) / this.data.length
                : 0,
            speed: this.speed,
        };
    }

    /**
     * Get current interpolated price
     */
    public getCurrentPrice(): number {
        if (this.data.length === 0) return 0;

        const current = this.data[this.currentIndex];
        const next = this.data[this.currentIndex + 1];

        if (!next) return current.close;

        // Linear interpolation between current close and next close
        return current.close + (next.close - current.close) * this.interpolationProgress;
    }

    /**
     * Smooth interpolation loop
     */
    private runInterpolationLoop() {
        // Calculate interval for smooth animation
        // At 1x speed: 1 candle per second, with 30fps interpolation = 33ms per frame
        const framesPerCandle = INTERPOLATION_FPS;
        const intervalMs = (this.baseIntervalMs / this.speed) / framesPerCandle;
        const progressPerFrame = 1 / framesPerCandle;

        this.intervalId = setInterval(() => {
            if (!this.isPlaying) return;

            this.interpolationProgress += progressPerFrame;

            // Move to next candle when progress >= 1
            if (this.interpolationProgress >= 1) {
                this.interpolationProgress = 0;
                this.currentIndex++;

                if (this.currentIndex >= this.data.length - 1) {
                    this.currentIndex = this.data.length - 1;
                    this.pause();
                    console.log('[REPLAY] Playback complete');
                    return;
                }
            }

            // Emit tick with interpolated price
            const current = this.data[this.currentIndex];
            const interpolatedPrice = this.getCurrentPrice();
            const virtualTimestamp = this.getVirtualTimestamp();

            this.onTick(current, interpolatedPrice, this.currentIndex, virtualTimestamp);

            // Debug log every 30 frames (once per candle at 1x)
            if (Math.floor(this.interpolationProgress * INTERPOLATION_FPS) % INTERPOLATION_FPS === 0) {
                console.log(`[REPLAY] Tick: candle ${this.currentIndex}/${this.data.length}, price: $${interpolatedPrice.toFixed(2)}`);
            }
        }, intervalMs);
    }

    /**
     * Get virtual timestamp (interpolated between candles)
     */
    private getVirtualTimestamp(): number {
        const current = this.data[this.currentIndex];
        const next = this.data[this.currentIndex + 1];

        if (!next) return current?.time || 0;

        return current.time + (next.time - current.time) * this.interpolationProgress;
    }

    /**
     * Format timestamp for display
     */
    private formatTimestamp(unixSeconds: number): string {
        if (!unixSeconds) return '--';

        const date = new Date(unixSeconds * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }
}
