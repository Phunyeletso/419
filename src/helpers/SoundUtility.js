import { Audio } from 'expo-av';

// Track the currently playing background sound
let currentBackgroundSound = null;
let backgroundSoundName = '';

// Play a one-time sound effect
export const playSound = async (soundName) => {
  try {
    // Skip if it's a background music that's already playing
    if (isBackgroundMusic(soundName) && backgroundSoundName === soundName && currentBackgroundSound) {
      return;
    }

    const soundPath = getSoundPath(soundName);
    
    // If it's background music, handle differently
    if (isBackgroundMusic(soundName)) {
      // Stop any currently playing background music
      await stopBackgroundMusic();
      
      // Create and play the new background music
      const { sound } = await Audio.Sound.createAsync(
        soundPath,
        { isLooping: true, volume: 0.5 }
      );
      
      // Save the reference to control it later
      currentBackgroundSound = sound;
      backgroundSoundName = soundName;
      
      await sound.playAsync();
    } else {
      // For regular sound effects
      const { sound } = await Audio.Sound.createAsync(soundPath);
      await sound.playAsync();
      
      // Release one-time sounds when finished
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    }
  } catch (e) {
    console.log(`Cannot play the sound file:`, e);
  }
};

// Stop the currently playing background music
export const stopBackgroundMusic = async () => {
  if (currentBackgroundSound) {
    try {
      await currentBackgroundSound.stopAsync();
      await currentBackgroundSound.unloadAsync();
      currentBackgroundSound = null;
      backgroundSoundName = '';
    } catch (error) {
      console.log('Error stopping background music:', error);
    }
  }
};

// Pause the currently playing background music
export const pauseBackgroundMusic = async () => {
  if (currentBackgroundSound) {
    try {
      await currentBackgroundSound.pauseAsync();
    } catch (error) {
      console.log('Error pausing background music:', error);
    }
  }
};

// Resume the currently playing background music
export const resumeBackgroundMusic = async () => {
  if (currentBackgroundSound) {
    try {
      await currentBackgroundSound.playAsync();
    } catch (error) {
      console.log('Error resuming background music:', error);
    }
  }
};

// Check if the sound is background music
const isBackgroundMusic = (soundName) => {
  return ['home'].includes(soundName);
};

const getSoundPath = (soundName) => {
  switch (soundName) {
    case 'dice_roll':
      return require('../assets/sfx/dice_roll.mp3');
    case 'cheer':
      return require('../assets/sfx/cheer.mp3');
    case 'game_start':
      return require('../assets/sfx/game_start.mp3');
    case 'collide':
      return require('../assets/sfx/collide.mp3');
    case 'home_win':
      return require('../assets/sfx/home_win.mp3');
    case 'pile_move':
      return require('../assets/sfx/pile_move.mp3');
    case 'safe_spot':
      return require('../assets/sfx/safe_spot.mp3');
    case 'ui':
      return require('../assets/sfx/ui.mp3');
    case 'home':
      return require('../assets/sfx/home.mp3');
    case 'girl2':
      return require('../assets/sfx/girl2.mp3');
    case 'girl1':
      return require('../assets/sfx/girl1.mp3');
    case 'girl3':
      return require('../assets/sfx/girl3.mp3');
    default:
      throw new Error(`Sound ${soundName} not found`);
  }
};
