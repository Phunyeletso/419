import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Wrapper from '../components/Wrapper';
import { selectWallet, updateWalletBalance } from '../redux/reducers/walletSlice';
import { sendSOL } from '../solana/solanaClient';
import { rehydrateWallet } from '../solana/solanaWallet';
import { navigate } from '../helpers/NavigationUtil';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

const SendScreen = () => {
    const dispatch = useDispatch();
    const walletData = useSelector(selectWallet);
    const wallet = walletData ? rehydrateWallet(walletData) : null;
    
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [recipientError, setRecipientError] = useState('');
    const [amountError, setAmountError] = useState('');

    // Validate Solana address
    const validateAddress = (address) => {
        try {
            // Simple validation - check if it's 44 characters
            // In a real app, you'd use PublicKey validation from Solana
            return address.length === 44;
        } catch (error) {
            return false;
        }
    };

    // Handle sending SOL
    const handleSend = async () => {
        // Reset errors
        setRecipientError('');
        setAmountError('');
        
        // Validate recipient
        if (!recipient) {
            setRecipientError('Recipient address is required');
            return;
        }
        
        if (!validateAddress(recipient)) {
            setRecipientError('Invalid Solana address');
            return;
        }
        
        // Validate amount
        if (!amount) {
            setAmountError('Amount is required');
            return;
        }
        
        const amountValue = parseFloat(amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            setAmountError('Please enter a valid amount greater than 0');
            return;
        }
        
        if (amountValue > walletData.balance) {
            setAmountError('Insufficient balance');
            return;
        }
        
        // Proceed with sending
        setLoading(true);
        try {
            // Convert SOL to lamports (1 SOL = 1e9 lamports)
            const lamports = amountValue * 1e9;
            
            // Send the transaction
            const txid = await sendSOL(wallet, recipient, lamports);
            
            // Update balance
            await dispatch(updateWalletBalance());
            
            // Show success message
            Alert.alert(
                "Success",
                `${amount} SOL sent successfully!\nTransaction ID: ${txid}`,
                [{ text: "OK", onPress: () => navigate('WalletScreen') }]
            );
        } catch (error) {
            console.error("Error sending SOL:", error);
            Alert.alert("Error", `Failed to send SOL: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle max amount
    const handleSetMaxAmount = () => {
        if (walletData && walletData.balance) {
            // Set slightly less than full balance to account for fees
            const maxAmount = Math.max(0, walletData.balance - 0.01);
            setAmount(maxAmount.toString());
        }
    };

    // Handle pasting from clipboard
    const pasteFromClipboard = async () => {
        try {
            const text = await Clipboard.getStringAsync();
            if (text) {
                setRecipient(text);
                setRecipientError('');
            }
        } catch (error) {
            console.error('Error pasting from clipboard:', error);
        }
    };

    if (!wallet) {
        return (
            <Wrapper style={styles.container}>
                <Text style={styles.title}>No Wallet Found</Text>
            </Wrapper>
        );
    }

    return (
        <Wrapper style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.contentWrapper}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigate('WalletScreen')} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.title}>Send SOL</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <LinearGradient
                            colors={['#1e2131', '#2a2d3e']}
                            style={styles.card}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.label}>Available Balance</Text>
                            <View style={styles.balanceContainer}>
                                <Text style={styles.balance}>{walletData.balance || 0} SOL</Text>
                                <Text style={styles.usdValue}>(${(walletData.balance * 30).toFixed(2)})</Text>
                            </View>
                        </LinearGradient>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Recipient Address</Text>
                            <View style={styles.addressInputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter recipient address"
                                    placeholderTextColor="#777"
                                    value={recipient}
                                    onChangeText={(text) => {
                                        setRecipient(text);
                                        setRecipientError('');
                                    }}
                                />
                                <TouchableOpacity style={styles.pasteButton} onPress={pasteFromClipboard}>
                                    <Ionicons name="clipboard-outline" size={20} color="#5253ed" />
                                </TouchableOpacity>
                            </View>
                            {recipientError ? <Text style={styles.errorText}>{recipientError}</Text> : null}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Amount (SOL)</Text>
                            <View style={styles.amountInputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter amount"
                                    placeholderTextColor="#777"
                                    keyboardType="decimal-pad"
                                    value={amount}
                                    onChangeText={(text) => {
                                        setAmount(text);
                                        setAmountError('');
                                    }}
                                />
                                <TouchableOpacity style={styles.maxButton} onPress={handleSetMaxAmount}>
                                    <Text style={styles.maxButtonText}>MAX</Text>
                                </TouchableOpacity>
                            </View>
                            {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
                        </View>

                        <View style={styles.estimatedFeeContainer}>
                            <Text style={styles.feeLabel}>Estimated Fee:</Text>
                            <Text style={styles.feeValue}>~0.000005 SOL</Text>
                        </View>

                        <TouchableOpacity
                            disabled={loading}
                            onPress={handleSend}
                            style={styles.sendButtonContainer}
                        >
                            <LinearGradient
                                colors={['#3f4060', '#5253ed']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.sendButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="paper-plane" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.sendButtonText}>Send SOL</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        flex: 1,
        width: '100%',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContainer: {
        paddingBottom: 30,
        alignItems: 'center',
    },
    contentWrapper: {
        width: width > 500 ? 500 : width - 30,
        alignSelf: 'center',
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        width: '100%',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 22,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    card: {
        borderRadius: 15,
        padding: 16,
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 6,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    balance: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
    },
    usdValue: {
        fontSize: 14,
        color: '#999',
        marginLeft: 8,
    },
    inputContainer: {
        marginBottom: 16,
        width: '100%',
    },
    addressInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        height: 48,
        paddingHorizontal: 15,
        fontSize: 15,
        color: 'white',
    },
    pasteButton: {
        padding: 12,
    },
    maxButton: {
        backgroundColor: 'rgba(82, 83, 237, 0.2)',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    maxButtonText: {
        color: '#5253ed',
        fontWeight: 'bold',
        fontSize: 13,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 13,
        marginTop: 4,
        textAlign: 'center',
    },
    estimatedFeeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        width: '100%',
    },
    feeLabel: {
        color: '#aaa',
        fontSize: 13,
    },
    feeValue: {
        color: '#fff',
        fontSize: 13,
    },
    sendButtonContainer: {
        width: '100%',
        marginTop: 30,
    },
    sendButton: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    sendButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SendScreen; 