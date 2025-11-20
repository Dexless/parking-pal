// src/app/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import LotDetailsScreen from './screens/LotDetailsScreen';

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  LotDetails: { lotId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Parking Pal' }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Campus Map' }} />
      <Stack.Screen name="LotDetails" component={LotDetailsScreen} options={{ title: 'Lot Details' }} />
    </Stack.Navigator>
  );
}
