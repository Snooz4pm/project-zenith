export type JournalStatus = 'BRIEFING' | 'LIVE' | 'DEBRIEF' | 'ARCHIVED';
export type ThesisType = 'hypothesis' | 'fact' | 'intuition' | 'rule';
export type SentimentType = 'fear' | 'neutral' | 'greed' | 'confidence';

export interface ThesisItem {
    id: string;
    type: ThesisType;
    content: string;
    conviction: number; // 0-100
}

export interface LogEntry {
    id: string;
    timestamp: string; // ISO string
    content: string;
    sentiment: SentimentType;
}

export interface MarketContext {
    vix?: number;
    regime?: string;
    session?: string;
    priceAtCreation?: number;
}
