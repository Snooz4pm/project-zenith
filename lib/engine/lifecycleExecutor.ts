import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { derivePositionState, assertValidAmount, resolveExitMints, SOL_MINT, ActionType, PositionState, USDC_MINT } from "./lifecycleState";

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
    isSnap?: boolean; // Fast Exit SNAP mode
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

function assertDifferentMints(inputMint: string, outputMint: string) {
    if (inputMint === outputMint) {
        throw new Error(`Invalid swap: inputMint and outputMint are identical (${inputMint})`);
    }
}


export async function executeLifecycleAction(
    type: ActionType,
    params: ActionParams,
    ctx: ActionContext
) {
    const { addLog, publicKey, connection, sendTransaction } = ctx;

    try {
        let inputMint: string = SOL_MINT;
        let outputMint: string = SOL_MINT;
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
            case "RECYCLE": {
                // FORCE NORMALIZED EXIT
                const resolved = resolveExitMints(params.targetMint);
                inputMint = resolved.inputMint;
                outputMint = resolved.outputMint;

                // Rule: Pull from real wallet balance (holdings)
                const hHolding = ctx.holdings.find(h => h.mint === inputMint);
                const hWalletRaw = hHolding?.rawAmount ? BigInt(hHolding.rawAmount) : BigInt(0);

                addLog(`🧮 ${type} Balance Check: Wallet=${hWalletRaw.toString()} | Shadow=${params.position?.amount}`);

                if (hWalletRaw <= BigInt(0)) throw new Error(`No wallet balance for ${params.targetSymbol || inputMint}`);

                if (type === "HARVEST") {
                    // 🎯 Spec-Compliant [FAST EXIT]: 40% partial exit
                    amountRaw = (hWalletRaw * BigInt(40) / 100n).toString();
                } else {
                    // 🎯 Spec-Compliant [FAST EXIT]: 100% full exit
                    amountRaw = hWalletRaw.toString();
                }

                if (params.isSnap) {
                    addLog(`🔥 SNAP MODE ACTIVE: Forcing fallback to USDC/wSOL`);
                    // If output is already SOL, we go to USDC. If GEM, we go to SOL or USDC.
                    // resolveExitMints already handles basic GEM -> SOL.
                    // If SNAP is on, we prefer USDC for safety.
                    outputMint = (inputMint === SOL_MINT) ? USDC_MINT : (resolved.outputMint || SOL_MINT);
                }

                assertValidAmount(amountRaw);
                break;
            }

            default:
                throw new Error(`Unknown action type: ${type}`);
        }

        // 2. Convert USD to Raw Amount if needed
        let quote = params.overrideQuote;

        if (!quote) {
            if (amountUsd && !amountRaw) {
                const price = ctx.prices[inputMint];
                if (!price) throw new Error(`Price unknown for base: ${inputMint}`);
                const decimals = inputMint === SOL_MINT ? 9 : (ctx.holdings.find(h => h.mint === inputMint)?.decimals || 6);

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

            // 🎯 GIDDY-UP SAFETY
            assertDifferentMints(inputMint, outputMint);

            addLog(`🚀 Kernel Quote Request: ${inputMint.slice(0, 4)} -> ${outputMint.slice(0, 4)} | Amt: ${amountRaw}`);

            // 3. Fetch Quote
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
