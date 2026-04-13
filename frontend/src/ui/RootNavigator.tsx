// src/app/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import LotDetailsScreen from './screens/LotDetailsScreen';
import LoginScreen from './screens/LoginScreen';
import { COLORS } from './screens/colors';
import ProfileTag from './ProfileTag';
import StackBackButton from './StackBackButton';
import { VehicleEventNotificationProvider } from './VehicleEventNotification';

// Define the type for the root stack parameters
export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  Login: undefined;
  Lotinfo: undefined;
  LotDetails: { lotId: number };
};

// Create the native stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();
export default function RootNavigator() {
  return (
    <VehicleEventNotificationProvider>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: {
            backgroundColor: COLORS.bg,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            color: '#ffffff',
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerRight: () => <ProfileTag navigation={navigation} variant="header" />,
        })}
      >
        <Stack.Screen // Home screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Parking Pal' }}
        />
        <Stack.Screen // Map screen
          name="Map"
          component={MapScreen}
          options={({ navigation }) => ({
            title: 'Campus Map',
            headerLeft: () => (
              <StackBackButton navigation={navigation} fallbackRoute="Home" />
            ),
          })}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={({ navigation }) => ({
            title: 'Login',
            headerLeft: () => (
              <StackBackButton navigation={navigation} fallbackRoute="Home" />
            ),
          })}
        />
        <Stack.Screen // Lot details screen
          name="LotDetails"
          component={LotDetailsScreen}
          options={({ navigation }) => ({
            title: 'Lot Details',
            headerLeft: () => (
              <StackBackButton navigation={navigation} fallbackRoute="Map" />
            ),
          })}
        />
      </Stack.Navigator>
    </VehicleEventNotificationProvider>
  );
}
