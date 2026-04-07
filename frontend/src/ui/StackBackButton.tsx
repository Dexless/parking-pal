import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './RootNavigator';

type BackRouteName = 'Home' | 'Map' | 'Login';

type Props<RouteName extends keyof RootStackParamList = keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, RouteName>;
  fallbackRoute: BackRouteName;
  label?: string;
};

export default function StackBackButton<RouteName extends keyof RootStackParamList>({
  navigation,
  fallbackRoute,
  label = 'Back',
}: Props<RouteName>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.button}
      onPress={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }

        navigation.navigate(fallbackRoute);
      }}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 4,
  },
  text: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
