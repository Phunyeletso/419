import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSequence, 
    withTiming, 
    withSpring,
    withRepeat,
    withDelay,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Dice face configurations for dots
const diceFaces = {
    1: [{ top: '50%', left: '50%' }],
    2: [
        { top: '25%', left: '25%' },
        { top: '75%', left: '75%' }
    ],
    3: [
        { top: '25%', left: '25%' },
        { top: '50%', left: '50%' },
        { top: '75%', left: '75%' }
    ],
    4: [
        { top: '25%', left: '25%' },
        { top: '25%', left: '75%' },
        { top: '75%', left: '25%' },
        { top: '75%', left: '75%' }
    ],
    5: [
        { top: '25%', left: '25%' },
        { top: '25%', left: '75%' },
        { top: '50%', left: '50%' },
        { top: '75%', left: '25%' },
        { top: '75%', left: '75%' }
    ],
    6: [
        { top: '25%', left: '25%' },
        { top: '25%', left: '50%' },
        { top: '25%', left: '75%' },
        { top: '75%', left: '25%' },
        { top: '75%', left: '50%' },
        { top: '75%', left: '75%' }
    ]
};

const DiceRoll = ({ value, isRolling, canRoll, onRoll }) => {
    // Animation values
    const rotate = useSharedValue(0);
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    
    // Reset animations when rolling state changes
    useEffect(() => {
        if (isRolling) {
            // Cancel any ongoing animations
            cancelAnimation(rotate);
            cancelAnimation(scale);
            cancelAnimation(translateY);
            cancelAnimation(translateX);
            
            // Start rolling animations
            rotate.value = withRepeat(
                withTiming(2 * Math.PI, { duration: 300, easing: Easing.linear }), 
                -1, // infinite
                false
            );
            
            scale.value = withSequence(
                withTiming(1.2, { duration: 150 }),
                withRepeat(
                    withSequence(
                        withTiming(0.9, { duration: 100 }),
                        withTiming(1.1, { duration: 100 })
                    ),
                    -1,
                    true
                )
            );
            
            // Random bouncing effect
            translateY.value = withRepeat(
                withSequence(
                    withTiming(-10, { duration: 200 }),
                    withTiming(5, { duration: 200 }),
                    withTiming(-8, { duration: 150 }),
                    withTiming(0, { duration: 150 })
                ),
                -1,
                true
            );
            
            translateX.value = withRepeat(
                withSequence(
                    withTiming(8, { duration: 150 }),
                    withTiming(-5, { duration: 150 }),
                    withTiming(3, { duration: 100 }),
                    withTiming(0, { duration: 100 })
                ),
                -1,
                true
            );
        } else if (value > 0) {
            // Stop rolling and show result
            rotate.value = withTiming(0, { duration: 300 });
            scale.value = withSequence(
                withTiming(1.5, { duration: 300 }),
                withTiming(1, { duration: 300 })
            );
            translateY.value = withTiming(0, { duration: 300 });
            translateX.value = withTiming(0, { duration: 300 });
        } else {
            // Reset to default state
            rotate.value = withTiming(0, { duration: 300 });
            scale.value = withTiming(1, { duration: 300 });
            translateY.value = withTiming(0, { duration: 300 });
            translateX.value = withTiming(0, { duration: 300 });
        }
    }, [isRolling, value]);

    // When can roll status changes, add a subtle animation to draw attention
    useEffect(() => {
        if (canRoll) {
            scale.value = withSequence(
                withTiming(1.1, { duration: 200 }),
                withTiming(1, { duration: 200 }),
                withDelay(300, withSequence(
                    withTiming(1.1, { duration: 200 }),
                    withTiming(1, { duration: 200 })
                ))
            );
        }
    }, [canRoll]);

    // Animated styles
    const diceAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { translateY: translateY.value },
                { translateX: translateX.value },
                { rotateZ: `${rotate.value}rad` }
            ]
        };
    });

    // Button animated style
    const buttonAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: canRoll ? withTiming(1, { duration: 300 }) : withTiming(0.5, { duration: 300 }),
            transform: [
                { scale: canRoll ? scale.value : withTiming(0.95, { duration: 300 }) }
            ]
        };
    });

    return (
        <View style={styles.container}>
            {/* Dice */}
            <Animated.View style={[styles.diceContainer, diceAnimatedStyle]}>
                {value > 0 && !isRolling ? (
                    // Show dice with dots
                    <View style={styles.dice}>
                        {diceFaces[value]?.map((position, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        top: position.top,
                                        left: position.left,
                                        transform: [
                                            { translateX: -5 },
                                            { translateY: -5 }
                                        ]
                                    }
                                ]}
                            />
                        ))}
                    </View>
                ) : isRolling ? (
                    // Rolling animation
                    <View style={styles.dice}>
                        <Text style={styles.rollingText}>🎲</Text>
                    </View>
                ) : (
                    // Default state
                    <View style={styles.dice}>
                        <Text style={styles.questionMark}>?</Text>
                    </View>
                )}
            </Animated.View>

            {/* Roll button */}
            <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
                <TouchableOpacity
                    style={[styles.rollButton, !canRoll && styles.disabledButton]}
                    onPress={onRoll}
                    disabled={!canRoll || isRolling}
                >
                    <LinearGradient
                        colors={canRoll ? ['#5253ed', '#272882'] : ['#a0a0a0', '#707070']}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.rollButtonText}>
                            {isRolling ? 'Rolling...' : 'Roll Dice'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* Display roll value as text */}
            {value > 0 && !isRolling && (
                <Text style={styles.valueText}>You rolled: {value}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    diceContainer: {
        marginBottom: 20,
    },
    dice: {
        width: 80,
        height: 80,
        backgroundColor: 'white',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
        position: 'relative',
    },
    dot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#333',
    },
    questionMark: {
        fontSize: 36,
        color: '#999',
    },
    rollingText: {
        fontSize: 36,
    },
    buttonContainer: {
        marginTop: 10,
    },
    rollButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    rollButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    valueText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    }
});

export default DiceRoll; 