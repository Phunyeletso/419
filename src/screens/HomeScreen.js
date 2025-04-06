import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  Text,
  Animated,
  Image,
  StyleSheet,
  Pressable,
  Alert,
  View,
} from 'react-native';
import Wrapper from '../components/Wrapper';
import { deviceHeight, deviceWidth } from '../constants/Scaling';
import Logo from '../assets/images/logo.png';
import GradientButton from '../components/GradientButton';
import WalletButton from '../components/WalletButton';
import { useDispatch, useSelector } from 'react-redux';
import { resetGame } from '../redux/reducers/gameSlice';
import { navigate } from '../helpers/NavigationUtil';
import { playSound, stopBackgroundMusic, pauseBackgroundMusic, resumeBackgroundMusic } from '../helpers/SoundUtility';
import { useIsFocused } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import Witch from '../assets/animation/witch.json';
import { selectCurrentPositions } from '../redux/reducers/gameSelectors';
import { selectWallet, updateWalletBalance } from '../redux/reducers/walletSlice';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentPosition = useSelector(selectCurrentPositions);
  const walletData = useSelector(selectWallet);
  const isFocused = useIsFocused();
  const [walletBalance, setWalletBalance] = useState(null);

  const witchAnim = useRef(new Animated.Value(-deviceWidth)).current;
  const scaleXAnim = useRef(new Animated.Value(-1)).current;

  // Handle background music when the screen comes into focus or loses focus
  useEffect(() => {
    if (isFocused) {
      // Play home music when screen is focused
      playSound('home');
      fetchWalletBalance();
    } else {
      // Pause the music when navigating away (but don't stop it)
      pauseBackgroundMusic();
    }

    // Clean up when component unmounts
    return () => {
      // Nothing to do here - we no longer stop music when unmounting
    };
  }, [isFocused]);

  // Listen for navigation events
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If navigating to the game screen, stop background music completely
      if (e.data.action.type === 'NAVIGATE' && 
          (e.data.action.payload?.name === 'LudoBoardScreen')) {
        stopBackgroundMusic();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const fetchWalletBalance = async () => {
    if (walletData && walletData.publicKey) {
      try {
        await dispatch(updateWalletBalance());
        setWalletBalance(walletData.balance);
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    }
  };

  useEffect(() => {
    if (walletData && walletData.balance !== undefined) {
      setWalletBalance(walletData.balance);
    }
  }, [walletData]);

  useEffect(() => {
    const loopAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(witchAnim, {
              toValue: deviceWidth * 0.02,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleXAnim, {
              toValue: -1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(3000),
          Animated.parallel([
            Animated.timing(witchAnim, {
              toValue: deviceWidth * 2,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleXAnim, {
              toValue: -1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(witchAnim, {
              toValue: -deviceWidth * 0.05,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleXAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(3000),
          Animated.parallel([
            Animated.timing(witchAnim, {
              toValue: -deviceWidth * 2,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleXAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    const cleanupAnimation = () => {
      Animated.timing(witchAnim).stop();
      Animated.timing(scaleXAnim).stop();
    };

    loopAnimation();

    return cleanupAnimation;
  }, [witchAnim, scaleXAnim]);

  const startGame = async (isNew = false) => {
    if (isNew) {
      dispatch(resetGame());
    }
    stopBackgroundMusic(); // Stop music before starting game
    navigate('LudoBoardScreen');
    playSound('game_start');
  };

  // Memoized callbacks
  const handleResumePress = useCallback(() => {
    startGame();
  }, []);

  // Navigate directly to the BetSelectionScreen
  const handleNewGamePress = useCallback(() => {
    navigate('BetSelectionScreen');
  }, []);

  // Navigate to the wallet entry screen
  const handleWalletPress = useCallback(() => {
    navigate('WalletEntryScreen');
  }, []);

  return (
    <Wrapper>
      <View style={styles.container}>
        <Animated.View style={styles.imgContainer}>
          <Image source={Logo} style={styles.img} />
        </Animated.View>

        <View style={styles.buttonContainer}>
          {currentPosition.length !== 0 && (
            <GradientButton 
              title="RESUME" 
              onPress={handleResumePress}
            />
          )}
          <GradientButton 
            title="NEW GAME" 
            onPress={handleNewGamePress}
          />
        </View>

        <WalletButton 
          onPress={handleWalletPress} 
          balance={walletBalance}
        />

        <Animated.View
          style={[
            styles.witchContainer,
            {
              transform: [{ translateX: witchAnim }, { scaleX: scaleXAnim }],
            },
          ]}
        >
          <Pressable
            onPress={() => {
              const random = Math.floor(Math.random() * 3) + 1;
              playSound(`girl${random}`);
            }}
          >
            <LottieView
              hardwareAccelerationAndroid
              source={Witch}
              autoPlay
              speed={1}
              style={styles.witch}
            />
          </Pressable>
        </Animated.View>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  imgContainer: {
    width: deviceWidth * 0.7,
    height: deviceHeight * 0.22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  witchContainer: {
    position: 'absolute',
    top: '70%',
    left: '24%',
  },
  witch: {
    height: 250,
    width: 250,
    transform: [{ rotate: '25deg' }],
  },
});

export default HomeScreen;


