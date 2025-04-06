import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '../components/GradientButton';
import { navigate } from '../helpers/NavigationUtil';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playBackgroundMusic, playSound, stopBackgroundMusic, setMasterVolume } from '../helpers/SoundUtility';
import { Ionicons } from '@expo/vector-icons';

const OnboardingScreen = () => {
    const [step, setStep] = useState(0);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    
    // Animation values
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);
    const scale = useSharedValue(0.8);
    
    // Check if user has completed onboarding before
    useEffect(() => {
        async function checkOnboardingStatus() {
            try {
                const value = await AsyncStorage.getItem('@onboarding_completed');
                if (value === 'true') {
                    setHasCompletedOnboarding(true);
                } else {
                    // Start background music for new users
                    playBackgroundMusic('menu_music', true);
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error);
            }
        }
        
        checkOnboardingStatus();
        
        return () => {
            if (!hasCompletedOnboarding) {
                stopBackgroundMusic();
            }
        };
    }, []);
    
    // Start animation when component mounts
    useEffect(() => {
        opacity.value = withTiming(1, { duration: 800 });
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
    }, []);
    
    // Animate transitions between steps
    useEffect(() => {
        // Reset and restart animations for new step
        opacity.value = withSequence(
            withTiming(0, { duration: 200 }),
            withDelay(100, withTiming(1, { duration: 500 }))
        );
        
        translateY.value = withSequence(
            withTiming(30, { duration: 200 }),
            withDelay(100, withSpring(0))
        );
        
        scale.value = withSequence(
            withTiming(0.9, { duration: 200 }),
            withDelay(100, withSpring(1))
        );
        
        // Play sound effect when changing steps
        playSound('button_click');
    }, [step]);
    
    // Animation styles
    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { translateY: translateY.value },
                { scale: scale.value }
            ]
        };
    });
    
    // Handle completing onboarding
    const handleComplete = async () => {
        try {
            // Play completion sound
            playSound('success');
            
            // Mark onboarding as completed
            await AsyncStorage.setItem('@onboarding_completed', 'true');
            setHasCompletedOnboarding(true);
            
            // Navigate to welcome screen
            navigate('WelcomeScreen');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };
    
    // Handle skipping onboarding
    const handleSkip = async () => {
        try {
            // Mark onboarding as completed
            await AsyncStorage.setItem('@onboarding_completed', 'true');
            setHasCompletedOnboarding(true);
            
            // Navigate to welcome screen
            navigate('WelcomeScreen');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };
    
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
    
    // If user has completed onboarding before, skip directly to welcome screen
    useEffect(() => {
        if (hasCompletedOnboarding) {
            navigate('WelcomeScreen');
        }
    }, [hasCompletedOnboarding]);
    
    // Onboarding content for each step
    const steps = [
        {
            title: "Welcome to Blockchain Ludo!",
            description: "The classic board game reinvented with blockchain technology. Play, compete, and win real cryptocurrency.",
            image: require('../../assets/onboarding/game-intro.png')
        },
        {
            title: "Secure & Transparent",
            description: "Every move is recorded on the blockchain, ensuring fair play and transparent game mechanics.",
            image: require('../../assets/onboarding/blockchain.png')
        },
        {
            title: "Play With Real Stakes",
            description: "Bet using Solana cryptocurrency and win real rewards. Your winnings are automatically transferred to your wallet.",
            image: require('../../assets/onboarding/crypto-wallet.png')
        },
        {
            title: "Immersive Experience",
            description: "Enjoy beautiful graphics and engaging sound effects that bring the game to life.",
            image: require('../../assets/onboarding/audio-visual.png')
        },
        {
            title: "Ready to Play?",
            description: "Create or connect your wallet and start playing instantly against opponents from around the world!",
            image: require('../../assets/onboarding/get-started.png')
        }
    ];
    
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
            
            {/* Skip button */}
            <Pressable style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            
            {/* Step indicators */}
            <View style={styles.stepIndicators}>
                {steps.map((_, index) => (
                    <View 
                        key={index} 
                        style={[
                            styles.stepDot,
                            step === index && styles.currentStepDot
                        ]} 
                    />
                ))}
            </View>
            
            {/* Content */}
            <Animated.View style={[styles.contentContainer, animatedStyle]}>
                <Image 
                    source={steps[step].image} 
                    style={styles.image} 
                    resizeMode="contain" 
                />
                
                <Text style={styles.title}>{steps[step].title}</Text>
                <Text style={styles.description}>{steps[step].description}</Text>
            </Animated.View>
            
            {/* Navigation buttons */}
            <View style={styles.buttonsContainer}>
                {step > 0 && (
                    <GradientButton 
                        title="Previous" 
                        onPress={() => setStep(step - 1)}
                        colors={['#6c757d', '#495057']}
                        style={styles.navigationButton}
                    />
                )}
                
                {step < steps.length - 1 ? (
                    <GradientButton 
                        title="Next" 
                        onPress={() => setStep(step + 1)} 
                        style={styles.navigationButton}
                    />
                ) : (
                    <GradientButton 
                        title="Get Started" 
                        onPress={handleComplete} 
                        style={styles.navigationButton}
                    />
                )}
            </View>
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
    skipButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        padding: 10,
    },
    skipText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    soundButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 10,
        zIndex: 10,
    },
    stepIndicators: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    stepDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 5,
    },
    currentStepDot: {
        backgroundColor: 'white',
        width: 14,
        height: 14,
        borderRadius: 7,
        marginTop: -2,
    },
    contentContainer: {
        alignItems: 'center',
        maxWidth: 500,
    },
    image: {
        width: 200,
        height: 200,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        color: 'white',
        textAlign: 'center',
        opacity: 0.9,
        lineHeight: 24,
        marginBottom: 30,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 400,
        marginTop: 20,
    },
    navigationButton: {
        flex: 1,
        marginHorizontal: 10,
    },
});

export default OnboardingScreen; 