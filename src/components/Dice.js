import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Text,
} from 'react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundImage } from '../helpers/GetIcons';
import {
  enableCellSelection,
  enablePileSelection,
  updateDiceNo,
  updatePlayerChance,
} from '../redux/reducers/gameSlice';
import Arrow from '../assets/images/arrow.png';
import LottieView from 'lottie-react-native';
import DiceRoll from '../assets/animation/diceroll.json';
import { playSound } from '../helpers/SoundUtility';
import {
  selectCurrentPlayerChance,
  selectDiceNo,
  selectDiceRolled,
} from '../redux/reducers/gameSelectors';

const Dice = React.memo(({ color, rotate, player, data }) => {
  const dispatch = useDispatch();
  const currentPlayerChance = useSelector(selectCurrentPlayerChance);
  const isDiceRolled = useSelector(selectDiceRolled);
  const diceNo = useSelector(selectDiceNo);
  const playerPieces = useSelector(
    state => state.game[`player${currentPlayerChance}`],
  );
  const pileIcon = BackgroundImage.GetImage(color);
  const diceIcon = BackgroundImage.GetImage(diceNo);
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Create animated values
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [diceRolling, setDiceRolling] = useState(false);

  // Animate the dice when it's this player's turn
  useEffect(() => {
    if (currentPlayerChance === player) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation when not this player's turn
      scaleAnim.setValue(1);
    }
  }, [currentPlayerChance, player, scaleAnim]);

  useEffect(() => {
    const animateArrow = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowAnim, {
            toValue: 10,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: -10,
            duration: 400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };
    animateArrow();
  }, [currentPlayerChance, isDiceRolled]);

  const handleDicePress = useCallback(async () => {
    const newDiceNo = Math.floor(Math.random() * 6) + 1;
    playSound('dice_roll');
    setDiceRolling(true);
    await delay(800);
    dispatch(updateDiceNo({ diceNo: newDiceNo }));
    setDiceRolling(false);

    const isAnyPieceAlive = data?.findIndex(i => i.pos != 0 && i.pos != 57);
    const isAnyPieceLocked = data?.findIndex(i => i.pos == 0);

    if (isAnyPieceAlive == -1) {
      if (newDiceNo == 6) {
        dispatch(enablePileSelection({ playerNo: player }));
      } else {
        let chancePlayer = player + 1;
        if (chancePlayer > 4) {
          chancePlayer = 1;
        }
        await delay(600);
        dispatch(updatePlayerChance({ chancePlayer: chancePlayer }));
      }
    } else {
      const canMove = playerPieces.some(
        pile => pile.travelCount + newDiceNo <= 57 && pile.pos != 0,
      );
      if (
        (!canMove && newDiceNo == 6 && isAnyPieceLocked == -1) ||
        (!canMove && newDiceNo != 6 && isAnyPieceLocked != -1) ||
        (!canMove && newDiceNo != 6 && isAnyPieceLocked == -1)
      ) {
        let chancePlayer = player + 1;
        if (chancePlayer > 4) {
          chancePlayer = 1;
        }
        await delay(600);
        dispatch(updatePlayerChance({ chancePlayer: chancePlayer }));
        return;
      }

      if (newDiceNo == 6) {
        dispatch(enablePileSelection({ playerNo: player }));
      }
      dispatch(enableCellSelection({ playerNo: player }));
    }
  }, [data, dispatch, player, playerPieces]);

  const getPlayerLabel = useCallback(() => {
    switch(player) {
      case 1: return 'Red';
      case 2: return 'Green';
      case 3: return 'Yellow';
      case 4: return 'Blue';
      default: return 'Player';
    }
  }, [player]);

  return (
    <View style={[styles.container, { transform: [{ scaleX: rotate ? -1 : 1 }] }]}>
      <View style={styles.flexRow}>
        <View style={styles.playerContainer}>
          <Text style={[styles.playerText, { color: color }]}>{getPlayerLabel()}</Text>
          {currentPlayerChance === player && (
            <Text style={styles.turnIndicator}>Current Turn</Text>
          )}
        </View>
        
        <View style={styles.diceArea}>
          <View style={styles.border1}>
            <LinearGradient
              style={styles.linearGradient}
              colors={['#0052be', '#5f9fcb', '#97c6c9']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}>
              <View style={styles.pileContainer}>
                <Image source={pileIcon} style={styles.pileIcon} />
              </View>
            </LinearGradient>
          </View>
          <View style={styles.border2}>
            <LinearGradient
              style={styles.diceGradient}
              colors={['#f5f5f5', '#e0e0e0', '#d4d4d4']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}>
              <Animated.View 
                style={[styles.diceContainer, 
                  {transform: [{scale: currentPlayerChance === player ? scaleAnim : 1}]}
                ]}
              >
                {currentPlayerChance == player ? (
                  <>
                    {diceRolling ? null : (
                      <TouchableOpacity
                        disabled={isDiceRolled}
                        activeOpacity={0.4}
                        onPress={handleDicePress}>
                        <Image source={diceIcon} style={styles.dice} />
                      </TouchableOpacity>
                    )}
                  </>
                ) : null}
              </Animated.View>
            </LinearGradient>
          </View>
          {currentPlayerChance === player && !isDiceRolled ? (
            <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
              <Image source={Arrow} style={{ width: 50, height: 30 }} />
            </Animated.View>
          ) : null}
        </View>
      </View>
      
      {currentPlayerChance === player && diceRolling ? (
        <LottieView
          source={DiceRoll}
          style={styles.rollingDice}
          loop={false}
          autoPlay
          cacheComposition={true}
          hardwareAccelerationAndroid
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 5,
    alignItems: 'center',
  },
  flexRow: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  playerContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  playerText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  turnIndicator: {
    fontSize: 12,
    color: '#ffffff',
    backgroundColor: '#444444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  diceArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pileIcon: {
    width: 35,
    height: 35,
  },
  diceContainer: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 12,
    width: 60,
    height: 60,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pileContainer: {
    paddingHorizontal: 3,
  },
  linearGradient: {
    padding: 1,
    borderWidth: 2,
    borderRightWidth: 0,
    borderColor: '#f0ce2c',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  dice: {
    height: 50,
    width: 50,
  },
  rollingDice: {
    height: 100,
    width: 100,
    zIndex: 99,
    position: 'absolute',
    top: 10,
    right: 40,
  },
  diceGradient: {
    borderWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#f0ce2c',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  border1: {
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 4,
  },
  border2: {
    padding: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default Dice;