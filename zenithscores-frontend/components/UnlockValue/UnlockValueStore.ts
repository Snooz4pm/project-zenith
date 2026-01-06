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
  setError: (err: string | null) => void;
}

export const useUnlockValueStore = create<UnlockValueState>((set) => ({
  loading: false,
  error: null,
  recoverable: [],
  dust: [],
  idle: [],
  structure: [],
  optimization: [],
  lastScan: null,
  setError: (err) => set({ error: err })
}));
