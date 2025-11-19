// src/app/screens/MapScreen.tsx
import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { LOTS } from '../data/campusLots';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../RootNavigator';

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.root}>
      <View style={styles.frame}>
        <Image
          source={require('../../../assets/images/campus-map.png')}
          style={styles.img}
        />
        <View style={StyleSheet.absoluteFill}>
          {LOTS.map(({ id, name, x, y, w, h }) => (
            <Pressable
              key={id}
              onPress={() => navigation.navigate('LotDetails', { lotId: id })}
              accessibilityLabel={name}
              style={[
                styles.block,
                {
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  width: `${w * 100}%`,
                  height: `${h * 100}%`,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 12 },
  frame: { width: '100%', aspectRatio: 1692 / 1306, alignSelf: 'center' },
  img: { width: '100%', height: '100%', borderRadius: 8 },
  // Blue overlay that still lets the green lots show through:
  block: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,123,255,0.75)',
    backgroundColor: 'rgba(0,123,255,0.28)',
    borderRadius: 4,
  },
});
