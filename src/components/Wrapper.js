import React from 'react';
import {ImageBackground, SafeAreaView, StyleSheet, View} from 'react-native';
import {deviceHeight, deviceWidth} from '../constants/Scaling';
import BG from '../assets/images/bg.jpg';

const Wrapper = ({children, style}) => {
  return (
    <ImageBackground 
      source={BG} 
      resizeMode="cover" 
      style={styles.bgImage}
    >
      <View style={styles.container}>
        <SafeAreaView style={[styles.safeArea, style]}>
          {children}
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default Wrapper;
