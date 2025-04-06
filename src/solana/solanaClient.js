import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
    SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
// Import Buffer from buffer shim for React Native
import { Buffer } from 'buffer';
// Import the IDL
import idl from '../idl/cryptoria_idl.json';

// Constants
const GAME_ACCOUNT_SIZE = 1500; // Reduced from 10240 to match actual program requirements
const SOLANA_NETWORK = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey(idl.address);

// Create a connection instance
const getConnection = () => new Connection(SOLANA_NETWORK, 'confirmed');

/**
 * Create a new game with the specified parameters - using a simplified approach
 */
export async function createGame(wallet, maxPlayers, betAmount) {
    console.log("Starting game creation process");
    
    if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet is required to create a game.");
    }
    
    try {
        const connection = getConnection();
        
        // Check wallet balance first
        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`Current wallet balance: ${balance / 1e9} SOL`);
        
        // Calculate how much we need for the transaction
        const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(GAME_ACCOUNT_SIZE);
        const totalNeeded = rentExemptBalance + betAmount + 5000000; // Add some for transaction fees
        
        console.log(`Rent exemption needed: ${rentExemptBalance / 1e9} SOL`);
        console.log(`Bet amount: ${betAmount / 1e9} SOL`);
        console.log(`Total needed (including fees): ${totalNeeded / 1e9} SOL`);
        
        if (balance < totalNeeded) {
            throw new Error(`Insufficient funds. You have ${balance / 1e9} SOL but need approximately ${totalNeeded / 1e9} SOL. Please add more funds to your wallet.`);
        }
        
        // Generate a unique game seed
        const gameSeed = `game_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        console.log("Game seed:", gameSeed);
        
        // Find the PDA for the game account using the seed
        const [gameAccountPubkey, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from("game"),
                Buffer.from(gameSeed)
            ],
            PROGRAM_ID
        );
        console.log("Game account PDA:", gameAccountPubkey.toString());
        
        // Create the initialize_game instruction
        const initializeGameIx = new TransactionInstruction({
            programId: PROGRAM_ID,
            keys: [
                { pubkey: gameAccountPubkey, isSigner: false, isWritable: true },
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
            ],
            data: Buffer.from([
                // Anchor instruction discriminator for initialize_game (first 8 bytes of the hash of "initialize_game")
                44, 62, 102, 247, 126, 208, 130, 215,
                // max_players (u8)
                maxPlayers,
                // bet_amount (u64) - 8 bytes
                ...new Uint8Array(new BigUint64Array([BigInt(betAmount)]).buffer),
                // Game seed length (u32) - 4 bytes
                ...new Uint8Array(new Uint32Array([gameSeed.length]).buffer),
                // Game seed bytes
                ...new TextEncoder().encode(gameSeed)
            ])
        });
        
        // Create the transaction
        const transaction = new Transaction();
        transaction.add(initializeGameIx);
        
        // Get recent blockhash
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        transaction.recentBlockhash = recentBlockhash;
        transaction.feePayer = wallet.publicKey;
        
        // Sign the transaction with the wallet
        const signedTransaction = await wallet.signTransaction(transaction);
        
        // Send the signed transaction
        console.log("Sending transaction...");
        const signature = await connection.sendRawTransaction(
            signedTransaction.serialize()
        );
        
        // Wait for confirmation
        console.log("Waiting for confirmation...");
        const confirmation = await connection.confirmTransaction(signature);
        console.log("Transaction confirmed:", confirmation);
        
        return {
            txid: signature,
            gameAccountPubkey,
            gameSeed,
            maxPlayers,
            betAmount
        };
    } catch (error) {
        console.error("Error creating game:", error);
        
        // Parse and provide more user-friendly error messages
        if (error.message.includes("insufficient lamports")) {
            throw new Error("Insufficient SOL in your wallet. Please add more funds to create a game.");
        } else if (error.message.includes("Transaction simulation failed")) {
            if (error.logs) {
                console.error("Transaction logs:", error.logs);
                
                if (error.logs.some(log => log.includes("insufficient lamports"))) {
                    throw new Error("Insufficient SOL in your wallet. Please add more funds to create a game.");
                } else if (error.logs.some(log => log.includes("ConstraintSeeds"))) {
                    throw new Error("PDA seed constraint violation. The game account address doesn't match what the program expects.");
                } else if (error.logs.some(log => log.includes("0x65"))) {
                    throw new Error("The program could not process your instruction. This may be due to an incorrect instruction format or program version mismatch.");
                }
            }
        }
        
        throw error;
    }
}

/**
 * Fetch all available games that are waiting for players
 * Simplified for React Native compatibility
 */
export async function fetchAvailableGames() {
    console.log("Fetching available games from blockchain");
    
    const connection = getConnection();
    
    try {
        // Get all program accounts
        const accounts = await connection.getProgramAccounts(PROGRAM_ID);
        console.log(`Found ${accounts.length} program accounts`);
        
        if (accounts.length === 0) {
            console.log("No program accounts found");
            return [];
        }
        
        // Add debug logging to see raw account data
        accounts.forEach((account, index) => {
            const accountData = account.account.data;
            console.log(`Account ${index}: ${account.pubkey.toString()}`);
            console.log(`Data length: ${accountData.length}`);
            if (accountData.length >= 8) {
                const discBytes = new Uint8Array(accountData.slice(0, 8));
                console.log(`Discriminator: [${[...discBytes]}]`);
            }
        });
        
        // Parse each account to get game details
        const games = await Promise.all(accounts.map(async (account, index) => {
            try {
                if (!account || !account.account || !account.account.data) {
                    console.log(`Account ${index}: Invalid account data structure`);
                    return null;
                }

                // Convert account data to Uint8Array if it's not already
                const data = new Uint8Array(account.account.data);
                
                // Check if we have enough data for the discriminator
                if (data.length < 8) {
                    console.log(`Account ${index}: Data too short for discriminator`);
                    return null;
                }
                
                // The account data starts with an 8-byte discriminator
                const discriminator = data.slice(0, 8);
                console.log(`Account ${index} discriminator: [${[...discriminator]}]`);
                
                // Try both discriminators since there might be a version mismatch
                const gameStateDiscriminator1 = new Uint8Array([103, 195, 198, 221, 41, 211, 145, 83]);
                const gameStateDiscriminator2 = new Uint8Array([144, 94, 208, 172, 248, 99, 134, 120]);
                
                // Check against both possible discriminators
                const matches1 = discriminator.every((byte, i) => byte === gameStateDiscriminator1[i]);
                const matches2 = discriminator.every((byte, i) => byte === gameStateDiscriminator2[i]);
                
                if (!matches1 && !matches2) {
                    console.log(`Account ${index}: Discriminator does not match any known GameState discriminator`);
                    return null;
                }
                
                console.log(`Account ${index}: Found matching game state discriminator`);
                
                // Try to parse game state based on the Anchor layout
                try {
                    // Skip discriminator (8 bytes)
                    let offset = 8;
                    
                    // Read creator (Pubkey) - 32 bytes
                    const creatorBytes = data.slice(offset, offset + 32);
                    const creator = new PublicKey(creatorBytes);
                    offset += 32;
                    
                    // Read players array length (u32) - 4 bytes
                    const playersLenBytes = data.slice(offset, offset + 4);
                    const playersLen = new Uint32Array(playersLenBytes.buffer)[0];
                    offset += 4;
                    
                    // Skip players array
                    offset += playersLen * 32;
                    
                    // Skip deposited_players array (similar structure)
                    const depositedPlayersLenBytes = data.slice(offset, offset + 4);
                    const depositedPlayersLen = new Uint32Array(depositedPlayersLenBytes.buffer)[0];
                    offset += 4;
                    offset += depositedPlayersLen * 32;
                    
                    // Read max_players (u8)
                    const maxPlayers = data[offset];
                    offset += 1;
                    
                    // Read bet_amount (u64)
                    const betAmountBytes = data.slice(offset, offset + 8);
                    const betAmount = new BigUint64Array(betAmountBytes.buffer)[0];
                    
                    // We don't need to parse every field, just the crucial ones
                    
                    // Get the game status which should be at a fixed offset from the end
                    // This is approximate since vector lengths can vary
                    const gameStatusOffset = data.length - 100; // Rough estimate
                    let gameStatus = 0; // Default to WaitingForPlayers
                    
                    // Try to find game status by checking a reasonable range
                    for (let i = gameStatusOffset; i < data.length - 10; i++) {
                        // Look for a byte that could be the game status (expecting 0, 1, 2, etc)
                        if (data[i] <= 4 && data[i+1] === 0 && data[i+2] === 0 && data[i+3] === 0) {
                            gameStatus = data[i];
                            break;
                        }
                    }
                    
                    console.log(`Account ${index}: Successfully parsed game data`);
                    console.log(`- Creator: ${creator.toString()}`);
                    console.log(`- Max players: ${maxPlayers}`);
                    console.log(`- Bet amount: ${betAmount.toString()}`);
                    console.log(`- Players count: ${playersLen}`);
                    console.log(`- Game status: ${gameStatus}`);
                    
                    return {
                        id: account.pubkey.toString(),
                        creator: creator.toString(),
                        betAmount: betAmount.toString(),
                        maxPlayers,
                        currentPlayers: playersLen,
                        deposited: depositedPlayersLen,
                        status: gameStatus
                    };
                } catch (parseError) {
                    console.error(`Account ${index}: Error parsing game structure: ${parseError.message}`);
                    return null;
                }
            } catch (error) {
                console.error(`Account ${index}: Error parsing account: ${error.message}`);
                return null;
            }
        }));
        
        // Filter out null values and games that are full or not waiting for players
        const availableGames = games.filter(game => 
            game !== null && 
            game.currentPlayers < game.maxPlayers &&
            game.status === 0 // 0 = WaitingForPlayers in the GameStatus enum
        );
        
        console.log(`Available games after filtering: ${availableGames.length}`);
        
        return availableGames;
    } catch (error) {
        console.error("Error fetching available games:", error);
        throw error;
    }
}

/**
 * Join an existing game
 * Simplified for React Native compatibility
 */
export async function joinGame(wallet, gameAccountPubkey) {
    if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet is required to join a game.");
    }

    console.log("Joining game with ID:", gameAccountPubkey);
    
    try {
        const connection = getConnection();
        const gameAccount = new PublicKey(gameAccountPubkey);
        
        // Check if the account exists and get its data
        const accountInfo = await connection.getAccountInfo(gameAccount);
        if (!accountInfo) {
            throw new Error("Game account not found");
        }
        
        // Create the join_game instruction
        const joinGameIx = new TransactionInstruction({
            programId: PROGRAM_ID,
            keys: [
                { pubkey: gameAccount, isSigner: false, isWritable: true },
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
            ],
            data: Buffer.from([
                // Instruction discriminator for join_game from IDL
                107, 112, 18, 38, 56, 173, 60, 128
            ])
        });
        
        // Create the transaction
        const transaction = new Transaction();
        transaction.add(joinGameIx);
        
        // Get recent blockhash
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        transaction.recentBlockhash = recentBlockhash;
        transaction.feePayer = wallet.publicKey;
        
        // Sign the transaction with the wallet
        const signedTransaction = await wallet.signTransaction(transaction);
        
        // Send the signed transaction
        console.log("Sending transaction...");
        const signature = await connection.sendRawTransaction(
            signedTransaction.serialize()
        );
        
        // Wait for confirmation
        console.log("Waiting for confirmation...");
        const confirmation = await connection.confirmTransaction(signature);
        console.log("Transaction confirmed:", confirmation);
        
        return {
            txid: signature,
            gameAccountPubkey: gameAccount
        };
    } catch (error) {
        console.error("Error joining game:", error);
        
        // If it's a transaction error, log more details for debugging
        if (error.logs) {
            console.error("Transaction logs:", error.logs);
        }
        
        throw error;
    }
}

/**
 * Roll the dice in the game
 * Simplified for React Native compatibility
 */
export async function rollDice(wallet, gameAccountPubkey) {
    if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet is required to roll dice.");
    }

    console.log("Rolling dice for game:", gameAccountPubkey);
    
    try {
        const connection = getConnection();
        const gameAccount = new PublicKey(gameAccountPubkey);
        
        // Create the request_randomness instruction
        const rollDiceIx = new TransactionInstruction({
            programId: PROGRAM_ID,
            keys: [
                { pubkey: gameAccount, isSigner: false, isWritable: true },
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true }
            ],
            data: new Uint8Array([
                // Instruction discriminator for request_randomness
                213, 5, 173, 166, 37, 236, 31, 18
            ])
        });
        
        // Create and send transaction
        const transaction = new Transaction();
        transaction.add(rollDiceIx);
        
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        transaction.recentBlockhash = recentBlockhash;
        transaction.feePayer = wallet.publicKey;
        
        const txid = await sendAndConfirmTransaction(
            connection,
            transaction,
            [wallet]
        );
        
        console.log("Transaction sent successfully. TxID:", txid);
        
        // Fetch the updated game data to get the dice roll result
        const account = await connection.getAccountInfo(gameAccount);
        
        // For now, return a simple result
        // In a real implementation, we would parse the account data to get the actual dice roll
        return {
            txid,
            diceRoll: 6, // placeholder, should be extracted from account data
            gameData: {
                turn: 1, // placeholder, should be extracted from account data
                players: [wallet.publicKey]
            }
        };
    } catch (error) {
        console.error("Error rolling dice:", error);
        throw error;
    }
}

/**
 * Test function to verify basic Solana blockchain interactions
 * This is a simplified version that tests only the most basic web3.js capabilities
 */
export async function testBlockchainConnection(wallet) {
    if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet is required for testing.");
    }
    
    const connection = getConnection();
    const results = {
        success: false,
        steps: [],
        errors: []
    };
    
    try {
        // Step 1: Basic connection test
        results.steps.push("Testing connection to Solana devnet...");
        try {
            const version = await connection.getVersion();
            results.steps.push(`✅ Connected to Solana ${version["solana-core"]}`);
        } catch (e) {
            results.steps.push(`❌ Failed to connect to Solana: ${e.message}`);
            results.errors.push(`Connection error: ${e.message}`);
        }
        
        // Step 2: Check wallet and publicKey
        results.steps.push("Checking wallet configuration...");
        if (wallet && wallet.publicKey) {
            results.steps.push(`✅ Wallet public key: ${wallet.publicKey.toString()}`);
            
            // Check balance
            try {
                const balance = await connection.getBalance(wallet.publicKey);
                results.steps.push(`✅ Wallet balance: ${balance / 1e9} SOL`);
                
                if (balance < 1e8) {
                    results.steps.push("⚠️ WARNING: Low balance. You may need more SOL for transactions.");
                }
            } catch (e) {
                results.steps.push(`❌ Failed to get balance: ${e.message}`);
                results.errors.push(`Balance error: ${e.message}`);
            }
        } else {
            results.steps.push("❌ Wallet or publicKey is undefined");
            results.errors.push("Wallet configuration error");
        }
        
        // Step 3: Test basic Buffer operations
        results.steps.push("Testing basic Buffer operations...");
        try {
            // Just create a simple buffer
            const testBuffer = Buffer.from([1, 2, 3, 4]);
            results.steps.push(`✅ Buffer created successfully: ${testBuffer.toString('hex')}`);
        } catch (e) {
            results.steps.push(`❌ Buffer error: ${e.message}`);
            results.errors.push(`Buffer error: ${e.message}`);
        }
        
        // Step 4: Test basic transaction creation
        results.steps.push("Testing basic transaction creation...");
        try {
            // Create a simple transaction
            const transaction = new Transaction();
            const blockhash = await connection.getRecentBlockhash();
            if (!blockhash) {
                throw new Error("Failed to get recent blockhash");
            }
            
            transaction.recentBlockhash = blockhash.blockhash;
            transaction.feePayer = wallet.publicKey;
            
            // Add a simple system program instruction
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: wallet.publicKey,
                    lamports: 100, // Small amount
                })
            );
            
            results.steps.push("✅ Transaction created successfully");
            
            // OPTIONAL: Actually send the transaction to test full flow
            try {
                const signature = await sendAndConfirmTransaction(
                    connection,
                    transaction,
                    [wallet]
                );
                results.steps.push(`✅ Test transaction sent successfully: ${signature}`);
            } catch (e) {
                results.steps.push(`❌ Failed to send test transaction: ${e.message}`);
                results.errors.push(`Transaction send error: ${e.message}`);
            }
        } catch (e) {
            results.steps.push(`❌ Transaction creation error: ${e.message}`);
            results.errors.push(`Transaction error: ${e.message}`);
        }
        
        // Final summary
        const errorCount = results.errors.length;
        if (errorCount === 0) {
            results.success = true;
            results.steps.push("\n✅ All basic tests passed!");
        } else {
            results.steps.push(`\n❌ Tests completed with ${errorCount} errors.`);
        }
        
        return results;
    } catch (error) {
        results.steps.push(`❌ Test failed: ${error.message}`);
        results.errors.push(error.message);
        return results;
    }
}

/**
 * Send SOL from one wallet to another
 */
export async function sendSOL(wallet, recipient, lamports) {
    if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet is required to send SOL.");
    }

    console.log("Sending SOL to:", recipient);
    console.log("Amount (lamports):", lamports);
    
    try {
        const connection = getConnection();
        const recipientPubkey = new PublicKey(recipient);
        
        // Check wallet balance first
        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`Current wallet balance: ${balance / 1e9} SOL`);
        
        // Add some for transaction fees
        const totalNeeded = lamports + 5000;
        
        if (balance < totalNeeded) {
            throw new Error(`Insufficient funds. You have ${balance / 1e9} SOL but need approximately ${totalNeeded / 1e9} SOL.`);
        }
        
        // Create a simple transfer instruction
        const transferIx = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: recipientPubkey,
            lamports: lamports
        });
        
        // Create the transaction
        const transaction = new Transaction();
        transaction.add(transferIx);
        
        // Get recent blockhash
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        transaction.recentBlockhash = recentBlockhash;
        transaction.feePayer = wallet.publicKey;
        
        // Sign the transaction with the wallet
        const signedTransaction = await wallet.signTransaction(transaction);
        
        // Send the signed transaction
        console.log("Sending transaction...");
        const signature = await connection.sendRawTransaction(
            signedTransaction.serialize()
        );
        
        // Wait for confirmation
        console.log("Waiting for confirmation...");
        await connection.confirmTransaction(signature);
        console.log("Transaction confirmed:", signature);
        
        return signature;
    } catch (error) {
        console.error("Error sending SOL:", error);
        throw error;
    }
}

/**
 * Fetch games that the current wallet has joined
 */
export async function fetchJoinedGames(wallet) {
    if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet is required to fetch joined games.");
    }

    console.log("Fetching joined games for wallet:", wallet.publicKey.toString());
    
    const connection = getConnection();
    
    try {
        // Get all program accounts
        const accounts = await connection.getProgramAccounts(PROGRAM_ID);
        console.log(`Found ${accounts.length} program accounts`);
        
        if (accounts.length === 0) {
            console.log("No program accounts found");
            return [];
        }
        
        // Parse each account to get game details
        const games = await Promise.all(accounts.map(async (account, index) => {
            try {
                if (!account || !account.account || !account.account.data) {
                    console.log(`Account ${index}: Invalid account data structure`);
                    return null;
                }

                // Convert account data to Uint8Array if it's not already
                const data = new Uint8Array(account.account.data);
                
                // Check if we have enough data for the discriminator
                if (data.length < 8) {
                    console.log(`Account ${index}: Data too short for discriminator`);
                    return null;
                }
                
                // The account data starts with an 8-byte discriminator
                const discriminator = data.slice(0, 8);
                
                // Try both discriminators since there might be a version mismatch
                const gameStateDiscriminator1 = new Uint8Array([103, 195, 198, 221, 41, 211, 145, 83]);
                const gameStateDiscriminator2 = new Uint8Array([144, 94, 208, 172, 248, 99, 134, 120]);
                
                // Check against both possible discriminators
                const matches1 = discriminator.every((byte, i) => byte === gameStateDiscriminator1[i]);
                const matches2 = discriminator.every((byte, i) => byte === gameStateDiscriminator2[i]);
                
                if (!matches1 && !matches2) {
                    return null;
                }
                
                // Try to parse game state based on the Anchor layout
                try {
                    // Skip discriminator (8 bytes)
                    let offset = 8;
                    
                    // Read creator (Pubkey) - 32 bytes
                    const creatorBytes = data.slice(offset, offset + 32);
                    const creator = new PublicKey(creatorBytes);
                    offset += 32;
                    
                    // Read players array length (u32) - 4 bytes
                    const playersLenBytes = data.slice(offset, offset + 4);
                    const playersLen = new Uint32Array(playersLenBytes.buffer)[0];
                    offset += 4;
                    
                    // Read players array
                    const players = [];
                    for (let i = 0; i < playersLen; i++) {
                        const playerBytes = data.slice(offset, offset + 32);
                        players.push(new PublicKey(playerBytes).toString());
                        offset += 32;
                    }
                    
                    // Check if current wallet is in the players array
                    const isJoined = players.includes(wallet.publicKey.toString());
                    
                    if (!isJoined) {
                        return null;
                    }
                    
                    // Skip deposited_players array
                    const depositedPlayersLenBytes = data.slice(offset, offset + 4);
                    const depositedPlayersLen = new Uint32Array(depositedPlayersLenBytes.buffer)[0];
                    offset += 4;
                    offset += depositedPlayersLen * 32;
                    
                    // Read max_players (u8)
                    const maxPlayers = data[offset];
                    offset += 1;
                    
                    // Read bet_amount (u64)
                    const betAmountBytes = data.slice(offset, offset + 8);
                    const betAmount = new BigUint64Array(betAmountBytes.buffer)[0];
                    
                    // Get the game status
                    const gameStatusOffset = data.length - 100; // Rough estimate
                    let gameStatus = 0;
                    
                    for (let i = gameStatusOffset; i < data.length - 10; i++) {
                        if (data[i] <= 4 && data[i+1] === 0 && data[i+2] === 0 && data[i+3] === 0) {
                            gameStatus = data[i];
                            break;
                        }
                    }
                    
                    return {
                        id: account.pubkey.toString(),
                        creator: creator.toString(),
                        betAmount: betAmount.toString(),
                        maxPlayers,
                        currentPlayers: playersLen,
                        status: gameStatus,
                        isCreator: creator.toString() === wallet.publicKey.toString()
                    };
                } catch (parseError) {
                    console.error(`Account ${index}: Error parsing game structure: ${parseError.message}`);
                    return null;
                }
            } catch (error) {
                console.error(`Account ${index}: Error parsing account: ${error.message}`);
                return null;
            }
        }));
        
        // Filter out null values and return only joined games
        const joinedGames = games.filter(game => game !== null);
        
        console.log(`Found ${joinedGames.length} joined games`);
        
        return joinedGames;
    } catch (error) {
        console.error("Error fetching joined games:", error);
        throw error;
    }
}









