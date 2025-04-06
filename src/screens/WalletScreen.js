import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Alert, ActivityIndicator, View, RefreshControl, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Wrapper from '../components/Wrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { selectWallet, logoutWallet, updateWalletBalance } from '../redux/reducers/walletSlice';
import { navigate } from '../helpers/NavigationUtil';
import { sendSOL } from '../solana/solanaClient';
import { rehydrateWallet } from '../solana/solanaWallet';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

const WalletScreen = () => {
    const dispatch = useDispatch();
    // Retrieve the raw wallet data (publicKey and privateKey as strings) from Redux.
    const walletData = useSelector(selectWallet);
    // Synchronously rehydrate the wallet.
    const wallet = walletData ? rehydrateWallet(walletData) : null;
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch the wallet balance when the screen loads
    useEffect(() => {
        fetchBalance();
    }, []);

    // Function to refresh the wallet balance
    const fetchBalance = async () => {
        if (!wallet) {
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            await dispatch(updateWalletBalance());
        } catch (error) {
            console.error('Error updating balance:', error);
            Alert.alert('Error', 'Failed to update balance.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Handle pull-to-refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBalance();
    };

    const handleLogout = async () => {
        await dispatch(logoutWallet());
        navigate('WalletEntryScreen');
    };

    // Function to send SOL.
    const handleSendSOL = async () => {
        navigate('SendScreen'); // Ideally navigate to a dedicated send screen
    };
    
    const handleReceive = () => {
        navigate('ReceiveScreen'); // Ideally navigate to a dedicated receive screen
    };

    // Copy the address to clipboard
    const copyToClipboard = async () => {
        if (wallet && wallet.publicKey) {
            await Clipboard.setStringAsync(wallet.publicKey.toString());
            Alert.alert("Copied", "Address copied to clipboard!");
        }
    };

    // Format address to truncate the middle
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
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
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#5253ed"
                    />
                }
            >
                <View style={styles.contentWrapper}>
                    {/* Wallet Card */}
                    <LinearGradient
                        colors={['#1e2131', '#2a2d3e']}
                        style={styles.walletCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.walletHeader}>
                            <View>
                                <Text style={styles.walletName}>Wallet {formatAddress(wallet.publicKey.toString())}</Text>
                                <View style={styles.statusIndicator}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>Connected</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                <Ionicons name="log-out-outline" size={24} color="#777" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.balanceContainer}>
                            {loading ? (
                                <ActivityIndicator size="large" color="#5253ed" />
                            ) : (
                                <>
                                    <Text style={styles.currencySymbol}>$</Text>
                                    <Text style={styles.balanceText}>
                                        {(walletData?.balance * 30).toFixed(2)}
                                    </Text>
                                </>
                            )}
                        </View>

                        <View style={styles.solBalanceContainer}>
                            <View style={styles.solIconContainer}>
                                <View style={styles.solIcon}>
                                    <Text style={styles.solLogoText}>SOL</Text>
                                </View>
                            </View>
                            <View style={styles.solInfoContainer}>
                                <Text style={styles.solName}>Solana</Text>
                                <Text style={styles.solAmount}>{walletData?.balance || 0} SOL</Text>
                            </View>
                            <Text style={styles.solValue}>${(walletData?.balance * 30).toFixed(2)}</Text>
                        </View>

                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
                                <LinearGradient
                                    colors={['#3f4060', '#5253ed']}
                                    style={styles.actionButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="arrow-down-outline" size={20} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.actionButtonText}>Receive</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.actionButton} onPress={handleSendSOL}>
                                <LinearGradient
                                    colors={['#3f4060', '#5253ed']}
                                    style={styles.actionButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="arrow-up-outline" size={20} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.actionButtonText}>Send</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.actionButton} onPress={fetchBalance}>
                                <LinearGradient
                                    colors={['#3f4060', '#5253ed']}
                                    style={styles.actionButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="refresh-outline" size={20} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.actionButtonText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    {/* Public Key Section */}
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressLabel}>Public Address:</Text>
                        <View style={styles.addressValue}>
                            <Text style={styles.addressText}>{wallet.publicKey.toString()}</Text>
                            <TouchableOpacity 
                                style={styles.copyButton}
                                onPress={copyToClipboard}
                            >
                                <Ionicons name="copy-outline" size={18} color="#5253ed" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Recent Activity Section */}
                    <View style={styles.activityContainer}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <View style={styles.emptyActivity}>
                            <Ionicons name="document-text-outline" size={32} color="#444" />
                            <Text style={styles.emptyActivityText}>No recent transactions</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    title: {
        fontSize: 24,
        color: 'white',
        marginVertical: 20,
        textAlign: 'center',
    },
    walletCard: {
        borderRadius: 15,
        padding: 16,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
        width: '100%',
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    walletName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4caf50',
        marginRight: 5,
    },
    statusText: {
        color: '#4caf50',
        fontSize: 11,
    },
    logoutButton: {
        padding: 5,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 15,
        justifyContent: 'center',
    },
    currencySymbol: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginRight: 5,
        marginTop: 5,
    },
    balanceText: {
        color: '#fff',
        fontSize: 42,
        fontWeight: 'bold',
    },
    solBalanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 12,
        marginVertical: 12,
    },
    solIconContainer: {
        marginRight: 12,
    },
    solIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#5253ed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    solLogoText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 11,
    },
    solInfoContainer: {
        flex: 1,
    },
    solName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    solAmount: {
        color: '#aaa',
        fontSize: 13,
    },
    solValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 15,
    },
    actionButton: {
        alignItems: 'center',
        width: '30%',
    },
    actionButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
    },
    addressContainer: {
        backgroundColor: '#1e2131',
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        width: '100%',
    },
    addressLabel: {
        color: '#aaa',
        fontSize: 13,
        marginBottom: 5,
    },
    addressValue: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    addressText: {
        color: '#fff',
        fontSize: 13,
        flex: 1,
    },
    copyButton: {
        padding: 5,
    },
    activityContainer: {
        backgroundColor: '#1e2131',
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        width: '100%',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    emptyActivity: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 25,
    },
    emptyActivityText: {
        color: '#777',
        marginTop: 10,
        textAlign: 'center',
    },
});

export default WalletScreen;






