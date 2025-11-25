// src/ui/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../RootNavigator';
import { COLORS } from './colors';
import { Video } from 'expo-av';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;

export default function HomeScreen({ navigation }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const scale = Math.max(
    screenWidth / VIDEO_WIDTH,
    screenHeight / VIDEO_HEIGHT
  );

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <Video
          source={require('../../../assets/videos/landing-bg.mp4')}
          style={[styles.video, { transform: [{ scale }] }]}
          isLooping
          shouldPlay
          isMuted
        />
      </View>

      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.title}>Parking Pal</Text>
        <Text style={styles.subtitle}>Find campus parking fast.</Text>

        <Pressable style={[styles.cta, { backgroundColor: '#808080' }]} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.ctaText}>Open Map</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  videoWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  video: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
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
