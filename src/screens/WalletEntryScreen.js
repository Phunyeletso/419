import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Wrapper from '../components/Wrapper';
import GradientButton from '../components/GradientButton';
import { selectWallet, loadWallet, createWallet } from '../redux/reducers/walletSlice';
import { navigationRef } from '../helpers/NavigationUtil';

const WalletEntryScreen = () => {
    const dispatch = useDispatch();
    const wallet = useSelector(selectWallet);

    useEffect(() => {
        // On mount, try to load an existing wallet from secure storage
        dispatch(loadWallet());
    }, [dispatch]);

    useEffect(() => {
        if (wallet && wallet.publicKey) {
            navigationRef.current?.reset({
                index: 1,
                routes: [
                    { name: 'HomeScreen' },
                    { name: 'WalletScreen' },
                ],
            });
        }
    }, [wallet]);

    const handleCreateWallet = async () => {
        await dispatch(createWallet());
        // After wallet creation, the useEffect above will replace the route.
    };

    return (
        <Wrapper style={styles.container}>
            <Text style={styles.title}>Wallet Setup</Text>
            <Text style={styles.description}>
                Looks like you might not have a wallet yet. Create a new Solana wallet and keep your private key safe.
            </Text>
            <GradientButton title="Create New Wallet" onPress={handleCreateWallet} />
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        color: 'white',
    },
    description: {
        fontSize: 16,
        color: 'white',
        marginBottom: 40,
        textAlign: 'center',
    },
});

export default WalletEntryScreen;


