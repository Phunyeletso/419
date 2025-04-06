// solanaWallet.js
import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';

/**
 * Rehydrates the wallet from stored wallet data.
 * @param {object} walletData - Contains publicKey (string) and privateKey (hex string).
 * @returns {object|null} An object with a PublicKey instance, a signTransaction method, and the stored balance.
 */
export function rehydrateWallet(walletData) {
    if (!walletData || !walletData.privateKey) return null;
    const secretKey = Uint8Array.from(Buffer.from(walletData.privateKey, 'hex'));
    const keypair = Keypair.fromSecretKey(secretKey);
    return {
        publicKey: keypair.publicKey,
        signTransaction: async (transaction) => {
            transaction.partialSign(keypair);
            return transaction;
        },
        balance: walletData.balance, // using the stored balance (may be 0 if not updated)
    };
}


