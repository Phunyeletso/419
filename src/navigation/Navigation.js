import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LudoBoardScreen from '../screens/LudoBoardScreen';
import HomeScreen from '../screens/HomeScreen';
import SplashScreen from '../screens/SplashScreen';
import BetSelectionScreen from '../screens/BetSelectionScreen';
import WalletEntryScreen from '../screens/WalletEntryScreen';
import WalletScreen from '../screens/WalletScreen';
import SendScreen from '../screens/SendScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import { navigationRef } from '../helpers/NavigationUtil';

const Stack = createNativeStackNavigator();

function Navigation() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="BetSelectionScreen" component={BetSelectionScreen} />
        <Stack.Screen name="WalletEntryScreen" component={WalletEntryScreen} />
        <Stack.Screen name="WalletScreen" component={WalletScreen} />
        <Stack.Screen name="SendScreen" component={SendScreen} />
        <Stack.Screen name="ReceiveScreen" component={ReceiveScreen} />
        <Stack.Screen
          name="LudoBoardScreen"
          component={LudoBoardScreen}
          options={{ animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;


