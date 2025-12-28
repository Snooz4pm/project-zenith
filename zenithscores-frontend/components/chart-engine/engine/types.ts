/**
 * Zenith Chart Engine - Pure Type Definitions
 * The Constitution: NO React, NO AI, NO Side Effects.
 */

import { AssetType, OHLCV } from '@/lib/market-data/types';

// --- 1. CONFIGURATION ---

export type ChartType = 'candle' | 'line' | 'area' | 'heikin-ashi' | 'renko' | 'point-figure' | 'hollow-candle';
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M' | '3M' | '1y' | 'custom';
export type DrawingTool = 'trendline' | 'horizontal' | 'vertical' | 'ray' | 'channel' | 'fibonacci' | 'rectangle' | 'ellipse' | 'triangle' | 'text' | 'arrow' | 'measure' | null;

export interface Indicator {
    type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger' | 'volume' | 'vwap' | 'atr' | 'stochastic' | 'adx';
    period?: number;
    color: string;
    visible?: boolean;
}

export interface LayoutPreset {
    id: string;
    name: string;
    description: string;
}

export interface EngineConfig {
    width: number;
    height: number;
    dpi: number;
    colors: {
        background: string;
        grid: string;
        text: string;
        candleUp: string;
        candleDown: string;
        wickUp: string;
        wickDown: string;
        crosshair: string;
        priceLine: string;
        volumeUp: string;
        volumeDown: string;
    };
    fonts: {
        axis: string;
        crosshair: string;
        tooltip?: string;
    };
    padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    mode?: 'expert' | 'overview';
    chartType?: ChartType;
    showGrid?: boolean;
    showVolume?: boolean;
    indicators?: Indicator[];
    drawings?: Drawing[];
    crosshair?: { x: number; y: number; price: number; time: Date | null } | null;
}

export const DEFAULT_THEME: EngineConfig['colors'] = {
    background: '#0a0a12',
    grid: '#1a1a24',
    text: '#6b7280',
    candleUp: '#10b981',
    candleDown: '#ef4444',
    wickUp: '#10b981',
    wickDown: '#ef4444',
    crosshair: '#374151',
    priceLine: '#374151',
    volumeUp: '#10b981',
    volumeDown: '#ef4444',
};

export const DARK_THEME: EngineConfig['colors'] = {
    background: '#0a0a12',
    grid: '#1a1a24',
    text: '#6b7280',
    candleUp: '#10b981',
    candleDown: '#ef4444',
    wickUp: '#10b981',
    wickDown: '#ef4444',
    crosshair: '#374151',
    priceLine: '#374151',
    volumeUp: '#10b981',
    volumeDown: '#ef4444',
};

export const LIGHT_THEME: EngineConfig['colors'] = {
    background: '#ffffff',
    grid: '#e5e7eb',
    text: '#4b5563',
    candleUp: '#10b981',
    candleDown: '#ef4444',
    wickUp: '#10b981',
    wickDown: '#ef4444',
    crosshair: '#9ca3af',
    priceLine: '#9ca3af',
    volumeUp: '#10b981',
    volumeDown: '#ef4444',
};

// --- 2. VIEWPORT (Pure Math) ---

export interface Viewport {
    /** Index of the first visible candle (can be fractional for smooth scroll) */
    offset: number;
    /** Zoom level (candles per pixel or pixels per candle, typically scale factor) */
    scale: number;
    /** Total width of a candle in pixels (body + gap) derived from scale */
    candleWidth: number;
}

export interface ChartDimensions {
    width: number;
    height: number;
    chartWidth: number;
    chartHeight: number;
}

// --- 3. DATA STRUCTURES ---

// Renaming generic OHLCV to engine-specific MarketCandle to avoid confusion, 
// though they are structurally identical for now.
export interface MarketCandle extends OHLCV {
    // Add any engine-specific cached props here if needed later (e.g. midPrice)
}

export type RegimeType = 'trend' | 'range' | 'breakout' | 'breakdown' | 'chaos';

export interface DerivedIndicators {
    ema20?: number[];
    ema50?: number[];
    vwap?: number[];
    volumeProfile?: Map<number, number>; // Price -> Volume
    regime?: RegimeType;
}

export interface MarketState {
    candles: MarketCandle[];
    indicators: DerivedIndicators;
    minPrice: number;
    maxPrice: number;
    maxVolume: number;
}

// --- 4. DRAWINGS & OVERLAYS ---

export type DrawingType = 'trendline' | 'zone' | 'fib' | 'horizontal_ray';

export interface Point {
    x: number; // Index-based (time)
    y: number; // Price-based
}

export interface Drawing {
    id: string;
    type: DrawingType;
    points: Point[];
    visible: boolean;
    locked: boolean;
    color?: string;
    label?: string;
    meta?: Record<string, unknown>; // For AI or user metadata
}

// --- 5. INTERACTIONS ---

export interface MousePosition {
    x: number;
    y: number;
}

export type InteractionState =
    | { type: 'idle' }
    | { type: 'panning'; startX: number; startOffset: number }
    | { type: 'scrolling' } // Momentum scroll
    | { type: 'drawing'; drawingId: string; startPoint: Point };
