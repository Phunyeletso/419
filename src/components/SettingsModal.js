import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Colors, Theme } from '../constants/Colors';
import { setGameSettings, updateAIDelay } from '../redux/reducers/gameSlice';
import { playSound } from '../helpers/SoundUtility';
import GradientButton from './GradientButton';

const SettingsModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.game.settings);
  
  // Local state for settings form
  const [formData, setFormData] = useState({
    difficulty: settings?.difficulty || 'medium',
    playerCount: settings?.playerCount || 4,
    enableSounds: settings?.enableSounds !== false,
    theme: settings?.theme || 'dark',
    aiDelay: settings?.aiDelay || 1000,
  });

  const difficultyOptions = [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
  ];

  const playerCountOptions = [
    { label: '2 Players', value: 2 },
    { label: '3 Players', value: 3 },
    { label: '4 Players', value: 4 },
  ];

  const themeOptions = [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
  ];

  const handleDifficultyChange = (value) => {
    playSound('ui');
    setFormData(prev => ({ ...prev, difficulty: value }));
  };

  const handlePlayerCountChange = (value) => {
    playSound('ui');
    setFormData(prev => ({ ...prev, playerCount: value }));
  };

  const handleThemeChange = (value) => {
    playSound('ui');
    setFormData(prev => ({ ...prev, theme: value }));
  };

  const handleSoundToggle = () => {
    if (formData.enableSounds) {
      playSound('ui');
    }
    setFormData(prev => ({ ...prev, enableSounds: !prev.enableSounds }));
  };

  const handleSliderChange = (value) => {
    setFormData(prev => ({ ...prev, aiDelay: Math.floor(value) }));
  };

  const handleSave = () => {
    playSound('ui');
    dispatch(setGameSettings({
      difficulty: formData.difficulty,
      playerCount: formData.playerCount,
      enableSounds: formData.enableSounds,
      theme: formData.theme,
    }));
    dispatch(updateAIDelay(formData.aiDelay));
    onClose();
  };

  const renderOptionButtons = (options, selectedValue, onChange) => {
    return (
      <View style={styles.optionsContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selectedValue === option.value && styles.selectedOption,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[
              styles.optionText,
              selectedValue === option.value && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.7}
      onBackdropPress={onClose}
      useNativeDriver={true}
      animationIn="fadeIn"
      animationOut="fadeOut">
      <View style={styles.container}>
        <LinearGradient
          colors={['#1E5162', '#2c3e50']}
          style={styles.gradient}>
          <Text style={styles.title}>Game Settings</Text>
          
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>Difficulty</Text>
            {renderOptionButtons(difficultyOptions, formData.difficulty, handleDifficultyChange)}
          </View>
          
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>Players</Text>
            {renderOptionButtons(playerCountOptions, formData.playerCount, handlePlayerCountChange)}
          </View>
          
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>Theme</Text>
            {renderOptionButtons(themeOptions, formData.theme, handleThemeChange)}
          </View>
          
          <View style={styles.settingSection}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Sound Effects</Text>
              <Switch
                value={formData.enableSounds}
                onValueChange={handleSoundToggle}
                trackColor={{ false: '#767577', true: Colors.accent }}
                thumbColor={formData.enableSounds ? Colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
          
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>
              AI Move Delay: {formData.aiDelay}ms
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={2000}
              step={100}
              value={formData.aiDelay}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={Colors.accent}
              maximumTrackTintColor="#ddd"
              thumbTintColor={Colors.accent}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <GradientButton 
              title="Save" 
              onPress={handleSave} 
              colors={['#4facfe', '#00f2fe']}
              style={styles.button}
            />
            <GradientButton 
              title="Cancel" 
              onPress={onClose}
              colors={['#f5f7fa', '#c3cfe2']}
              textStyle={{color: '#333'}}
              style={styles.button} 
            />
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    width: '90%',
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.medium,
    ...Theme.shadows.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Theme.spacing.l,
  },
  settingSection: {
    marginBottom: Theme.spacing.m,
  },
  sectionTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.xs,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.s,
    marginHorizontal: 4,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.small,
    borderWidth: 1,
    borderColor: Colors.borderSecondary,
  },
  selectedOption: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  selectedOptionText: {
    color: '#333',
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.s,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.m,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default SettingsModal;
