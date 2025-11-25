// src/app/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import LotDetailsScreen from './screens/LotDetailsScreen';
import { COLORS } from './screens/colors';

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  LotDetails: { lotId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
// make the root navigator with three screens: Home, Map, LotDetails, lot details has a dropdown param of lotId
export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.bg,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          color: '#ffffff',
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Parking Pal' }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Campus Map' }}
      />
      <Stack.Screen
        name="LotDetails"
        component={LotDetailsScreen}
        options={{ title: 'Lot Details' }}
      />
    </Stack.Navigator>
  );
}
