// src/app/screens/LotDetailsScreen.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../RootNavigator';
import { LOTS } from '../data/campusLots';
import { fetchLotData, Lot as LotData, randomizeData, fetchLotFullnessPercentages } from '../../api/lotApi';
import { COLORS } from './colors';
import CampusStreets from '../../../assets/images/Campus_streets.svg';
import CampusLots from '../../../assets/images/Campus_lots.svg';
import CampusLotNames from '../../../assets/images/campus_lot_names.svg';
import { getLang, setLang as saveLang } from "../../langSave";


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
  5:  { centerX: 0.4701, centerY: 0.1907, scale: 1.8 }, // P9
  7:  { centerX: 0.4701, centerY: 0.1907, scale: 1.8 }, // P11
  9:  { centerX: 0.2722, centerY: 0.1700, scale: 2.0 }, // P15
  10: { centerX: 0.1200, centerY: 0.1000, scale: 1.8 }, // P20
  11: { centerX: 0.1401, centerY: 0.4007, scale: 1.8 }, // P27
};

const STATE_RGB: Record<string, [number, number, number]> = {
  EMPTY: [61, 133, 198],
  LIGHT: [106, 168, 79],
  MEDIUM: [241, 194, 50],
  HEAVY: [230, 145, 56],
  FULL: [204, 0, 0],
};

export default function LotDetailsScreen() {
  // translations for spanish
  const [lang, setLang] = useState<"en" | "es">(getLang());
  // save selection
  function updateLanguage(newLang: "en" | "es") {
    saveLang(newLang);   // saves globally
    setLang(newLang);    // updates UI
  }

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
  const [lotStates, setLotStates] = useState<{ [key: number]: string }>({});

  //Fetch lot data from API, if it fails, call randomize endpoint
  useEffect(() => {
    fetchLotData(lotId)
      .then(setLotData)
      .catch(() => {
        randomizeData(lotId);
      });
  }, [lotId]);

  useEffect(() => {
    fetchLotFullnessPercentages().then((dict) => {
      if (dict) setLotStates(dict);
    });
  }, []);

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

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <Pressable onPress={() => updateLanguage("en")} style={{ padding: 6, backgroundColor: "#333", borderRadius: 6 }}>
                <Text style={{ color: "white" }}>EN</Text>
              </Pressable>

              <Pressable onPress={() => updateLanguage("es")} style={{ padding: 6, backgroundColor: "#333", borderRadius: 6 }}>
                <Text style={{ color: "white" }}>ES</Text>
              </Pressable>
            </View>

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

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
              width: "100%",
            }}
          >

            <Pressable  // back button to go to map
              style={[styles.btn, styles.backBtn]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnText}>{text.back}</Text>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 8 }}>   
              <Pressable
                onPress={() => updateLanguage("en")}   // enlish button
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#333",
                  borderRadius: 6,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>EN</Text>
              </Pressable>

              <Pressable
                onPress={() => updateLanguage("es")}   // spanish button
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#333",
                  borderRadius: 6,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>ES</Text>
              </Pressable>
            </View>
          </View>

        </View>

        <View style={styles.rightPane}>
          <View style={styles.card}>
            <View style={styles.mapOuter}>
              <View style={styles.mapInner}>
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
                        onPress={() =>
                          navigation.navigate('LotDetails', { lotId: id })
                        }
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
    borderColor: '#334155',
    backgroundColor: '#020617',
  },
  pillText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  bar: {
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
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
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#020617',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
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
  block: { // Lot block styles definition
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 4,
  },
});
