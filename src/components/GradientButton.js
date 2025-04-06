import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import {
  PlayPauseIcon,
  PlayCircleIcon,
  ComputerDesktopIcon,
  UsersIcon,
  HomeIcon,
} from 'react-native-heroicons/solid';
import { LinearGradient } from 'expo-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import { playSound } from '../helpers/SoundUtility';

const iconSize = RFValue(22);

const GradientButton = ({ 
  title, 
  onPress, 
  iconColor = '#FFFFFF',
  colors = ['#5253ed', '#3f4060'],
  style,
  textStyle
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        playSound('ui');
        onPress();
      }}
      style={[styles.btnContainer, style]}>
      <LinearGradient
        colors={colors}
        style={styles.button}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        {title === 'RESUME' ? (
          <PlayPauseIcon size={iconSize} color={iconColor} />
        ) : title === 'NEW GAME' ? (
          <PlayCircleIcon size={iconSize} color={iconColor} />
        ) : title === 'VS CPU' ? (
          <ComputerDesktopIcon size={iconSize} color={iconColor} />
        ) : title === 'HOME' ? (
          <HomeIcon size={iconSize} color={iconColor} />
        ) : (
          <UsersIcon size={iconSize} color={iconColor} />
        )}
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  btnContainer: {
    borderRadius: 12,
    elevation: 8,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    width: 240,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: RFValue(16),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GradientButton;
