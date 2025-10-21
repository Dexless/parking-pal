// src/app/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../RootNavigator';

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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#1E40AF' },
  subtitle: { marginTop: 8, fontSize: 16, color: '#6B7280' },
  cta: { marginTop: 24, backgroundColor: '#0EA5E9', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
