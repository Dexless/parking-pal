// src/app/screens/LotDetailsScreen.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../RootNavigator';
import { LOTS } from '../data/campusLots';
import { fetchLotData, Lot as LotData, randomizeData } from '../../api/lotApi';
import { COLORS } from './colors';
import CampusStreets from '../../../assets/images/Campus_streets.svg';
import CampusLots from '../../../assets/images/Campus_lots.svg';
import CampusLotNames from '../../../assets/images/campus_lot_names.svg';

// Define route prop type for LotDetails screen
type DetailsRoute = RouteProp<RootStackParamList, 'LotDetails'>;

// Aspect ratio of the campus map
const MAP_ASPECT = 1692 / 1306;

type LotZoom = {
  centerX: number; // normalized 0–1 (relative to map width)
  centerY: number; // normalized 0–1 (relative to map height)
  scale: number;
};

// Predefined zooms for each lot ID
const LOT_ZOOMS: Record<number, LotZoom> = {
  0:  { centerX: 0.3401, centerY: 0.4007, scale: 1.8 }, // P1
  1:  { centerX: 0.3401, centerY: 0.4007, scale: 1.8 }, // P2
  2:  { centerX: 0.3401, centerY: 0.4007, scale: 1.8 }, // P3
  3:  { centerX: 0.3401, centerY: 0.3307, scale: 1.8 }, // P5
  4:  { centerX: 0.3401, centerY: 0.2307, scale: 1.8 }, // P6
  5:  { centerX: 0.4701, centerY: 0.1907, scale: 1.8 },  // P9
  7:  { centerX: 0.4701, centerY: 0.1907, scale: 1.8 }, // P11
  9:  { centerX: 0.2722, centerY: 0.17, scale: 2 }, // P15
  10: { centerX: 0.12,   centerY: 0.10,   scale: 1.8 },  // P20
  11: { centerX: 0.1401, centerY: 0.4007, scale: 1.8 },  // P27
};

export default function LotDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailsRoute>();
  const { lotId } = route.params;

  const lot = useMemo(() => LOTS.find(l => l.id === lotId), [lotId]);
  const [lotData, setLotData] = useState<LotData | null>(null);
  const [mapLayout, setMapLayout] = useState<{ width: number; height: number } | null>(null);

  //Fetch lot data from API, if it fails, call randomize endpoint
  useEffect(() => {
    fetchLotData(lotId)
      .then(setLotData)
      .catch(err => {
        randomizeData(lotId)
      });
  }, [lotId]);

  // Handle map layout changes to get width and height
  const handleMapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMapLayout({ width, height });
  };

  const mapTransform = useMemo(() => {
    if (!mapLayout) return undefined;

    const zoom = LOT_ZOOMS[lotId];
    if (!zoom) return undefined;

    const { width, height } = mapLayout;
    const { centerX, centerY, scale } = zoom;

    const cx = centerX * width;
    const cy = centerY * height;

    const tx = width / 2 - scale * cx;
    const ty = height / 2 - scale * cy;

    return [
      { scale },
      { translateX: tx },
      { translateY: ty },
    ];
  }, [mapLayout, lotId]);

  // If lot not found
  if (!lot) {
    return (
      <View style={styles.screen}>
        <View style={styles.leftPane}>
          <Text style={styles.title}>Lot not found</Text>
          <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Define text sizes
  const textSizeSmall = 25;
  const textSizeMedium = 50;
  const textSizeLarge = 70;

  // if lot is found, display details
  return (
    <View style={styles.screen}>
      <View style={styles.leftPane}>
        <Text style={[styles.title, { fontSize: textSizeLarge }]}>{lot.name}</Text>

        <View style={styles.card}>
          <Text style={styles.h}>Status</Text>

          {lotData ? (
            <>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>
                Open spots: {lotData.total_capacity - lotData.current}
              </Text>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>
                Capacity: {lotData.total_capacity}
              </Text>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>
                Currently parked: {lotData.current}
              </Text>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>
                Percent full: {lotData.percent_full}%
              </Text>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>
                Crowd: {lotData.state}
              </Text>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>
                Hours: {lotData.hours}
              </Text>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>
                Type: {lotData.type}
              </Text>
            </>
          ) : (
            <>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>Open spots: —</Text>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>Capacity: —</Text>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>Hours: —</Text>
              <Text style={{ color: '#fff', fontSize: textSizeSmall }}>Type: —</Text>
            </>
          )}
        </View>

        <Pressable
          style={[styles.btn, { backgroundColor: '#808080' }, { marginTop: 16 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.btnText, { backgroundColor: '#808080' }]}>Back to Map</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.rightPane}>
        <View style={styles.mapOuter} onLayout={handleMapLayout}>
          <View
            style={[
              styles.mapInner,
              mapTransform ? { transform: mapTransform as any } : null,
            ]}
          >
            <CampusStreets width="100%" height="100%" />
            <CampusLots
              width="100%"
              height="100%"
              style={StyleSheet.absoluteFillObject}
            />
            <CampusLotNames
              width="100%"
              height="100%"
              style={StyleSheet.absoluteFillObject}
              fill="#adadadff"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
  },
  leftPane: { // Left pane styles definition
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  rightPane: { // Right pane styles definition
    flex: 2,
    backgroundColor: COLORS.bg,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { // Divider styles definition
    width: 1,
    backgroundColor: COLORS.textSecondary,
    marginVertical: 24,
    alignSelf: 'stretch',
  },
  mapOuter: { // Map outer container styles definition
    width: '100%',
    aspectRatio: MAP_ASPECT,
    overflow: 'hidden',
  },
  mapInner: { // Map inner container styles definition
    flex: 1,
    position: 'relative',
  },
  title: { // Title text styles definition
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  sub: { // Subtitle text styles definition
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  card: { // Card styles definition
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  h: { // Heading text styles definition
    fontWeight: '700',
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  btn: { // Button styles definition
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  btnText: { // Button text styles definition
    color: '#fff',
    fontWeight: '700',
  },
});
