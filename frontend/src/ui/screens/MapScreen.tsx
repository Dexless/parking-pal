import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { LOTS } from '../data/campusLots';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../RootNavigator';
import { COLORS } from './colors';
import MapboxView, { type MapboxMarker } from '../MapboxView';
import { useAuth } from '../AuthContext';
import { useVehicleEventNotification } from '../VehicleEventNotification';
import { findLotContainingCoordinate } from '../mapLotGeoJson';
import {
  fetchLotFullnessPercentages,
  fetchVehiclePin,
  simulateVehicleEvent,
  upsertVehiclePin,
  type VehiclePin,
} from '../../api/api';

const CAMPUS_CENTER: [number, number] = [-119.7487, 36.8123];
const CAMPUS_ZOOM = 16.2;
const CAMPUS_BOUNDS = {
  sw: [-119.754337, 36.808416] as [number, number],
  ne: [-119.741531, 36.817459] as [number, number],
};
const SIMULATION_MIN_DELAY_MS = 3000;
const SIMULATION_MAX_DELAY_MS = 10000;

function randomSimulationDelayMs() {
  return (
    Math.floor(
      Math.random() * (SIMULATION_MAX_DELAY_MS - SIMULATION_MIN_DELAY_MS + 1)
    ) + SIMULATION_MIN_DELAY_MS
  );
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

export default function MapScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const { hideVehicleEventNotification, showVehicleEventNotification } =
    useVehicleEventNotification();
  const { isAdmin, loggedIn, userId } = useAuth();
  const savingPinRef = useRef(false);
  const [lotFullnessById, setLotFullnessById] = useState<Record<string, number>>({});
  const [vehiclePin, setVehiclePin] = useState<VehiclePin | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPlacingPin, setIsPlacingPin] = useState(false);

  const vehicleMarkers = useMemo<MapboxMarker[]>(() => {
    if (!vehiclePin) {
      return [];
    }
    return [
      {
        id: -1,
        name: 'Vehicle Pin',
        coordinate: [vehiclePin.lon, vehiclePin.lat],
        detail: `${vehiclePin.lat.toFixed(5)}, ${vehiclePin.lon.toFixed(5)}`,
      },
    ];
  }, [vehiclePin]);

  const { width, height } = useWindowDimensions();
  const MAP_ASPECT = 1692 / 1306;
  const horizontalPadding = 12 * 2;
  const verticalPadding = 12 * 2 + 60;
  const panelGap = 16;
  const sidePanelWidth = 180;
  const stackedLayoutBreakpoint = 1020;
  const layoutScale = 0.8;
  const hasDebugPanel = isAdmin;
  const isStackedLayout = width < stackedLayoutBreakpoint;
  const availableWidth = width - horizontalPadding;
  const availableHeight = height - verticalPadding;
  const contentWidth = Math.min(
    availableWidth,
    Math.max(320, availableWidth * layoutScale)
  );
  const maxWidth = isStackedLayout || !hasDebugPanel
    ? contentWidth
    : Math.max(320, contentWidth - sidePanelWidth - panelGap);
  const maxHeight = Math.min(
    availableHeight,
    Math.max(280, availableHeight * layoutScale)
  );

  let frameWidth = maxWidth;
  let frameHeight = frameWidth / MAP_ASPECT;

  if (frameHeight > maxHeight) {
    frameHeight = maxHeight;
    frameWidth = frameHeight * MAP_ASPECT;
  }

  useEffect(() => {
    let active = true;
    fetchLotFullnessPercentages()
      .then((byId) => {
        if (!active) return;
        const next: Record<string, number> = {};
        LOTS.forEach((lot) => {
          const percent = byId[String(lot.id)];
          if (typeof percent !== 'number' || !Number.isFinite(percent)) return;
          next[String(lot.id)] = percent;
          next[lot.name] = percent;
        });
        setLotFullnessById(next);
      })
      .catch(() => {
        if (active) setLotFullnessById({});
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isFocused) {
      hideVehicleEventNotification();
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextSimulation = () => {
      if (!active) {
        return;
      }

      timer = setTimeout(() => {
        simulateVehicleEvent()
          .then((event) => {
            if (!active) {
              return;
            }

            const percentFull = clampPercent(event.lot?.percent_full ?? event.percent_full);
            setLotFullnessById((current) => ({
              ...current,
              [String(event.lot_id)]: percentFull,
              [event.lot_name]: percentFull,
            }));
            showVehicleEventNotification(
              `vehicle ${event.action} lot ${event.lot_name} now at ${Math.round(percentFull)}% capacity`
            );
          })
          .catch((error) => {
            console.error('Failed to simulate vehicle event', error);
          })
          .finally(() => {
            scheduleNextSimulation();
          });
      }, randomSimulationDelayMs());
    };

    scheduleNextSimulation();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [hideVehicleEventNotification, isFocused, showVehicleEventNotification]);

  useEffect(() => {
    if (!loggedIn || !userId) {
      setVehiclePin(null);
      setPinError(null);
      setIsPlacingPin(false);
      return;
    }

    let active = true;
    fetchVehiclePin(userId)
      .then((pin) => {
        if (!active) return;
        setVehiclePin(pin);
      })
      .catch((error) => {
        if (!active) return;
        setVehiclePin(null);
        if (error instanceof Error) {
          setPinError(error.message);
        } else {
          setPinError('Failed to load vehicle pin.');
        }
      });

    return () => {
      active = false;
    };
  }, [loggedIn, userId]);

  const pinControlLabel = pinBusy
    ? 'Saving...'
    : isPlacingPin
      ? 'Tap map'
      : vehiclePin
        ? 'Reset Pin'
        : 'Place Pin';

  function onStartPinPlacement() {
    if (!loggedIn || !userId) {
      navigation.navigate('Login');
      return;
    }
    setPinError(null);
    setIsPlacingPin(true);
  }

  async function onPlacePinAtCoordinate([lon, lat]: [number, number]) {
    if (!isPlacingPin || pinBusy || savingPinRef.current) {
      return;
    }

    if (!loggedIn || !userId) {
      navigation.navigate('Login');
      return;
    }

    savingPinRef.current = true;
    setPinBusy(true);
    setPinError(null);

    try {
      const currentLot = findLotContainingCoordinate([lon, lat])?.lotName ?? null;
      const pin = await upsertVehiclePin(userId, lat, lon, currentLot);
      setVehiclePin(pin);
      setIsPlacingPin(false);
    } catch (error) {
      if (error instanceof Error) {
        setPinError(error.message);
      } else {
        setPinError('Failed to save vehicle pin.');
      }
    } finally {
      savingPinRef.current = false;
      setPinBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.contentRow, isStackedLayout && styles.contentColumn]}>
        <View style={styles.leftColumn}>
          <View style={styles.mapCard}>
            <View
              style={[styles.frame, { width: frameWidth, height: frameHeight }]}
            >
              <MapboxView
                style={StyleSheet.absoluteFillObject}
                centerCoordinate={CAMPUS_CENTER}
                zoomLevel={CAMPUS_ZOOM}
                interactive
                bounds={CAMPUS_BOUNDS}
                lotFullnessById={lotFullnessById}
                markers={isPlacingPin ? [] : vehicleMarkers}
                onMapPress={isPlacingPin ? onPlacePinAtCoordinate : undefined}
                onMarkerPress={(id) => {
                  if (isPlacingPin) {
                    return;
                  }
                  if (id >= 0) {
                    navigation.navigate('LotDetails', { lotId: id });
                  }
                }}
              />
              <View pointerEvents="box-none" style={styles.mapToolOverlay}>
                <Pressable
                  style={({ hovered, pressed }) => [
                    styles.pinToolBtn,
                    (hovered || pressed || isPlacingPin) && styles.pinToolBtnActive,
                    (pinBusy || isPlacingPin) && styles.pinToolBtnLocked,
                  ]}
                  onPress={onStartPinPlacement}
                  disabled={pinBusy || isPlacingPin}
                >
                  <Text style={styles.pinToolIcon}>P</Text>
                  <Text style={styles.pinToolText}>{pinControlLabel}</Text>
                </Pressable>
                {pinError ? <Text style={styles.pinErrorText}>{pinError}</Text> : null}
              </View>
            </View>
          </View>
        </View>
        {hasDebugPanel ? (
          <View
            style={[
              styles.rightColumn,
              { width: isStackedLayout ? frameWidth : sidePanelWidth },
              isStackedLayout && styles.rightColumnStacked,
            ]}
          >
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
        ) : null}
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  contentColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  leftColumn: {
    alignItems: 'center',
  },
  rightColumn: {
    alignItems: 'flex-start',
  },
  rightColumnStacked: {
    alignItems: 'center',
  },
  frame: {
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
  mapToolOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'flex-end',
    maxWidth: 220,
  },
  pinToolBtn: {
    minWidth: 112,
    minHeight: 42,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.82,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  pinToolBtnActive: {
    backgroundColor: 'rgba(31, 75, 53, 0.94)',
    borderColor: '#66d19e',
    opacity: 1,
  },
  pinToolBtnLocked: {
    opacity: 1,
  },
  pinToolIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e11d48',
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
    overflow: 'hidden',
  },
  pinToolText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  pinErrorText: {
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(17, 24, 39, 0.78)',
    color: '#f97373',
    maxWidth: 220,
    textAlign: 'right',
    fontSize: 12,
  },
  debugPanel: {
    marginTop: 0,
    width: '100%',
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
