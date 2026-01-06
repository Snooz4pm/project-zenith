export interface ReclaimableAccount {
  pubkey: string;
  mint: string;
  refundSol: number;
  isATA: boolean;
  isDust: boolean;
}

export interface ReclaimHistoryEntry {
  timestamp: number;
  amount: number;
  txSignature: string;
}

export interface ReclaimGamification {
  totalReclaimed: number;
  reclaimCount: number;
  badges: string[];
  level: number;
}
