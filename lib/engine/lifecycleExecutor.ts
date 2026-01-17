import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { derivePositionState, assertValidAmount, resolveExitMints, SOL_MINT, ActionType, PositionState, USDC_MINT, EXIT_TARGETS } from "./lifecycleState";

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

export async function getRealTokenBalance({
    connection,
    walletPubkey,
    mint,
}: {
    connection: Connection;
    walletPubkey: PublicKey;
    mint: string;
}) {
    if (mint === SOL_MINT) {
        const balance = await connection.getBalance(walletPubkey);
        return {
            rawAmount: BigInt(balance),
            decimals: 9,
            uiAmount: balance / 1e9
        };
    }

    const ata = await getAssociatedTokenAddress(new PublicKey(mint), walletPubkey);
    try {
        const balance = await connection.getTokenAccountBalance(ata);
        return {
            rawAmount: BigInt(balance.value.amount),
            decimals: balance.value.decimals,
            uiAmount: balance.value.uiAmount ?? 0,
        };
    } catch (e) {
        console.warn(`[getRealTokenBalance] No ATA found for ${mint}. Assuming zero balance.`, e);
        return {
            rawAmount: BigInt(0),
            decimals: 6,
            uiAmount: 0
        };
    }
}

export async function findExitRoute(
    inputMint: string,
    amountRaw: string,
    addLog: (msg: string) => void
) {
    for (const target of EXIT_TARGETS) {
        try {
            if (inputMint === target.mint) continue; // Skip identical

            addLog(`🔍 Kernel Route Search: Trying exit → ${target.symbol}`);

            const JUPITER_PROXY_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_JUPITER_PROXY_URL) || 'https://jupiter-proxy-production.up.railway.app';
            const url = `${JUPITER_PROXY_URL}/quote?inputMint=${inputMint}&outputMint=${target.mint}&amount=${amountRaw}&slippageBps=50`;

            const res = await fetch(url);
            if (!res.ok) continue;

            const quote = await res.json();
            if (quote?.routePlan?.length) {
                addLog(`✅ Exit route secured → ${target.symbol}`);
                return { quote, target };
            }
        } catch (e) {
            // Silently continue to next target
        }
    }
    throw new Error("No available exit routes (SOL/USDC/USDT all failed)");
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

                // 🎯 Spec-Compliant [FAST EXIT]: Always use on-chain truth
                addLog(`🔍 Kernel Fetch: Reading real on-chain balance for ${params.targetSymbol || inputMint}`);
                const balance = await getRealTokenBalance({
                    connection,
                    walletPubkey: publicKey,
                    mint: inputMint
                });

                const hWalletRaw = balance.rawAmount;
                addLog(`🧮 ${type} On-Chain Audit: Balance=${hWalletRaw.toString()} | uiAmount=${balance.uiAmount}`);

                if (hWalletRaw <= BigInt(0)) {
                    throw new Error(`No wallet balance detected for ${params.targetSymbol || inputMint}. Position may already be closed.`);
                }

                if (type === "HARVEST") {
                    // 🎯 40% partial exit based on on-chain truth
                    const exitNum = hWalletRaw * BigInt(40) / 100n;
                    amountRaw = exitNum.toString();
                } else {
                    // 🎯 100% full exit based on on-chain truth
                    amountRaw = hWalletRaw.toString();
                }

                // Production Routing: Try SOL -> USDC -> wSOL -> USDT
                addLog(`🚀 Production Exit Routing engaged...`);
                const exitRes = await findExitRoute(inputMint, amountRaw, addLog);
                outputMint = exitRes.target.mint;
                quote = exitRes.quote;

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
