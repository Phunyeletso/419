import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withDelay } from 'react-native-reanimated';
import GradientButton from '../components/GradientButton';
import { navigate } from '../helpers/NavigationUtil';
import { useSelector, useDispatch } from 'react-redux';
import { selectWallet, loadWallet } from '../redux/reducers/walletSlice';
import { rehydrateWallet } from '../solana/solanaWallet';
import { Ionicons } from '@expo/vector-icons';
import { playBackgroundMusic, playSound, stopBackgroundMusic, setMasterVolume } from '../helpers/SoundUtility';

const WelcomeScreen = () => {
    const dispatch = useDispatch();
    const walletData = useSelector(selectWallet);
    const [wallet, setWallet] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    
    // Animation values
    const logoScale = useSharedValue(0.8);
    const buttonOpacity = useSharedValue(0);
    const buttonTranslateY = useSharedValue(30);
    
    // Start music and animation when screen loads
    useEffect(() => {
        // Play background music
        playBackgroundMusic('menu_music', true);
        
        // Start animations
        logoScale.value = withSequence(
            withTiming(1.1, { duration: 800 }),
            withTiming(1, { duration: 400 })
        );
        
        buttonOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
        buttonTranslateY.value = withDelay(600, withTiming(0, { duration: 800 }));
        
        // Clean up when component unmounts
        return () => {
            // Don't stop music here, we'll handle that in the next screen
        };
    }, []);
    
    // Load wallet data on mount
    useEffect(() => {
        async function initializeWallet() {
            try {
                if (!walletData) {
                    await dispatch(loadWallet());
                } else {
                    const rehydrated = await rehydrateWallet(walletData);
                    setWallet(rehydrated);
                }
            } catch (error) {
                console.error("Error loading wallet:", error);
            }
        }
        
        initializeWallet();
    }, [dispatch, walletData]);
    
    // Toggle sound
    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        setMasterVolume(newState ? 1.0 : 0.0);
        
        if (newState) {
            playSound('button_click');
            playBackgroundMusic('menu_music', true);
        } else {
            stopBackgroundMusic();
        }
    };
    
    // Navigation handlers
    const handleStartPlaying = () => {
        playSound('button_click');
        navigate('BetSelectionScreen');
    };
    
    const handleCreateWallet = () => {
        playSound('button_click');
        navigate('CreateWalletScreen');
    };
    
    const handleImportWallet = () => {
        playSound('button_click');
        navigate('ImportWalletScreen');
    };
    
    // Animated styles
    const logoAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: logoScale.value }]
        };
    });
    
    const buttonContainerStyle = useAnimatedStyle(() => {
        return {
            opacity: buttonOpacity.value,
            transform: [{ translateY: buttonTranslateY.value }]
        };
    });
    
    // Glowing effect for the logo
    const glowOpacity = useSharedValue(0.5);
    
    useEffect(() => {
        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.8, { duration: 1500 }),
                withTiming(0.5, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);
    
    const glowStyle = useAnimatedStyle(() => {
        return {
            opacity: glowOpacity.value
        };
    });
    
    return (
        <LinearGradient
            colors={['#202060', '#5253ed']}
            style={styles.container}
        >
            {/* Sound toggle button */}
            <Pressable style={styles.soundButton} onPress={toggleSound}>
                <Ionicons 
                    name={soundEnabled ? 'volume-high' : 'volume-mute'} 
                    size={24} 
                    color="white" 
                />
            </Pressable>
            
            {/* Logo with glow effect */}
            <View style={styles.logoContainer}>
                <Animated.View style={[styles.logoGlow, glowStyle]} />
                <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
                    <Image 
                        source={require('../../assets/logo.png')} 
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>
            </View>
            
            <Text style={styles.title}>Blockchain Ludo</Text>
            <Text style={styles.subtitle}>Play, Win & Earn</Text>
            
            {/* Buttons */}
            <Animated.View style={[styles.buttonContainer, buttonContainerStyle]}>
                {wallet ? (
                    <GradientButton 
                        title="Start Playing" 
                        onPress={handleStartPlaying}
                        style={styles.button}
                    />
                ) : (
                    <>
                        <GradientButton 
                            title="Create New Wallet" 
                            onPress={handleCreateWallet}
                            style={styles.button}
                        />
                        <GradientButton 
                            title="Import Existing Wallet" 
                            onPress={handleImportWallet}
                            style={styles.button}
                            colors={['#6c757d', '#495057']}
                        />
                    </>
                )}
            </Animated.View>
            
            {/* Version number */}
            <Text style={styles.version}>Version 1.0.0</Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    soundButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        padding: 10,
        zIndex: 10,
    },
    logoContainer: {
        marginBottom: 30,
        position: 'relative',
    },
    logoWrapper: {
        position: 'relative',
        zIndex: 2,
    },
    logoGlow: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#ffffff',
        top: 25,
        left: 25,
        zIndex: 1,
        opacity: 0.5,
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    logo: {
        width: 200,
        height: 200,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: 'white',
        opacity: 0.9,
        marginBottom: 50,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
    },
    button: {
        marginBottom: 15,
    },
    version: {
        position: 'absolute',
        bottom: 20,
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
    },
});

export default WelcomeScreen; 