// src/app/screens/MapScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { LOTS } from '../data/campusLots';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../RootNavigator';
import { COLORS } from './colors';
import { useWindowDimensions } from 'react-native';
import MapboxView, { MapboxMarker, MapboxViewHandle } from '../MapboxView';
import { fetchLotData, Lot as LotData } from '../../api/lotApi';

const CAMPUS_CENTER: [number, number] = [-119.7487, 36.8123];
const CAMPUS_ZOOM = 16.2;
const CAMPUS_BOUNDS = {
  sw: [-119.754931, 36.806739] as [number, number],
  ne: [-119.741531, 36.817459] as [number, number],
};
const P20_ID = 10;

// Main MapScreen component
export default function MapScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const mapRef = useRef<MapboxViewHandle>(null);
  const [p20Data, setP20Data] = useState<LotData | null>(null);

  const { width, height } = useWindowDimensions();
  const MAP_ASPECT = 1692 / 1306;

  // Leave some room for padding + header
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
  const scale = 0.88;
  frameWidth *= scale;
  frameHeight *= scale;

  useEffect(() => {
    fetchLotData(P20_ID)
      .then(setP20Data)
      .catch(() => setP20Data(null));
  }, []);

  const p20Fullness = useMemo(() => {
    if (!p20Data) return 'Loading…';
    if (typeof p20Data.percent_full === 'number') {
      const clamped = Math.min(100, Math.max(0, p20Data.percent_full));
      return `${clamped.toFixed(1)}% full`;
    }
    if (
      typeof p20Data.total_capacity === 'number' &&
      typeof p20Data.current === 'number' &&
      p20Data.total_capacity > 0
    ) {
      const percent = (p20Data.current / p20Data.total_capacity) * 100;
      const clamped = Math.min(100, Math.max(0, percent));
      return `${clamped.toFixed(1)}% full`;
    }
    return 'No data';
  }, [p20Data]);

  const markers = useMemo<MapboxMarker[]>(
    () =>
      LOTS.filter((lot) => lot.id === P20_ID && lot.lngLat).map((lot) => ({
        id: lot.id,
        name: lot.name,
        coordinate: lot.lngLat!,
        detail: p20Fullness,
      })),
    [p20Fullness]
  );

  return (
    <View style={styles.root}>
      <View style={styles.contentRow}>
        <View style={styles.leftColumn}>
          <View style={styles.mapCard}>
            <View
              style={[styles.frame, { width: frameWidth, height: frameHeight }]}
            >
              <MapboxView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                centerCoordinate={CAMPUS_CENTER}
                zoomLevel={CAMPUS_ZOOM}
                interactive
                bounds={CAMPUS_BOUNDS}
                markers={markers}
                onMarkerPress={(id) =>
                  navigation.navigate('LotDetails', { lotId: id })
                }
              />
            </View>
          </View>
          <Pressable
            style={styles.resetBtn}
            onPress={() => mapRef.current?.reset()}
          >
            <Text style={styles.resetBtnText}>Reset View</Text>
          </Pressable>
        </View>
        <View style={styles.rightColumn}>
          <View style={styles.debugPanel}>
            <Text style={styles.debugTitle}>Debug: Lots</Text>
            <View style={styles.debugRow}>
              {LOTS.map(({ id, name }) => (
                <Pressable
                  key={id}
                  style={styles.debugBtn}
                  onPress={() => navigation.navigate('LotDetails', { lotId: id })}
                >
                  <Text style={styles.debugBtnText}>{name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { // Root container styles definition
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
    maxWidth: 1100,
    justifyContent: 'center',
  },
  leftColumn: {
    alignItems: 'center',
  },
  rightColumn: {
    alignItems: 'flex-start',
  },
  frame: { // Map frame styles definition
    alignSelf: 'center',
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2f2f2f',
    overflow: 'hidden',
    backgroundColor: '#1f1f1f',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  mapCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 8,
  },
  resetBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2b2b2b',
    borderWidth: 1,
    borderColor: '#3d3d3d',
    alignSelf: 'center',
  },
  resetBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  debugPanel: {
    marginTop: 0,
    width: 180,
  },
  debugTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  debugRow: {
    flexDirection: 'column',
    gap: 8,
  },
  debugBtn: {
    width: 120,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2b2b2b',
    borderWidth: 1,
    borderColor: '#3d3d3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
