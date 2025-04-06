import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Animated as RnAnimated } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { deviceHeight, deviceWidth } from '../constants/Scaling';
import { Colors } from '../constants/Colors';
import { Plot1Data, Plot2Data, Plot3Data, Plot4Data } from '../helpers/PlotData';
import Pocket from '../components/Pocket';
import VerticalPath from '../components/path/VerticalPath';
import HorizontalPath from '../components/path/HorizontalPath';
import FourTriangles from '../components/FourTriangles';
import Wrapper from '../components/Wrapper';
import MenuIcon from '../assets/images/menu.png';
import MenuModal from '../components/MenuModal';
import WinModal from '../components/WinModal';
import { playSound, stopSound } from '../helpers/SoundUtility';
import {
  selectDiceTouch,
  selectPlayer1,
  selectPlayer2,
  selectPlayer3,
  selectPlayer4,
  selectCurrentPositions
} from '../redux/reducers/gameSelectors';
import { rehydrateWallet } from '../solana/solanaWallet';
import { rollDice } from '../solana/solanaClient';
import { selectWallet } from '../redux/reducers/walletSlice';
import { Connection, PublicKey } from '@solana/web3.js';
import { SafeAreaView } from 'react-native-safe-area-context';
import TokenOnBoard from '../components/TokenOnBoard';

const LudoBoardScreen = ({ route }) => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { gameId } = route.params || {};
  const player1 = useSelector(selectPlayer1);
  const player2 = useSelector(selectPlayer2);
  const player3 = useSelector(selectPlayer3);
  const player4 = useSelector(selectPlayer4);
  const walletData = useSelector(selectWallet);

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showStartImage, setShowStartImage] = useState(false);
  const opacity = useRef(new RnAnimated.Value(1)).current;

  useEffect(() => {
    async function initializeWallet() {
      if (walletData) {
        const rehydrated = await rehydrateWallet(walletData);
        setWallet(rehydrated);
      }
    }
    initializeWallet();
  }, [walletData]);

  useEffect(() => {
    if (isFocused) {
      setShowStartImage(true);
      const blinkAnimation = RnAnimated.loop(
        RnAnimated.sequence([
          RnAnimated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          RnAnimated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();
      const timeout = setTimeout(() => {
        blinkAnimation.stop();
        setShowStartImage(false);
      }, 2500);
      return () => {
        blinkAnimation.stop();
        clearTimeout(timeout);
      };
    }
  }, [isFocused]);

  const handleMenuPress = useCallback(() => {
    playSound('ui');
    setMenuVisible(true);
  }, []);

  return (
    <Wrapper>
      <TouchableOpacity
        onPress={handleMenuPress}
        style={styles.menuButton}>
        <Image source={MenuIcon} style={{ width: 30, height: 30 }} />
      </TouchableOpacity>

      <View style={styles.container}>
        <View style={styles.flexRow} pointerEvents={loading ? 'none' : 'auto'}>
          {/* Dice placeholders */}
          <Text style={styles.diceText}>Dice Area</Text>
        </View>

        <View style={styles.ludoBoard}>
          <View style={styles.plotContainer}>
            <Pocket color={Colors.green} player={2} data={player2} />
            <VerticalPath cells={Plot2Data} color={Colors.yellow} />
            <Pocket color={Colors.yellow} player={3} data={player3} />
          </View>
          <View style={styles.pathContainer}>
            <HorizontalPath cells={Plot1Data} color={Colors.green} />
            <FourTriangles
              player1={player1}
              player2={player2}
              player3={player3}
              player4={player4}
            />
            <HorizontalPath cells={Plot3Data} color={Colors.blue} />
          </View>
          <View style={styles.plotContainer}>
            <Pocket color={Colors.red} data={player1} player={1} />
            <VerticalPath cells={Plot4Data} color={Colors.red} />
            <Pocket color={Colors.blue} data={player4} player={4} />
          </View>

          <TokenOnBoard />
        </View>
      </View>

      {showStartImage && (
        <RnAnimated.Image
          source={require('../assets/images/start.png')}
          style={{
            width: deviceWidth * 0.5,
            height: deviceWidth * 0.2,
            position: 'absolute',
            opacity,
          }}
        />
      )}

      {menuVisible && (
        <MenuModal
          onPressHide={() => setMenuVisible(false)}
          visible={menuVisible}
        />
      )}

      <WinModal />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    height: deviceHeight * 0.5,
    width: deviceWidth,
  },
  ludoBoard: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    padding: 10,
  },
  flexRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 30,
  },
  plotContainer: {
    width: '100%',
    height: '40%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    backgroundColor: '#ccc',
  },
  pathContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '20%',
    justifyContent: 'space-between',
    backgroundColor: '#1E5162',
  },
  menuButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 20,
  },
  diceText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
});

export default LudoBoardScreen;




