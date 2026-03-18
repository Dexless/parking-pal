import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { LOTS } from '../data/campusLots';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../RootNavigator';
import { COLORS } from './colors';
import MapboxView, { MapboxViewHandle, type MapboxMarker } from '../MapboxView';
import { useAuth } from '../AuthContext';
import {
  deleteVehiclePin,
  fetchLotFullnessPercentages,
  fetchVehiclePin,
  upsertVehiclePin,
  type VehiclePin,
} from '../../api/api';

const CAMPUS_CENTER: [number, number] = [-119.7487, 36.8123];
const CAMPUS_ZOOM = 16.2;
const CAMPUS_BOUNDS = {
  sw: [-119.754337, 36.808416] as [number, number],
  ne: [-119.741531, 36.817459] as [number, number],
};

export default function MapScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { loggedIn, setLoggedIn, userId, setUserId } = useAuth();
  const mapRef = useRef<MapboxViewHandle>(null);
  const [lotFullnessById, setLotFullnessById] = useState<Record<string, number>>({});
  const [vehiclePin, setVehiclePin] = useState<VehiclePin | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isAimingPin, setIsAimingPin] = useState(false);

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
  const isStackedLayout = width < stackedLayoutBreakpoint;
  const availableWidth = width - horizontalPadding;
  const availableHeight = height - verticalPadding;
  const contentWidth = Math.min(
    availableWidth,
    Math.max(320, availableWidth * layoutScale)
  );
  const maxWidth = isStackedLayout
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
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerLoginWrap}>
          <Pressable
            onPress={() => {
              if (loggedIn) {
                setLoggedIn(false);
                setUserId(null);
                return;
              }
              navigation.navigate('Login');
            }}
          >
            <Text style={styles.headerLoginText}>{loggedIn ? 'Logout' : 'Login'}</Text>
          </Pressable>
        </View>
      ),
    });
  }, [loggedIn, navigation, setLoggedIn, setUserId]);

  useEffect(() => {
    if (!loggedIn || !userId) {
      setVehiclePin(null);
      setPinError(null);
      setIsAimingPin(false);
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

  const setPinLabel = !loggedIn
    ? 'Login to Set Vehicle Pin'
    : isAimingPin
      ? 'Save Vehicle Pin Here'
      : vehiclePin
        ? 'Aim + Update Vehicle Pin'
        : 'Aim + Set Vehicle Pin';

  function onAimVehiclePin() {
    if (!loggedIn || !userId) {
      navigation.navigate('Login');
      return;
    }
    setPinError(null);
    setIsAimingPin(true);
  }

  async function onSetVehiclePin() {
    if (!loggedIn || !userId) {
      navigation.navigate('Login');
      return;
    }

    const center = await mapRef.current?.getCenter();
    if (!center) {
      setPinError('Unable to read map center.');
      return;
    }

    const [lon, lat] = center;
    setPinBusy(true);
    setPinError(null);

    try {
      const pin = await upsertVehiclePin(userId, lat, lon);
      setVehiclePin(pin);
      setIsAimingPin(false);
    } catch (error) {
      if (error instanceof Error) {
        setPinError(error.message);
      } else {
        setPinError('Failed to save vehicle pin.');
      }
    } finally {
      setPinBusy(false);
    }
  }

  async function onDeleteVehiclePin() {
    if (!userId) {
      return;
    }

    setPinBusy(true);
    setPinError(null);

    try {
      await deleteVehiclePin(userId);
      setVehiclePin(null);
    } catch (error) {
      if (error instanceof Error) {
        setPinError(error.message);
      } else {
        setPinError('Failed to delete vehicle pin.');
      }
    } finally {
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
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                centerCoordinate={CAMPUS_CENTER}
                zoomLevel={CAMPUS_ZOOM}
                interactive
                bounds={CAMPUS_BOUNDS}
                lotFullnessById={lotFullnessById}
                markers={isAimingPin ? [] : vehicleMarkers}
                onMarkerPress={(id) => {
                  if (id >= 0) {
                    navigation.navigate('LotDetails', { lotId: id });
                  }
                }}
              />
              {isAimingPin ? (
                <View pointerEvents="none" style={styles.aimPinOverlay}>
                  <View style={styles.aimPinBadge}>
                    <View style={styles.aimPinDot} />
                  </View>
                  <View style={styles.aimPinStem} />
                </View>
              ) : null}
            </View>
          </View>
          <Pressable
            style={[styles.resetBtn, pinBusy && styles.buttonDisabled]}
            onPress={() => mapRef.current?.reset()}
            disabled={pinBusy}
          >
            <Text style={styles.resetBtnText}>Reset View</Text>
          </Pressable>
          <Pressable
            style={[styles.vehiclePinBtn, pinBusy && styles.buttonDisabled]}
            onPress={isAimingPin ? onSetVehiclePin : onAimVehiclePin}
            disabled={pinBusy}
          >
            <Text style={styles.resetBtnText}>
              {pinBusy ? 'Working...' : setPinLabel}
            </Text>
          </Pressable>
          {isAimingPin ? (
            <Pressable
              style={[styles.resetBtn, pinBusy && styles.buttonDisabled]}
              onPress={() => setIsAimingPin(false)}
              disabled={pinBusy}
            >
              <Text style={styles.resetBtnText}>Cancel Pin Aim</Text>
            </Pressable>
          ) : null}
          {loggedIn && vehiclePin ? (
            <Pressable
              style={[styles.deletePinBtn, pinBusy && styles.buttonDisabled]}
              onPress={onDeleteVehiclePin}
              disabled={pinBusy}
            >
              <Text style={styles.resetBtnText}>Delete Vehicle Pin</Text>
            </Pressable>
          ) : null}
          {vehiclePin ? (
            <Text style={styles.pinMetaText}>
              Lat: {vehiclePin.lat.toFixed(5)} Lon: {vehiclePin.lon.toFixed(5)}
            </Text>
          ) : null}
          {isAimingPin ? (
            <Text style={styles.pinMetaText}>Drag the map, then tap Save Vehicle Pin Here.</Text>
          ) : null}
          {pinError ? <Text style={styles.pinErrorText}>{pinError}</Text> : null}
        </View>
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
  headerLoginText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  headerLoginWrap: {
    marginRight: 12,
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
  aimPinOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aimPinBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fef3c7',
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  aimPinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fee2e2',
  },
  aimPinStem: {
    marginTop: -1,
    width: 2,
    height: 14,
    backgroundColor: '#fee2e2',
    borderRadius: 1,
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
  vehiclePinBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1f4b35',
    borderWidth: 1,
    borderColor: '#2f6f4f',
    alignSelf: 'center',
  },
  deletePinBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#4b1f1f',
    borderWidth: 1,
    borderColor: '#7f2c2c',
    alignSelf: 'center',
  },
  resetBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  pinMetaText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  pinErrorText: {
    marginTop: 8,
    color: '#f97373',
    maxWidth: 280,
    textAlign: 'center',
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
