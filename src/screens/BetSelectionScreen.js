import React, { useEffect, useState } from 'react';
import { Text, FlatList, Pressable, StyleSheet, Alert, View, ActivityIndicator, Modal, TextInput, TouchableOpacity } from 'react-native';
import GradientButton from '../components/GradientButton';
import Wrapper from '../components/Wrapper';
import { navigate } from '../helpers/NavigationUtil';
import { useSelector, useDispatch } from 'react-redux';
import { selectWallet, loadWallet } from '../redux/reducers/walletSlice';
import { rehydrateWallet } from '../solana/solanaWallet';
import { createGame, fetchAvailableGames, joinGame, fetchJoinedGames } from '../solana/solanaClient';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playSound } from '../helpers/SoundUtility';

const BetSelectionScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const walletData = useSelector(selectWallet);
    const [availableGames, setAvailableGames] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [betAmount, setBetAmount] = useState('1');
    const [maxPlayers, setMaxPlayers] = useState('2');
    const isFocused = useIsFocused();

    useEffect(() => {
        if (wallet) {
            checkForActiveGame();
            loadAvailableGames();
        }
    }, [wallet]);

    useEffect(() => {
        async function loadAndRehydrate() {
            if (!walletData) {
                await dispatch(loadWallet());
            } else {
                const rehydrated = await rehydrateWallet(walletData);
                setWallet(rehydrated);
            }
        }
        loadAndRehydrate();
    }, [dispatch, walletData]);

    const checkForActiveGame = async () => {
        try {
            const joinedGames = await fetchJoinedGames(wallet);
            const unfinished = joinedGames.find(g => g.status === 0 || g.status === 1);
            if (unfinished) {
                await AsyncStorage.setItem('activeGame', JSON.stringify({
                    gameId: unfinished.id,
                    gameSeed: '',
                    creator: unfinished.isCreator
                }));
                playSound('game_start');
                navigate('LudoBoardScreen', {
                    gameId: unfinished.id,
                    gameSeed: '',
                    creator: unfinished.isCreator
                });
            } else {
                await AsyncStorage.removeItem('activeGame');
            }
        } catch (error) {
            console.error('Error checking for saved game:', error);
        }
    };

    const loadAvailableGames = async () => {
        if (!wallet) return Alert.alert("Error", "Wallet not initialized.");
        setLoading(true);
        try {
            const games = await fetchAvailableGames();
            setAvailableGames(games);
        } catch (error) {
            console.error("Error fetching games:", error);
            Alert.alert("Error", "Failed to fetch available games.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadAvailableGames();
    };

    const handleCreateBet = async () => {
        if (!wallet || !wallet.publicKey) return Alert.alert("Error", "Wallet not found.");
        if (isNaN(betAmount) || parseFloat(betAmount) <= 0) return Alert.alert("Error", "Enter a valid bet amount.");
        const playerCount = parseInt(maxPlayers);
        if (![2, 4].includes(playerCount)) return Alert.alert("Error", "Player count must be 2 or 4.");

        setLoading(true);
        try {
            const betAmountLamports = parseFloat(betAmount) * 1e9;
            const { txid, gameAccountPubkey, gameSeed } = await createGame(wallet, playerCount, betAmountLamports);
            await AsyncStorage.setItem('activeGame', JSON.stringify({ gameId: gameAccountPubkey.toString(), gameSeed, creator: true }));
            setCreateModalVisible(false);
            navigate('LudoBoardScreen', { gameId: gameAccountPubkey.toString(), gameSeed, creator: true });
            playSound('game_start');
        } catch (error) {
            console.error("Error creating game:", error);
            Alert.alert("Error", error.message || "Failed to create game");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGame = async (gameId) => {
        if (!wallet || !wallet.publicKey) return Alert.alert("Error", "Wallet not found.");
        setLoading(true);
        try {
            const { txid, gameAccountPubkey } = await joinGame(wallet, gameId);
            await AsyncStorage.setItem('activeGame', JSON.stringify({ gameId: gameAccountPubkey.toString(), creator: false }));
            navigate('LudoBoardScreen', { gameId: gameAccountPubkey.toString(), creator: false });
            playSound('game_start');
        } catch (error) {
            console.error("Error joining game:", error);
            Alert.alert("Error", error.message || "Failed to join game");
        } finally {
            setLoading(false);
        }
    };

    const formatBetAmount = (lamports) => `${parseFloat(lamports) / 1e9} SOL`;

    return (
        <Wrapper style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Available Games</Text>
            {loading && !refreshing && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5253ed" />
                </View>
            )}

            <FlatList
                data={availableGames}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable style={styles.betItem} onPress={() => handleJoinGame(item.id)}>
                        <Text style={styles.betText}>Creator: {item.creator.substring(0, 10)}...</Text>
                        <Text style={styles.betText}>Bet Amount: {formatBetAmount(item.betAmount)}</Text>
                        <Text style={styles.betText}>Players: {item.currentPlayers}/{item.maxPlayers}</Text>
                    </Pressable>
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={!loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No games available</Text>
                        <Text style={styles.emptySubText}>Create a new game or pull down to refresh</Text>
                    </View>
                ) : null}
                style={styles.list}
            />

            <GradientButton title="+ Create New Game" onPress={() => setCreateModalVisible(true)} style={styles.createButton} />

            <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Create New Game</Text>
                        <Text style={styles.inputLabel}>Bet Amount (SOL)</Text>
                        <TextInput
                            style={styles.input}
                            value={betAmount}
                            onChangeText={setBetAmount}
                            keyboardType="numeric"
                            placeholder="Enter bet amount in SOL"
                            placeholderTextColor="#999"
                        />
                        <Text style={styles.inputLabel}>Number of Players</Text>
                        <View style={styles.playerButtonsContainer}>
                            <TouchableOpacity style={[styles.playerButton, maxPlayers === '2' && styles.selectedPlayerButton]} onPress={() => setMaxPlayers('2')}>
                                <Text style={[styles.playerButtonText, maxPlayers === '2' && styles.selectedPlayerButtonText]}>2 Players</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.playerButton, maxPlayers === '4' && styles.selectedPlayerButton]} onPress={() => setMaxPlayers('4')}>
                                <Text style={[styles.playerButtonText, maxPlayers === '4' && styles.selectedPlayerButtonText]}>4 Players</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalButtons}>
                            <GradientButton title="Create Game" onPress={handleCreateBet} style={styles.modalButton} />
                            <GradientButton title="Cancel" onPress={() => setCreateModalVisible(false)} colors={["#6c757d", "#495057"]} style={styles.modalButton} />
                        </View>
                    </View>
                </View>
            </Modal>
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    backButton: { marginBottom: 16 },
    backButtonText: { color: '#fff', fontSize: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { flex: 1 },
    betItem: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 15, marginBottom: 10 },
    betText: { color: 'white', fontSize: 16, marginBottom: 5 },
    emptyContainer: { padding: 20, alignItems: 'center' },
    emptyText: { color: 'white', fontSize: 18, marginBottom: 10 },
    emptySubText: { color: '#AAA', fontSize: 14 },
    createButton: { marginTop: 20 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContainer: { width: '90%', backgroundColor: '#1e2131', borderRadius: 15, padding: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
    inputLabel: { color: 'white', fontSize: 16, marginBottom: 8 },
    input: { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
    playerButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    playerButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, marginHorizontal: 5, alignItems: 'center' },
    selectedPlayerButton: { backgroundColor: '#5253ed' },
    playerButtonText: { color: 'white', fontSize: 16 },
    selectedPlayerButtonText: { fontWeight: 'bold' },
    modalButtons: { flexDirection: 'column', justifyContent: 'space-between' },
    modalButton: { marginVertical: 5 },
});

export default BetSelectionScreen;



