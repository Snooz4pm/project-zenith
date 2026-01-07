import { Connection, PublicKey, VersionedTransaction, TransactionMessage } from "@solana/web3.js";
import { createCloseAccountInstruction } from "@solana/spl-token";
import { ReclaimableAccount } from "./ReclaimTypes";

// Cache prices for 60s
let priceCache: { [mint: string]: { price: number; ts: number } } = {};

export async function getTokenPriceUSD(mint: string): Promise<number> {
  const now = Date.now();
  if (priceCache[mint] && now - priceCache[mint].ts < 60000) {
    return priceCache[mint].price;
  }
  // Jupiter price API
  const res = await fetch(`https://price.jup.ag/v4/price?ids=${mint}`);
  const data = await res.json();
  const price = data.data?.[mint]?.price || 0;
  priceCache[mint] = { price, ts: now };
  return price;
}

export async function detectReclaimableAccounts(
  connection: Connection,
  owner: PublicKey
): Promise<ReclaimableAccount[]> {
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
  });

  const results: ReclaimableAccount[] = [];
  for (const { pubkey, account } of accounts.value) {
    const info = account.data.parsed.info;
    const mint = info.mint;
    const isATA = info.owner === owner.toBase58();
    const amount = Number(info.tokenAmount.uiAmount || 0);

    if (!isATA) continue;
    if (amount === 0) {
      const refundSol = await connection.getMinimumBalanceForRentExemption(165);
      results.push({ pubkey: pubkey.toBase58(), mint, refundSol: refundSol / 1e9, isATA, isDust: false });
    } else {
      const price = await getTokenPriceUSD(mint);
      if (amount * price < 0.01) {
        const refundSol = await connection.getMinimumBalanceForRentExemption(165);
        results.push({ pubkey: pubkey.toBase58(), mint, refundSol: refundSol / 1e9, isATA, isDust: true });
      }
    }
  }
  return results;
}
export async function buildReclaimTransactions(
  connection: Connection,
  owner: PublicKey,
  accounts: ReclaimableAccount[]
): Promise<VersionedTransaction[]> {
  const txs: VersionedTransaction[] = [];
  for (let i = 0; i < accounts.length; i += 30) {
    const batch = accounts.slice(i, i + 30);
    const instructions = batch.map(acc =>
      createCloseAccountInstruction(
        new PublicKey(acc.pubkey),
        owner, // destination
        owner // owner
      )
    );
    const blockhash = (await connection.getLatestBlockhash()).blockhash;
    const message = new TransactionMessage({
      payerKey: owner,
      recentBlockhash: blockhash,
      instructions
    }).compileToV0Message();
    txs.push(new VersionedTransaction(message));
  }
  return txs;
}
