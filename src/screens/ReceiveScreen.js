import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert,
    ScrollView,
    Share,
    Dimensions
} from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import Wrapper from '../components/Wrapper';
import { selectWallet } from '../redux/reducers/walletSlice';
import { rehydrateWallet } from '../solana/solanaWallet';
import { navigate } from '../helpers/NavigationUtil';

const { width } = Dimensions.get('window');

const ReceiveScreen = () => {
    const walletData = useSelector(selectWallet);
    const wallet = walletData ? rehydrateWallet(walletData) : null;

    // Copy the address to clipboard
    const copyToClipboard = async () => {
        if (wallet && wallet.publicKey) {
            await Clipboard.setStringAsync(wallet.publicKey.toString());
            Alert.alert("Copied", "Address copied to clipboard!");
        }
    };

    // Share the wallet address
    const shareAddress = async () => {
        if (wallet && wallet.publicKey) {
            try {
                await Share.share({
                    message: `My Solana wallet address: ${wallet.publicKey.toString()}`,
                });
            } catch (error) {
                Alert.alert("Error", "Failed to share address");
            }
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
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.contentWrapper}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigate('WalletScreen')} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Receive SOL</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <LinearGradient
                        colors={['#1e2131', '#2a2d3e']}
                        style={styles.qrContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.qrWrapper}>
                            <QRCode
                                value={wallet.publicKey.toString()}
                                size={180}
                                color="#FFF"
                                backgroundColor="transparent"
                                logoBackgroundColor="transparent"
                            />
                        </View>
                        <Text style={styles.walletLabel}>Your Wallet Address</Text>
                    </LinearGradient>

                    <View style={styles.addressContainer}>
                        <Text style={styles.addressLabel}>Public Address:</Text>
                        <View style={styles.addressValue}>
                            <Text style={styles.addressText}>{wallet.publicKey.toString()}</Text>
                        </View>
                    </View>

                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard}>
                            <LinearGradient
                                colors={['#3f4060', '#5253ed']}
                                style={styles.actionButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="copy-outline" size={20} color="#FFF" />
                            </LinearGradient>
                            <Text style={styles.actionButtonText}>Copy</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.actionButton} onPress={shareAddress}>
                            <LinearGradient
                                colors={['#3f4060', '#5253ed']}
                                style={styles.actionButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="share-social-outline" size={20} color="#FFF" />
                            </LinearGradient>
                            <Text style={styles.actionButtonText}>Share</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoContainer}>
                        <Ionicons name="information-circle-outline" size={20} color="#aaa" style={styles.infoIcon} />
                        <Text style={styles.infoText}>
                            Only send SOL and SPL tokens to this address. Sending any other coins may result in permanent loss.
                        </Text>
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
    qrContainer: {
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    qrWrapper: {
        padding: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 15,
        marginBottom: 16,
    },
    walletLabel: {
        fontSize: 16,
        color: '#FFF',
        marginTop: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    addressContainer: {
        backgroundColor: '#1e2131',
        borderRadius: 15,
        padding: 14,
        marginVertical: 8,
        width: '100%',
    },
    addressLabel: {
        color: '#aaa',
        fontSize: 13,
        marginBottom: 5,
        textAlign: 'center',
    },
    addressValue: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    addressText: {
        color: '#fff',
        fontSize: 13,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 16,
    },
    actionButton: {
        alignItems: 'center',
        width: '40%',
    },
    actionButtonGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    infoContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 12,
        marginTop: 24,
        width: '100%',
    },
    infoIcon: {
        marginRight: 8,
        marginTop: 2,
    },
    infoText: {
        color: '#aaa',
        fontSize: 13,
        flexShrink: 1,
        lineHeight: 18,
    },
});

export default ReceiveScreen; 