import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { playSound } from '../helpers/SoundUtility';

const WalletButton = ({ onPress, balance }) => {
  return (
    <View style={styles.container}>
      {balance !== undefined && (
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>{balance} SOL</Text>
        </View>
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          playSound('ui');
          onPress();
        }}
        style={styles.buttonContainer}
      >
        <LinearGradient
          colors={['#5253ed', '#3f4060']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 999,
    alignItems: 'center',
  },
  balanceBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 5,
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WalletButton; 