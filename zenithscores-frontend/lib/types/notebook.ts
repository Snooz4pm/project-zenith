export type JournalStatus = 'BRIEFING' | 'LIVE' | 'DEBRIEF' | 'ARCHIVED';
export type ThesisType = 'hypothesis' | 'fact' | 'intuition' | 'rule';
export type SentimentType = 'fear' | 'neutral' | 'greed' | 'confidence';
export type MissionType = 'mission' | 'deep_dive';
export type UpdateSource = 'asset_page' | 'notebook';

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

export interface MissionUpdate {
    id: string;
    journalId: string;
    price?: number;
    note: string;
    source: UpdateSource;
    createdAt: string; // ISO string
}
