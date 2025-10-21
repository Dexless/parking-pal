// src/app/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Parking Pal' }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Campus Map' }} />
    </Stack.Navigator>
  );
}
