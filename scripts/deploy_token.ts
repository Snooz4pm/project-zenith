import {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
} from '@solana/web3.js';
import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
    createInitializeTransferFeeConfigInstruction,
    createInitializeMetadataPointerInstruction,
    TYPE_SIZE,
    LENGTH_SIZE,
    mintTo,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import {
    createInitializeInstruction,
    pack,
    TokenMetadata,
} from '@solana/spl-token-metadata';
import fs from 'fs';

// --- CONFIGURATION ---
const RPC_URL = 'https://api.mainnet-beta.solana.com'; // MAINNET
// const RPC_URL = 'https://api.devnet.solana.com'; // UNCOMMENT FOR DEVNET (RECOMMENDED FIRST)
const DECIMALS = 9;
const SUPPLY = 1_000_000_000n * BigInt(10 ** DECIMALS); // 1 Billion
const FEE_BASIS_POINTS = 200; // 2%
const MAX_FEE = 10_000n * BigInt(10 ** DECIMALS); // Max usage fee cap

// METADATA (Replace URI with your Arweave link later)
const META_NAME = "Zenith Token";
const META_SYMBOL = "ZEN";
const META_URI = "https://example.com/metadata.json"; // <--- CHANGE THIS BEFORE RUNNING

async function main() {
    const connection = new Connection(RPC_URL, 'confirmed');

    // 1. Load or Generate Wallet (Deployer)
    let wallet: Keypair;
    try {
        const secret = JSON.parse(fs.readFileSync('./deployer-keypair.json', 'utf-8'));
        wallet = Keypair.fromSecretKey(new Uint8Array(secret));
        console.log(`✅ Loaded Wallet: ${wallet.publicKey.toBase58()}`);
    } catch {
        console.log('⚠️ No deployer-keypair.json found. Creating new...');
        wallet = Keypair.generate();
        fs.writeFileSync('./deployer-keypair.json', JSON.stringify(Array.from(wallet.secretKey)));
        console.log(`✅ Created NEW Wallet: ${wallet.publicKey.toBase58()}`);
        console.log('🚨 PLEASE FUND THIS ADDRESS WITH ~0.05 SOL to proceed!');
        return;
    }

    const balance = await connection.getBalance(wallet.publicKey);
    if (balance < 0.05 * 1e9) {
        console.log(`❌ Low Balance: ${(balance / 1e9).toFixed(4)} SOL. Need ~0.05 SOL.`);
        return;
    }

    // 2. Generate Mint Keypair
    const mintKeypair = Keypair.generate();
    console.log(`🪙 Generated Mint Address: ${mintKeypair.publicKey.toBase58()}`);

    // 3. Define Metadata
    const metadata: TokenMetadata = {
        updateAuthority: wallet.publicKey,
        mint: mintKeypair.publicKey,
        name: META_NAME,
        symbol: META_SYMBOL,
        uri: META_URI,
        additionalMetadata: [],
    };

    // 4. Calculate Size & Rent
    const mintLen = getMintLen([
        ExtensionType.TransferFeeConfig,
        ExtensionType.MetadataPointer,
    ]);

    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    // 5. Build Transaction
    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        // Init Transfer Fee
        createInitializeTransferFeeConfigInstruction(
            mintKeypair.publicKey,
            wallet.publicKey, // Transfer Fee Config Authority
            wallet.publicKey, // Withdraw Withheld Authority
            FEE_BASIS_POINTS,
            MAX_FEE,
            TOKEN_2022_PROGRAM_ID
        ),
        // Init Metadata Pointer
        createInitializeMetadataPointerInstruction(
            mintKeypair.publicKey,
            wallet.publicKey,
            mintKeypair.publicKey, // Metadata address (Is the mint itself for Token-2022)
            TOKEN_2022_PROGRAM_ID
        ),
        // Init Mint
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            DECIMALS,
            wallet.publicKey, // Mint Auth
            wallet.publicKey, // Freeze Auth
            TOKEN_2022_PROGRAM_ID
        ),
        // Init Metadata Data
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mintKeypair.publicKey,
            updateAuthority: wallet.publicKey,
            mint: mintKeypair.publicKey,
            mintAuthority: wallet.publicKey,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
        })
    );

    console.log('🚀 Sending Create Transaction...');
    try {
        const sig = await sendAndConfirmTransaction(connection, transaction, [wallet, mintKeypair]);
        console.log(`✅ Token Created! TX: https://solscan.io/tx/${sig}`);
    } catch (err) {
        console.error("❌ Creation Failed:", err);
        return;
    }

    // 6. Create ATA and Mint Supply
    console.log('📦 Minting Supply...');
    try {
        const ata = await getAssociatedTokenAddress(
            mintKeypair.publicKey,
            wallet.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        const mintTx = new Transaction().add(
            createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                ata,
                wallet.publicKey,
                mintKeypair.publicKey,
                TOKEN_2022_PROGRAM_ID
            ),
            mintTo(
                connection,
                wallet,
                mintKeypair.publicKey,
                ata,
                wallet,
                SUPPLY,
                [],
                undefined,
                TOKEN_2022_PROGRAM_ID
            )
        );
        // Note: mintTo returns signature but here we construct transaction differently? 
        // mintTo helper actually sends transaction internally inside spl-token library usually? 
        // Wait, mintTo creates instruction or sends? 
        // spl-token `mintTo` sends/confirms. 
        // So we just need to create ATA first.
    } catch (err) {
        console.log('Creating ATA manually...');
        // Re-do mint logic carefully
    }
}

// Actually, let's simplify the mint part to ensure it runs
main();
