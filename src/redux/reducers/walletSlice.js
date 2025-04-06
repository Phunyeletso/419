// walletSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

const PRIVATE_KEY_STORAGE_KEY = 'MY_APP_PRIVATE_KEY';
const SOLANA_NETWORK = 'https://api.devnet.solana.com';

async function generateWallet() {
    const keypair = Keypair.generate();
    return {
        publicKey: keypair.publicKey.toString(), // store as string
        privateKey: Buffer.from(keypair.secretKey).toString('hex'), // store as hex string
    };
}

// Fetch the current balance from the blockchain
async function fetchBalance(publicKey) {
    try {
        const connection = new Connection(SOLANA_NETWORK, 'confirmed');
        const pubKey = new PublicKey(publicKey);
        const balance = await connection.getBalance(pubKey);
        return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
        console.error("Error fetching balance:", error);
        return 0;
    }
}

export const createWallet = createAsyncThunk(
    'wallet/createWallet',
    async (_, { rejectWithValue }) => {
        try {
            const walletData = await generateWallet();
            const { publicKey, privateKey } = walletData;
            await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE_KEY, privateKey);
            
            // Fetch initial balance
            const balance = await fetchBalance(publicKey);
            
            // Store both keys in Redux
            return { publicKey, privateKey, balance };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const loadWallet = createAsyncThunk(
    'wallet/loadWallet',
    async (_, { rejectWithValue }) => {
        try {
            const privateKeyHex = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE_KEY);
            if (!privateKeyHex) {
                return null;
            }
            // Reconstruct the keypair.
            const keypair = Keypair.fromSecretKey(
                Uint8Array.from(Buffer.from(privateKeyHex, 'hex'))
            );
            
            // Fetch current balance
            const balance = await fetchBalance(keypair.publicKey.toString());
            
            return {
                publicKey: keypair.publicKey.toString(),
                privateKey: privateKeyHex,
                balance,
            };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateWalletBalance = createAsyncThunk(
    'wallet/updateBalance',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { wallet } = getState();
            const { walletData } = wallet;
            
            if (!walletData || !walletData.publicKey) {
                return rejectWithValue('No wallet data available');
            }
            
            const balance = await fetchBalance(walletData.publicKey);
            return balance;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const logoutWallet = createAsyncThunk(
    'wallet/logoutWallet',
    async (_, { rejectWithValue }) => {
        try {
            await SecureStore.deleteItemAsync(PRIVATE_KEY_STORAGE_KEY);
            return true;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const walletSlice = createSlice({
    name: 'wallet',
    initialState: {
        walletData: null,  // { publicKey: string, privateKey: string, balance }
        status: 'idle',
        error: null,
    },
    reducers: {
        clearWalletData: (state) => {
            state.walletData = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(createWallet.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(createWallet.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.walletData = action.payload;
        });
        builder.addCase(createWallet.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
        builder.addCase(loadWallet.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(loadWallet.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.walletData = action.payload;
        });
        builder.addCase(loadWallet.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
        builder.addCase(logoutWallet.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(logoutWallet.fulfilled, (state) => {
            state.status = 'succeeded';
            state.walletData = null;
        });
        builder.addCase(logoutWallet.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
        builder.addCase(updateWalletBalance.fulfilled, (state, action) => {
            if (state.walletData) {
                state.walletData.balance = action.payload;
            }
        });
    },
});

export const { clearWalletData } = walletSlice.actions;
export const selectWallet = (state) => state.wallet.walletData;
export const selectWalletStatus = (state) => state.wallet.status;
export const selectWalletError = (state) => state.wallet.error;

export default walletSlice.reducer;




