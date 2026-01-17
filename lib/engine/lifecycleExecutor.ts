import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { derivePositionState, assertValidAmount, ActionType, PositionState } from "./lifecycleState";

export { type ActionType };

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
    state?: PositionState; // Canonical State Gate
}

function assertCanExecute(type: ActionType, state: PositionState) {
    if (type === "SEED" && !state.canSeed) {
        throw new Error("SEED blocked: Existing position active");
    }
    if (type === "SCALE" && !state.canScale) {
        throw new Error("SCALE blocked: No profit available for scaling");
    }
    if (type === "HARVEST" && !state.canHarvest) {
        throw new Error("HARVEST blocked: Realized profit too low");
    }
    if (type === "RECYCLE" && !state.canExit) {
        throw new Error("RECYCLE blocked: No active position to exit");
    }
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

        // 0. Canonical Assertion Gate
        const hToken = ctx.holdings.find(h => h.mint === params.targetMint);
        const state = params.state || derivePositionState(
            params.targetMint,
            params.targetSymbol || "UNK",
            hToken?.rawAmount || "0",
            params.position
        );

        addLog(`🛡️ Kernel Assertion: Validating ${type} against state...`);
        assertCanExecute(type, state);

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
                inputMint = params.targetMint;
                outputMint = params.position?.baseMint || SOL_MINT;

                // Rule: Pull from real wallet balance (holdings)
                const hHolding = ctx.holdings.find(h => h.mint === inputMint);
                const hWalletRaw = hHolding?.rawAmount ? BigInt(hHolding.rawAmount) : BigInt(0);

                addLog(`🧮 Harvest Balance Check: Wallet=${hWalletRaw.toString()} | Shadow=${params.position?.amount}`);

                if (hWalletRaw <= BigInt(0)) throw new Error(`No wallet balance for ${params.targetSymbol || inputMint}`);

                // 40% partial exit
                amountRaw = (hWalletRaw * BigInt(40) / BigInt(100)).toString();
                assertValidAmount(amountRaw);
                break;

            case "RECYCLE":
                inputMint = params.targetMint;
                outputMint = SOL_MINT;

                // Rule: Pull from real wallet balance (holdings)
                const rHolding = ctx.holdings.find(h => h.mint === inputMint);
                const rWalletRaw = rHolding?.rawAmount ? BigInt(rHolding.rawAmount) : BigInt(0);

                addLog(`🧮 Recycle Balance Check: Wallet=${rWalletRaw.toString()} | Shadow=${params.position?.amount}`);

                if (rWalletRaw <= BigInt(0)) throw new Error(`No wallet balance for ${params.targetSymbol || inputMint}`);

                // 100% exit
                amountRaw = rWalletRaw.toString();
                assertValidAmount(amountRaw);
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

                // Safe calculation
                const rawVal = (amountUsd / price) * Math.pow(10, decimals);

                addLog(`🧮 Kernel Calculation: USD=${amountUsd.toFixed(2)} | Price=${price.toFixed(4)} | Dec=${decimals} | Raw=${rawVal.toFixed(0)}`);

                if (!Number.isFinite(rawVal) || rawVal <= 0) {
                    addLog(`⛔ Aborted: Calculated amount is zero or invalid (${rawVal.toFixed(0)})`);
                    throw new Error("Invalid seed amount - Portfolio or Price issue");
                }

                amountRaw = Math.floor(rawVal).toString();
                assertValidAmount(amountRaw);
            }

            if (!amountRaw || amountRaw === "0") {
                throw new Error(`Calculated amount is zero or invalid. Raw: ${amountRaw}`);
            }

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
        const JUPITER_PROXY_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_JUPITER_PROXY_URL) || 'https://jupiter-proxy-production.up.railway.app';

        const swapPayload = {
            quoteResponse: quote,
            userPublicKey: publicKey.toBase58()
        };

        console.log("🚀 SENDING SWAP REQUEST", {
            url: `${JUPITER_PROXY_URL}/swap`,
            payload: swapPayload
        });

        const swapRes = await fetch(`${JUPITER_PROXY_URL}/swap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(swapPayload)
        });
        const swapData = await swapRes.json();
        if (swapData.error) throw new Error(swapData.error);
        if (!swapData.swapTransaction) throw new Error("Missing swapTransaction");

        // 5. Sign and Send
        addLog(`✍️ Preparing transaction...`);
        const transaction = VersionedTransaction.deserialize(Buffer.from(swapData.swapTransaction, "base64"));

        addLog(`✍️ Sending to wallet...`);
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
