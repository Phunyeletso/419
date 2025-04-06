import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  withRepeat,
} from 'react-native-reanimated';
import { playSound } from '../helpers/SoundUtility';

// Home positions for tokens based on player color
const homePositions = {
  red: [
    { top: 30, left: 30 },
    { top: 30, left: 70 },
    { top: 70, left: 30 },
    { top: 70, left: 70 },
  ],
  green: [
    { top: 30, left: 430 },
    { top: 30, left: 470 },
    { top: 70, left: 430 },
    { top: 70, left: 470 },
  ],
  yellow: [
    { top: 430, left: 30 },
    { top: 430, left: 70 },
    { top: 470, left: 30 },
    { top: 470, left: 70 },
  ],
  blue: [
    { top: 430, left: 430 },
    { top: 430, left: 470 },
    { top: 470, left: 430 },
    { top: 470, left: 470 },
  ],
};

// Final positions for tokens
const finalPositions = {
  red: { top: 245, left: 55 },
  green: { top: 55, left: 245 },
  yellow: { top: 245, left: 445 },
  blue: { top: 445, left: 245 },
};

const TokenPiece = ({
  playerId,
  tokenId,
  position,
  isHome,
  isFinished,
  color,
  cellSize,
  selectedToken,
  isMovable,
  onPress,
  boardData,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glow = useSharedValue(0);
  const bounce = useSharedValue(0);

  // Track the previous position to animate transitions
  const [prevPosition, setPrevPosition] = useState(position);
  
  // Determine the token's coordinates on the board
  const getTokenCoordinates = () => {
    if (isHome) {
      // Token is in the home base
      return homePositions[color][tokenId];
    } else if (isFinished) {
      // Token has reached the finish area
      return finalPositions[color];
    } else {
      // Token is on the board path
      // Use the boardData to get the correct position on the board
      const playerStartingPosition = {
        red: 0,
        green: 13,
        yellow: 26,
        blue: 39,
      };

      // Adjust position based on player's starting point
      let adjustedPosition = position;
      if (position >= 0) {
        adjustedPosition = (playerStartingPosition[color] + position) % 52;
      }

      // Get coordinates from board data
      if (boardData && boardData.paths && boardData.paths[adjustedPosition]) {
        return {
          top: boardData.paths[adjustedPosition].y,
          left: boardData.paths[adjustedPosition].x,
        };
      }

      // Fallback if path data is not available
      return { top: 0, left: 0 };
    }
  };

  // Get current coordinates
  const { top, left } = getTokenCoordinates();

  // When position changes, animate the token movement
  useEffect(() => {
    // Only animate if this is not the initial render and position has changed
    if (prevPosition !== position && prevPosition !== undefined) {
      // Trigger a movement animation
      scale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );
      
      // Add a little bounce when token lands
      bounce.value = withSequence(
        withTiming(1, { duration: 10 }),
        withTiming(-5, { duration: 150 }),
        withTiming(0, { duration: 200, easing: Easing.bounce })
      );
      
      // Play a move sound if the token is moving on the board
      if (position >= 0 && prevPosition >= 0) {
        // Moving on the board
        playSound('token_move');
      } else if (prevPosition === -1 && position >= 0) {
        // Coming out of home
        playSound('token_out');
      } else if (position === 59) {
        // Reaching final position
        playSound('token_finish');
      }
    }
    
    // Update previous position
    setPrevPosition(position);
  }, [position]);

  // When selected or movable state changes, animate the token
  useEffect(() => {
    // Highlight tokens that can be moved
    if (isMovable) {
      // Pulsating glow effect for movable tokens
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0, { duration: 800 })
        ),
        -1,  // Infinite repeat
        true // Reverse on each iteration
      );
      
      // Subtle bounce to draw attention
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      // Reset animations if not movable
      glow.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
    }
    
    // Highlight selected token
    if (selectedToken === tokenId && playerId === parseInt(selectedToken / 4)) {
      // Make selected token more prominent
      scale.value = withTiming(1.2, { duration: 200 });
      opacity.value = withTiming(0.9, { duration: 200 });
    } else {
      // Reset if not selected
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [isMovable, selectedToken]);

  // Token animation style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: bounce.value }
      ],
      opacity: opacity.value,
      shadowOpacity: glow.value * 0.8,
      shadowRadius: glow.value * 10,
      elevation: glow.value * 8,
    };
  });

  // Glow animation for movable tokens
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glow.value * 0.6,
      transform: [{ scale: 1 + glow.value * 0.3 }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={!isMovable}
      style={[
        styles.tokenContainer,
        {
          top,
          left,
          width: cellSize * 0.8,
          height: cellSize * 0.8,
          marginTop: -cellSize * 0.4,
          marginLeft: -cellSize * 0.4,
        },
      ]}
    >
      {/* Glow effect for movable tokens */}
      {isMovable && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: color,
              width: cellSize,
              height: cellSize,
              borderRadius: cellSize / 2,
            },
            glowStyle,
          ]}
        />
      )}
      
      {/* The token itself */}
      <Animated.View
        style={[
          styles.token,
          {
            backgroundColor: color,
            width: cellSize * 0.7,
            height: cellSize * 0.7,
            borderRadius: cellSize * 0.35,
          },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.tokenInner,
            {
              width: cellSize * 0.4,
              height: cellSize * 0.4,
              borderRadius: cellSize * 0.2,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tokenContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  token: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 3,
  },
  tokenInner: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  glow: {
    position: 'absolute',
    opacity: 0.5,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
});

export default TokenPiece; 