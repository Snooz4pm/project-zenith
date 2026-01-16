import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";

export type ActionType = "SEED" | "SCALE" | "HARVEST" | "RECYCLE";

export interface ActionContext {
    publicKey: PublicKey;
    connection: Connection;
    portfolioUsd: number;
    prices: Record<string, number>;
    holdings: any[];
    addLog: (msg: string) => void;
    sendTransaction: (tx: VersionedTransaction, connection: Connection) => Promise<string>;
}

export interface ActionParams {
    targetMint: string;
    targetSymbol?: string;
    position?: any;
    baseMint?: string;
    overrideAmountUsd?: number;
    overrideQuote?: any;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export async function executeLifecycleAction(
    type: ActionType,
    params: ActionParams,
    ctx: ActionContext
) {
    const { addLog, publicKey, connection, sendTransaction } = ctx;

    try {
        let inputMint: string;
        let outputMint: string;
        let amountUsd: number | null = null;
        let amountRaw: string | null = null;

        addLog(`Kernel: Executor engaged [${type}] for ${params.targetSymbol || params.targetMint.slice(0, 6)}`);

        // 1. Determine Parameters based on ActionType
        switch (type) {
            case "SEED":
                inputMint = params.baseMint || SOL_MINT;
                outputMint = params.targetMint;
                amountUsd = params.overrideAmountUsd || (ctx.portfolioUsd * 0.02);
                break;

            case "SCALE":
                if (!params.position) throw new Error("No active position for SCALE");
                // Rule: Only if profitable
                if (params.position.pnlPct <= 0) {
                    addLog(`⚠ Scale Aborted: Position PnL is ${params.position.pnlPct.toFixed(2)}% (Profit required)`);
                    throw new Error("Profit required for SCALE");
                }
                inputMint = params.position.baseMint || SOL_MINT;
                outputMint = params.targetMint;
                amountUsd = ctx.portfolioUsd * 0.06; // Rule: 6% for Scale
                break;

            case "HARVEST":
                if (!params.position) throw new Error("No active position for HARVEST");
                inputMint = params.targetMint;
                outputMint = params.position.baseMint || SOL_MINT;
                // Rule: 40% partial exit
                const harvestAmount = params.position.amount * 0.4;
                const hDecimals = params.position.decimals || 6;
                amountRaw = Math.floor(harvestAmount * Math.pow(10, hDecimals)).toString();
                break;

            case "RECYCLE":
                if (!params.position) throw new Error("No active position for RECYCLE");
                inputMint = params.targetMint;
                outputMint = SOL_MINT; // Rule: Exit to SOL
                // Rule: 100% exit
                const recycleAmount = params.position.amount;
                const rDecimals = params.position.decimals || 6;
                amountRaw = Math.floor(recycleAmount * Math.pow(10, rDecimals)).toString();
                break;

            default:
                throw new Error(`Unknown action type: ${type}`);
        }

        // 2. Convert USD to Raw Amount if needed (skip if we already have amountRaw or a hot quote)
        let quote = params.overrideQuote;

        if (!quote) {
            if (amountUsd && !amountRaw) {
                const price = ctx.prices[inputMint];
                if (!price) throw new Error(`Price unknown for base: ${inputMint}`);
                const decimals = inputMint === SOL_MINT ? 9 : (ctx.holdings.find(h => h.mint === inputMint)?.decimals || 6);
                amountRaw = Math.floor((amountUsd / price) * Math.pow(10, decimals)).toString();
            }

            if (!amountRaw || amountRaw === "0") throw new Error("Calculated amount is zero or invalid");

            // 3. Fetch Quote
            addLog(`Jupiter: Fetching ${type} route...`);
            const quoteRes = await fetch("/api/jupiter/quote", {
                method: "POST",
                body: JSON.stringify({ inputMint, outputMint, amount: amountRaw })
            });
            quote = await quoteRes.json();
        }

        if (!quote?.routePlan?.length) throw new Error(quote?.error || "No route available via Jupiter");

        addLog(`Jupiter: Quote Hot. Impact: ${quote.priceImpactPct}%`);

        // 4. Create Swap Transaction
        addLog(`🚀 Building swap tx...`);
        const swapRes = await fetch("/api/jupiter/swap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quote: quote, // Match Railway key naming
                userPublicKey: publicKey.toBase58()
            })
        });
        const swapData = await swapRes.json();
        if (swapData.error) throw new Error(swapData.error);
        if (!swapData.swapTransaction) throw new Error("Missing swapTransaction");

        // 5. Sign and Send
        addLog(`✍️ Preparing transaction...`);
        const txData = Uint8Array.from(atob(swapData.swapTransaction), c => c.charCodeAt(0));
        const transaction = VersionedTransaction.deserialize(txData);

        addLog(`✍️ Sending transaction to wallet...`);
        const signature = await sendTransaction(transaction, connection);
        addLog(`Executor: Sent. Hash: ${signature.slice(0, 8)}`);

        await connection.confirmTransaction(signature, 'confirmed');
        addLog(`✅ Action Success [${type}]`);

        // 6. Persist to Position Store
        const persistenceData: any = {
            targetMint: params.targetMint,
            type,
            signature
        };

        if (type === "SEED" || type === "SCALE") {
            persistenceData.investedUsd = amountUsd;
            persistenceData.baseMint = inputMint;
            persistenceData.amount = parseFloat(quote.outAmount);
        }

        await fetch("/api/engine/positions", {
            method: "POST",
            body: JSON.stringify(persistenceData)
        });

        return signature;

    } catch (err: any) {
        addLog(`Executor Failure: ${err.message}`);
        throw err;
    }
}
