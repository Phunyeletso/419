import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setMasterVolume } from '../helpers/SoundUtility';

const GameControls = ({ onLeaveGame, onToggleSound, soundEnabled }) => {
    // Handle sound toggle and update the master volume setting
    const handleSoundToggle = () => {
        const newSoundState = !soundEnabled;
        
        // Set master volume to 0 if disabled, 1 if enabled
        setMasterVolume(newSoundState ? 1.0 : 0.0);
        
        // Notify parent component
        if (onToggleSound) {
            onToggleSound();
        }
    };

    return (
        <View style={styles.container}>
            {/* Sound toggle button */}
            <TouchableOpacity
                style={styles.controlButton}
                onPress={handleSoundToggle}
            >
                <Ionicons 
                    name={soundEnabled ? 'volume-high' : 'volume-mute'} 
                    size={24} 
                    color="#fff" 
                />
                <Text style={styles.buttonText}>
                    {soundEnabled ? 'Sound On' : 'Sound Off'}
                </Text>
            </TouchableOpacity>

            {/* Help button */}
            <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="help-circle" size={24} color="#fff" />
                <Text style={styles.buttonText}>Rules</Text>
            </TouchableOpacity>

            {/* Leave game button */}
            <TouchableOpacity
                style={[styles.controlButton, styles.leaveButton]}
                onPress={onLeaveGame}
            >
                <Ionicons name="exit-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Leave Game</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        marginTop: 10,
    },
    controlButton: {
        backgroundColor: '#5253ed',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    leaveButton: {
        backgroundColor: '#dc3545',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
});

export default GameControls; 