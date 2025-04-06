import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GradientButton from '../components/GradientButton';
import Wrapper from '../components/Wrapper';
import { navigate } from '../helpers/NavigationUtil';

const PlayerSelectionScreen = ({ navigation }) => {
    const selectPlayers = (count) => {
        // Pass the selected number of players to the next screen
        navigation.navigate('BetSelectionScreen', { playerCount: count });
    };

    return (
        <Wrapper style={styles.container}>
            <Text style={styles.title}>Select Number of Players</Text>
            <GradientButton title="2 Players" onPress={() => selectPlayers(2)} />
            <GradientButton title="4 Players" onPress={() => selectPlayers(4)} />
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        color: 'white',
    },
});

export default PlayerSelectionScreen;
