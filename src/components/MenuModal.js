import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { LinearGradient } from 'expo-linear-gradient';
import { resetAndNavigate } from '../helpers/NavigationUtil';
import { useDispatch } from 'react-redux';
import { resetGame } from '../redux/reducers/gameSlice';
import { playSound } from '../helpers/SoundUtility';
import { Colors, Theme } from '../constants/Colors';
import { RFValue } from 'react-native-responsive-fontsize';
import GradientButton from './GradientButton';
import SettingsModal from './SettingsModal';

const MenuModal = ({ visible, onPressHide }) => {
  const dispatch = useDispatch();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleNewGame = () => {
    playSound('ui');
    dispatch(resetGame());
    onPressHide();
    playSound('game_start');
  };

  const handleHome = () => {
    playSound('ui');
    dispatch(resetGame());
    onPressHide();
    resetAndNavigate('HomeScreen');
  };

  const handleBet = () => {
    playSound('ui');
    onPressHide();
    resetAndNavigate('BetSelectionScreen', { playerCount: 2 });
  };

  const handleSettings = () => {
    playSound('ui');
    setSettingsVisible(true);
  };

  const handleHelp = () => {
    playSound('ui');
    Alert.alert(
      "How to Play", 
      "1. Roll the dice to get started\n" +
      "2. Get a 6 to move a piece out of your base\n" +
      "3. Move your pieces around the board\n" +
      "4. Capture opponent pieces by landing on them\n" +
      "5. Get all four pieces to your home to win!\n\n" +
      "Key Rules:\n" +
      "• Rolling a 6 gives you an extra turn\n" +
      "• Three consecutive 6s will forfeit your turn\n" +
      "• Land exactly on the final space to finish",
      [{ text: "OK", onPress: () => console.log("OK Pressed") }]
    );
  };

  const handleResume = () => {
    playSound('ui');
    onPressHide();
  };

  const renderMenuButton = (title, onPress, colors = ['#4facfe', '#00f2fe']) => (
    <GradientButton
      title={title}
      onPress={onPress}
      colors={colors}
      style={styles.menuButton}
    />
  );

  return (
    <>
      <Modal
        isVisible={visible}
        onBackdropPress={onPressHide}
        backdropOpacity={0.6}
        animationIn="fadeIn"
        animationOut="fadeOut"
        useNativeDriver={true}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1E5162', '#2c3e50']}
            style={styles.gradient}>
            <Text style={styles.title}>Menu</Text>
            <View style={styles.buttonsContainer}>
              {renderMenuButton("Resume Game", handleResume)}
              {renderMenuButton("New Game", handleNewGame)}
              {renderMenuButton("Play with Bet", handleBet, ['#ff9a9e', '#fad0c4'])}
              {renderMenuButton("Settings", handleSettings)}
              {renderMenuButton("How to Play", handleHelp)}
              {renderMenuButton("Main Menu", handleHome, ['#d4fc79', '#96e6a1'])}
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    width: '80%',
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.medium,
    alignItems: 'center',
    ...Theme.shadows.medium,
  },
  title: {
    fontSize: RFValue(24),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.l,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  menuButton: {
    width: '100%',
    marginBottom: Theme.spacing.s,
  },
});

export default MenuModal;
