import { create } from 'zustand';

export interface UnlockValueState {
  loading: boolean;
  error: string | null;
  recoverable: any[];
  dust: any[];
  idle: any[];
  structure: any[];
  optimization: any[];
  lastScan: number | null;
  showPreview: boolean;
  batches: string[][];
  totalRecoveredSol: number;
  setLoading: (loading: boolean) => void;
  setRecoverable: (items: any[]) => void;
  setDust: (items: any[]) => void;
  setLastScan: (timestamp: number | null) => void;
  setPreview: (show: boolean) => void;
  setBatches: (batches: string[][]) => void;
  addRecovered: (amount: number) => void;
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
  showPreview: false,
  batches: [],
  totalRecoveredSol: 0,
  setLoading: (loading) => set({ loading }),
  setRecoverable: (items) => set({ recoverable: items }),
  setDust: (items) => set({ dust: items }),
  setLastScan: (timestamp) => set({ lastScan: timestamp }),
  setPreview: (show) => set({ showPreview: show }),
  setBatches: (batches) => set({ batches }),
  addRecovered: (amount) => set((state) => ({ totalRecoveredSol: state.totalRecoveredSol + amount })),
  setError: (err) => set({ error: err })
}));
