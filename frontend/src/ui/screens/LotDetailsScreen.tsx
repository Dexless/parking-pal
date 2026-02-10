// src/app/screens/LotDetailsScreen.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../RootNavigator';
import { LOTS } from '../data/campusLots';
import { fetchLotData, Lot as LotData, randomizeData } from '../../api/lotApi';
import { COLORS } from './colors';
import MapboxView from '../MapboxView';
import { getLang } from "../../langSave";


// Define route prop type for LotDetails screen
type DetailsRoute = RouteProp<RootStackParamList, 'LotDetails'>;

// Aspect ratio of the campus map
const MAP_ASPECT = 1692 / 1306;
const CAMPUS_CENTER: [number, number] = [-119.7487, 36.8123];
const CAMPUS_ZOOM = 16.2;

const STATE_RGB: Record<string, [number, number, number]> = {
  EMPTY: [61, 133, 198],
  LIGHT: [106, 168, 79],
  MEDIUM: [241, 194, 50],
  HEAVY: [230, 145, 56],
  FULL: [204, 0, 0],
};

export default function LotDetailsScreen() {
  // translations for spanish
  const [lang] = useState<"en" | "es">(getLang());

  const text = {
    capacitySubtitle:
      lang === "en"
        ? "Live capacity and recent readings."
        : "Capacidad en vivo y lecturas recientes.",
    total: lang === "en" ? "Total Spaces" : "Espacios Totales",
    occupied: lang === "en" ? "Occupied" : "Ocupados",
    available: lang === "en" ? "Available" : "Disponibles",
    crowd: lang === "en" ? "Crowd" : "Afluencia",
    hours: lang === "en" ? "Hours" : "Horario",
    type: lang === "en" ? "Type" : "Tipo",
    back: lang === "en" ? "Back to Map" : "Volver al Mapa",
    notFound: lang === "en" ? "Lot not found" : "Lote no encontrado",
  };

  const statusText = {
    full: lang === "en" ? "Full" : "Lleno",
    plenty: lang === "en" ? "Plenty of spaces" : "Muchos espacios",
    some: lang === "en" ? "Some spaces" : "Algunos espacios",
    limited: lang === "en" ? "Limited" : "Limitado",
    loading: lang === "en" ? "Loading…" : "Cargando…",
  };

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DetailsRoute>();
  const { lotId } = route.params;

  const lot = useMemo(() => LOTS.find(l => l.id === lotId), [lotId]);
  const [lotData, setLotData] = useState<LotData | null>(null);

  //Fetch lot data from API, if it fails, call randomize endpoint
  useEffect(() => {
    fetchLotData(lotId)
      .then(setLotData)
      .catch(() => {
        randomizeData(lotId);
      });
  }, [lotId]);

  // Math
  const total = lotData?.total_capacity ?? null;
  const occupied = lotData?.current ?? null;
  const available =
    total != null && occupied != null ? Math.max(0, total - occupied) : null;
  const percentFull =
    typeof lotData?.percent_full === 'number'
      ? Math.min(100, Math.max(0, lotData.percent_full))
      : null;

  const percentLabel =
    percentFull != null ? `${percentFull.toFixed(1)}% full` : '—';

  let statusChip = statusText.loading;

  if (total != null && available != null) {
    if (available <= 0) statusChip = statusText.full;
    else if (available >= total * 0.4) statusChip = statusText.plenty;
    else if (available >= total * 0.15) statusChip = statusText.some;
    else statusChip = statusText.limited;
  }


  let barColor = COLORS.accent;
  const crowdState = lotData?.state;
  if (crowdState && STATE_RGB[crowdState]) {
    const [r, g, b] = STATE_RGB[crowdState];
    barColor = `rgb(${r},${g},${b})`;
  }

  // If lot not found
  if (!lot) {
    return (
      <View style={styles.screen}>
        <View style={styles.contentRow}>
          <View style={styles.leftPane}>

            <Text style={styles.title}>{text.notFound}</Text>
            <Pressable
              style={styles.btn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnText}>{text.back}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Define text sizes
  const textSizeSmall = 16;
  const textSizeLarge = 28;

  // if lot is found, display details
  return (
    <View style={styles.screen}>
      <View style={styles.contentRow}>
        <View style={styles.leftPane}>

          <Text style={[styles.title, { fontSize: textSizeLarge }]}>{lot.name}</Text>
          <Text style={styles.sub}>{text.capacitySubtitle}</Text>

          <View style={styles.card}>
            <View style={styles.bigRow}>
              <Text style={styles.bigPercent}>{percentLabel}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{statusChip}</Text>
              </View>
            </View>

            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: percentFull != null ? `${percentFull}%` : '0%',
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{text.total}</Text>
                <Text style={styles.statValue}>
                  {total != null ? total : '—'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{text.occupied}</Text>
                <Text style={styles.statValue}>
                  {occupied != null ? occupied : '—'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{text.available}</Text>
                <Text style={styles.statValue}>
                  {available != null ? available : '—'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{text.crowd}</Text>
                <Text style={styles.statValue}>
                  {lotData ? lotData.state : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.extraInfo}>
              <Text style={{ color: '#e5e7eb', fontSize: textSizeSmall }}>
                {text.hours}: {lotData ? lotData.hours : '—'}
              </Text>
              <Text style={{ color: '#e5e7eb', fontSize: textSizeSmall }}>
                {text.type}: {lotData ? lotData.type : '—'}
              </Text>
            </View>
          </View>

        </View>

        <View style={styles.rightPane}>
          <View style={[styles.card, styles.mapCard]}>
            <View style={styles.mapOuter}>
              <View style={styles.mapInner}>
                <MapboxView
                  style={StyleSheet.absoluteFillObject}
                  centerCoordinate={CAMPUS_CENTER}
                  zoomLevel={CAMPUS_ZOOM}
                  pointerEvents="none"
                />
              </View>
            </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    width: '85%',
  },
  leftPane: { // Left pane styles definition
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
    marginRight: 8,
  },
  rightPane: { // Right pane styles definition
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 12,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    marginLeft: 8,
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
    fontSize: 14,
  },
  card: { // Card styles definition
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    width: '100%',
  },
  mapCard: {
    padding: 8,
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bigPercent: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3d3d3d',
    backgroundColor: '#1f1f1f',
  },
  pillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bar: {
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3d3d3d',
    backgroundColor: '#242424',
    overflow: 'hidden',
    marginBottom: 14,
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statCard: {
    flexBasis: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3d3d3d',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#1f1f1f',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  extraInfo: {
    marginTop: 12,
    gap: 4,
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
  backBtn: {
    backgroundColor: '#808080',
    marginTop: 16,
  },
  btnText: { // Button text styles definition
    color: '#fff',
    fontWeight: '700',
  },
});

