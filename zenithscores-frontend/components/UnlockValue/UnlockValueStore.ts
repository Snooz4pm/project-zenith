import create from 'zustand';

export interface UnlockValueState {
  loading: boolean;
  error: string | null;
  recoverable: any[];
  dust: any[];
  idle: any[];
  structure: any[];
  optimization: any[];
  lastScan: number | null;
  scan: () => Promise<void>;
  refresh: () => Promise<void>;
  setError: (err: string | null) => void;
}

export const useUnlockValueStore = create<UnlockValueState>((set, get) => ({
  loading: false,
  error: null,
  recoverable: [],
  dust: [],
  idle: [],
  structure: [],
  optimization: [],
  lastScan: null,
  scan: async () => {}, // to be implemented
  refresh: async () => {}, // to be implemented
  setError: (err) => set({ error: err })
}));
