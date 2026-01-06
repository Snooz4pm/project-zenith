import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { detectReclaimableAccounts, buildReclaimTransactions } from "./ReclaimUtils";
import { reclaimAdvisor } from "./ReclaimAdvisor";
import { ReclaimableAccount } from "./ReclaimTypes";
import { loadGamification, saveGamification } from "./ReclaimGamification";
import { loadHistory, saveHistory } from "./ReclaimHistory";
import Confetti from "react-confetti";

export default function ReclaimSOL() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [accounts, setAccounts] = useState<ReclaimableAccount[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [totalSol, setTotalSol] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [advisorMsg, setAdvisorMsg] = useState<string>("");

  async function scan() {
    if (!publicKey) return;
    setLoading(true);
    const accs = await detectReclaimableAccounts(connection, publicKey);
    setAccounts(accs);
    setTotalSol(accs.reduce((sum, a) => sum + a.refundSol, 0));
    setAdvisorMsg(reclaimAdvisor(accs.length, 0.000005));
    setLoading(false);
  }

  async function reclaim() {
    if (!publicKey || selected.length === 0) return;
    setLoading(true);
    const toReclaim = accounts.filter(a => selected.includes(a.pubkey));
    const txs = await buildReclaimTransactions(connection, publicKey, toReclaim);
    let totalReclaimed = 0;
    for (const tx of txs) {
      try {
        const sim = await connection.simulateTransaction(tx);
        if (sim.value.err) throw new Error("Simulation failed");
        if (!signTransaction) {
          alert("Wallet does not support direct transaction signing. Please use Phantom, Solflare, or Backpack.");
          setLoading(false);
          return;
        }
        const signed = await signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig);
        totalReclaimed += toReclaim.reduce((sum, a) => sum + a.refundSol, 0);
        saveHistory({ timestamp: Date.now(), amount: totalReclaimed, txSignature: sig });
        const gam = loadGamification();
        gam.totalReclaimed += totalReclaimed;
        gam.reclaimCount += 1;
        if (gam.totalReclaimed > 0.1 && !gam.badges.includes("SOL Hunter")) gam.badges.push("SOL Hunter");
        saveGamification(gam);
        setShowConfetti(true);
      } catch (e) {
        // Show retry option
      }
    }
    setLoading(false);
  }

  return (
    <div className="reclaim-sol-section">
      <h2>Reclaim Hidden SOL</h2>
      <button onClick={scan} disabled={!connected || loading}>Scan</button>
      <div>Total reclaimable: {totalSol.toFixed(4)} SOL</div>
      {advisorMsg && <div className="advisor">{advisorMsg}</div>}
      {accounts.length === 0 && !loading && <div>No reclaimable accounts found.</div>}
      {accounts.length > 0 && (
        <div>
          <label>
            <input type="checkbox"
              checked={selected.length === accounts.length}
              onChange={e => setSelected(e.target.checked ? accounts.map(a => a.pubkey) : [])}
            />
            Select All
          </label>
          {accounts.map(acc => (
            <div key={acc.pubkey}>
              <input type="checkbox"
                checked={selected.includes(acc.pubkey)}
                onChange={e => {
                  setSelected(e.target.checked
                    ? [...selected, acc.pubkey]
                    : selected.filter(p => p !== acc.pubkey));
                }}
              />
              {acc.pubkey.slice(0, 6)}... ({acc.refundSol.toFixed(4)} SOL) {acc.isDust && <span>Dust</span>}
            </div>
          ))}
          <button onClick={reclaim} disabled={selected.length === 0 || loading}>
            Reclaim Selected
          </button>
          <div className="warning">
            Permanent — you may lose airdrops
          </div>
        </div>
      )}
      {showConfetti && <Confetti />}
    </div>
  );
}
