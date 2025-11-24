// src/app/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../RootNavigator';
import { COLORS } from './colors'; // adjust path if colors.ts is elsewhere

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 Parking Pal</Text>
      <Text style={styles.subtitle}>Find campus parking fast.</Text>

      <Pressable style={styles.cta} onPress={() => navigation.navigate('Map')}>
        <Text style={styles.ctaText}>Open Map</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.bg, // dark grey background
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary, // bright text
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textSecondary, // softer grey text
  },
  cta: {
    marginTop: 24,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
