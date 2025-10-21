import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/ui/RootNavigator'; // or './src/ui/RootNavigator' if you rename

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
