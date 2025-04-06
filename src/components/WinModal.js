import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Modal from 'react-native-modal';
import LottieView from 'lottie-react-native';
import { Colors, Theme } from '../constants/Colors';
import { deviceHeight, deviceWidth } from '../constants/Scaling';
import { playSound } from '../helpers/SoundUtility';
import { useDispatch } from 'react-redux';
import { resetGame, announceWinner } from '../redux/reducers/gameSlice';
import { resetAndNavigate } from '../helpers/NavigationUtil';
import GradientButton from './GradientButton';
import Pile from './Pile';
import { colorPlayer } from '../helpers/PlotData';

const WinModal = ({ winner }) => {
  const dispatch = useDispatch();
  const fireworksAnimation = useRef(null);
  const trophyAnimation = useRef(null);
  const scale = useRef(new Animated.Value(0)).current;
  
  // Get player color based on winner number
  const getPlayerColor = () => {
    switch(winner) {
      case 1: return Colors.red;
      case 2: return Colors.green;
      case 3: return Colors.yellow;
      case 4: return Colors.blue;
      default: return Colors.primary;
    }
  };

  // Get player name based on winner number
  const getPlayerName = () => {
    switch(winner) {
      case 1: return 'Red';
      case 2: return 'Green';
      case 3: return 'Yellow';
      case 4: return 'Blue';
      default: return 'Unknown Player';
    }
  };

  useEffect(() => {
    // Play victory sound and animations
    playSound('cheer');
    
    // Start the trophy animation
    if (trophyAnimation.current) {
      trophyAnimation.current.play();
    }
    
    // Start the fireworks animation
    if (fireworksAnimation.current) {
      fireworksAnimation.current.play();
    }
    
    // Animate the modal content
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.2,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
  }, []);

  const handlePlayAgain = () => {
    dispatch(resetGame());
    dispatch(announceWinner(null));
    playSound('game_start');
  };

  const handleMainMenu = () => {
    dispatch(resetGame());
    dispatch(announceWinner(null));
    resetAndNavigate('HomeScreen');
  };

  return (
    <Modal isVisible={true} backdropOpacity={0.7} useNativeDriver={true}>
      <Animated.View 
        style={[styles.container, { transform: [{ scale }] }]}
      >
        <LottieView
          ref={fireworksAnimation}
          source={require('../assets/animation/firework.json')}
          style={styles.fireworks}
          autoPlay
          loop
          resizeMode="cover"
        />
        
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <LottieView
              ref={trophyAnimation}
              source={require('../assets/animation/trophy.json')}
              style={styles.trophy}
              autoPlay
            />
          </View>
          
          <View style={styles.messageContainer}>
            <Text style={styles.congratsText}>Congratulations!</Text>
            <Text style={[styles.winnerText, { color: getPlayerColor() }]}>
              {getPlayerName()} Wins!
            </Text>
          </View>
          
          <View style={styles.pileContainer}>
            <Pile player={winner} color={colorPlayer[winner - 1]} />
          </View>
          
          <View style={styles.buttonsContainer}>
            <GradientButton 
              title="Play Again" 
              onPress={handlePlayAgain}
              colors={['#4facfe', '#00f2fe']}
              style={styles.button}
            />
            <GradientButton 
              title="Main Menu" 
              onPress={handleMainMenu}
              colors={['#f5f7fa', '#c3cfe2']}
              textStyle={{color: '#333'}}
              style={styles.button}
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireworks: {
    width: deviceWidth,
    height: deviceHeight,
    position: 'absolute',
    zIndex: -1,
  },
  contentContainer: {
    backgroundColor: 'rgba(24, 24, 24, 0.95)',
    borderRadius: Theme.borderRadius.large,
    width: deviceWidth * 0.85,
    padding: Theme.spacing.l,
    alignItems: 'center',
    ...Theme.shadows.large,
  },
  headerContainer: {
    marginTop: -60,
    marginBottom: 20,
    alignItems: 'center',
  },
  trophy: {
    width: 150,
    height: 150,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: 10,
  },
  winnerText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pileContainer: {
    width: 90,
    height: 40,
    marginBottom: 20,
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default WinModal;
