// src/ui/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../RootNavigator';
import { COLORS } from './colors';
import { Video } from 'expo-av';
import { useEffect, useState } from 'react';
import { randomize_all_lot_events } from '../../api/lotApi';
import { getLang, setLang as saveLang } from "../../langSave";

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;

export default function HomeScreen({ navigation }: Props) {
    // translations for spanish
    const [lang, setLang] = useState<"en" | "es">(getLang());
    // save selection
    function changeLang(newLang: "en" | "es") {
      saveLang(newLang);   // update global
      setLang(newLang);    // update screen UI
    }
    
    // text translations
    const text = {
      title: lang === "en" ? "Parking Pal" : "Parking Pal",
      subtitle: lang === "en" ? "Find campus parking fast." : "Encuentra estacionamiento rápidamente.",
      openMap: lang === "en" ? "Open Map" : "Abrir Mapa",
    };

    useEffect(() => {
    async function init() {
      try {
        await randomize_all_lot_events(-1, true);
      } catch (err) {
        console.error("Failed to randomize lots on app start", err);
      }
    }

    init();
  }, []);

  //Hide header
  useEffect(() => {
      navigation.setOptions({
        headerShown: false,
      });
    }, [navigation]);

  // Calculate scale to cover the entire screen
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Calculate scale to cover the entire screen DO NOT CHANGE THE VIDEO WIDTH AND HEIGHT VARIABLES
  const scale = Math.max(
    screenWidth / VIDEO_WIDTH,
    screenHeight / VIDEO_HEIGHT
  );

  // Render
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
        
        <View style={{ flexDirection: "row", justifyContent: "center", width: "100%", gap: 8 }}>
          <Pressable onPress={() => changeLang("en")} style={{ padding: 6, backgroundColor: "#333", borderRadius: 6 }}>
            <Text style={{ color: "white" }}>EN</Text>
          </Pressable>

          <Pressable onPress={() => changeLang("es")} style={{ padding: 6, backgroundColor: "#333", borderRadius: 6 }}>
            <Text style={{ color: "white" }}>ES</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.subtitle}>{text.subtitle}</Text>

        <Pressable style={[styles.cta, { backgroundColor: '#808080' }]} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.ctaText}>{text.openMap}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Styles
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
