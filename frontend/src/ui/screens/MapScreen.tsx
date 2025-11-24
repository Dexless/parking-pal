// src/app/screens/MapScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { LOTS } from '../data/campusLots';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../RootNavigator';
import { COLORS } from './colors';
import CampusStreets from '../../../assets/images/Campus_streets.svg';
import CampusLots from '../../../assets/images/Campus_lots.svg';
import { useWindowDimensions } from 'react-native';


//Create a function that gets all lot crowd states from the API and create a dict of lot ID to crowd state.
async function fetchLotFullnessPercentages() {
  try {
    const response = await fetch('http://localhost:8000/lots_percent_full');
    const data: string[] = await response.json();
    const lotPercentDict: { [key: number]: string } = {};
    data.forEach((percent, index) => {
      lotPercentDict[index] = percent;
    });
    console.log("Lot Fullness Percentages Dictionary:", lotPercentDict);
    return lotPercentDict;
  } catch (error) {
    console.error("Error fetching lot fullness percentages:", error);
  }
}



// Call the function fetchLotFullnessPercentages to fetch and log the lot fullness percentages when the module is loaded and color each button accordingly.
const STATE_RGB: Record<string, [number, number, number]> = {
  EMPTY: [61, 133, 198],   // #3d85c6
  LIGHT: [106, 168, 79],   // #6aa84f
  MEDIUM: [241, 194, 50],  // #f1c232
  HEAVY: [230, 145, 56],   // #e69138
  FULL: [204, 0, 0],       // #cc0000
};

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lotStates, setLotStates] = useState<{ [key: number]: string }>({});

  const { width, height } = useWindowDimensions();
  const MAP_ASPECT = 1692 / 1306;


  const horizontalPadding = 12 * 2;
  const verticalPadding = 12 * 2 + 60;
  
  const maxWidth = width - horizontalPadding;
  const maxHeight = height - verticalPadding;
  let frameWidth = maxWidth;
  let frameHeight = frameWidth / MAP_ASPECT;
  
  if (frameHeight > maxHeight) {
    frameHeight = maxHeight;
    frameWidth = frameHeight * MAP_ASPECT;
  }

  useEffect(() => {
    fetchLotFullnessPercentages().then(dict => {
      if (dict) setLotStates(dict);
    });
  }, []);

//Add the svg layer but fix the issue where importing the svg turns the whole screen white.

  return (
    <View style={styles.root}>
      <View style={styles.frame}>
        <CampusStreets width="100%" height="100%" />
        <CampusLots
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <View style={StyleSheet.absoluteFill}>
          {LOTS.map(({ id, name, x, y, w, h }) => {
            const state = lotStates[id];

            let backgroundColor = 'rgba(0,123,255,0.28)';
            let borderColor = 'rgba(0,123,255,0.75)';

            if (state && STATE_RGB[state]) {
              const [r, g, b] = STATE_RGB[state];
              backgroundColor = `rgba(${r},${g},${b},0.28)`;
              borderColor = `rgba(${r},${g},${b},0.75)`;
            }

            return (
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
                    backgroundColor,
                    borderColor,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '100%',
    aspectRatio: 1692 / 1306,
    alignSelf: 'center',
    position: 'relative',  
  },
  img: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  block: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 4,
  },
});