// src/app/screens/LotDetailsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getLang } from '../../langSave';
import { fetchLotData, fetchLotFullnessPercentages, Lot as LotData, randomizeData } from '../../api/api';
import MapboxView from '../MapboxView';
import type { RootStackParamList } from '../RootNavigator';
import { LOTS } from '../data/campusLots';
import { COLORS } from './colors';

type DetailsRoute = RouteProp<RootStackParamList, 'LotDetails'>;

type PopularTimesBar = {
  hour: string;
  busynessPercent: number;
};

const MAP_ASPECT = 1692 / 1306;
const CAMPUS_CENTER: [number, number] = [-119.7487, 36.8123];
const CAMPUS_ZOOM = 16.2;
const STACKED_LAYOUT_BREAKPOINT = 1080;
const CONDENSED_LABEL_BREAKPOINT = 780;
const POPULAR_TIMES_HOURS = [
  '7AM',
  '8AM',
  '9AM',
  '10AM',
  '11AM',
  '12PM',
  '1PM',
  '2PM',
  '3PM',
  '4PM',
  '5PM',
  '6PM',
  '7PM',
  '8PM',
];
const POPULAR_TIMES_SEED = [0.2, 0.8, 0.5, 0.7, 0.8, 0.95, 0.9, 0.7, 0.8, 0.7, 0.5, 0.4, 0.25, 0.1];
const CONDENSED_LABEL_TICKS = new Set(['7AM', '12PM', '5PM', '8PM']);
const POPULAR_TIMES_BAR_HEIGHT = 144;
const POPULAR_TIMES_HOUR_SET = new Set(POPULAR_TIMES_HOURS);

const LOT_ZOOM_BY_ID: Record<number, number> = {
  5: 16.35,
  6: 16.35,
  7: 16.24,
  8: 16.31,
};

const LOT_CENTER_BY_ID: Record<number, [number, number]> = {
  0: [-119.74342508745244, 36.80923189599102],
  1: [-119.74166555831523, 36.80981600558881],
  2: [-119.74048538633294, 36.809721517573664],
  3: [-119.74165482947902, 36.811637024554656],
  4: [-119.74179430434965, 36.813277622474885],
  5: [-119.73732092009323, 36.81552835961807],
  6: [-119.73689981327732, 36.81643451204332],
  7: [-119.74051051511327, 36.816030994446606],
  8: [-119.74309839830818, 36.81570229017987],
  9: [-119.74494107591363, 36.81495288283217],
  10: [-119.75055517196566, 36.816784851359024],
  11: [-119.75311397153347, 36.810104511706214],
};

const STATE_RGB: Record<string, [number, number, number]> = {
  EMPTY: [61, 133, 198],
  LIGHT: [106, 168, 79],
  MEDIUM: [241, 194, 50],
  HEAVY: [230, 145, 56],
  FULL: [204, 0, 0],
};

const POPULAR_TIMES_PROFILE: PopularTimesBar[] = POPULAR_TIMES_HOURS.map((hour, index) => ({
  hour,
  busynessPercent: POPULAR_TIMES_SEED[index] * 100,
}));

function getCurrentPopularTimesHour(date: Date): string | null {
  const rawHour = date.getHours();
  const normalizedHour = rawHour % 12 || 12;
  const meridiem = rawHour >= 12 ? 'PM' : 'AM';
  const label = `${normalizedHour}${meridiem}`;

  return POPULAR_TIMES_HOUR_SET.has(label) ? label : null;
}

function PopularTimesSection({
  bars,
  title,
  dayLabel,
  condensedLabels,
  currentHour,
  nowLabel,
  currentLotColor,
}: {
  bars: PopularTimesBar[];
  title: string;
  dayLabel: string;
  condensedLabels: boolean;
  currentHour: string | null;
  nowLabel: string;
  currentLotColor?: string;
}) {
  const peak = bars.reduce((maxValue, bar) => Math.max(maxValue, bar.busynessPercent), 0);

  return (
    <View style={styles.card}>
      <View style={styles.popularTimesHeader}>
        <Text style={styles.popularTimesTitle}>{title}</Text>
        <Text style={styles.popularTimesDay}>{dayLabel}</Text>
      </View>

      <View style={styles.popularTimesChart}>
        <View style={styles.popularTimesBaseline} />
        <View style={styles.popularTimesRow}>
          {bars.map((bar) => {
            const clampedPercent = Math.max(0, Math.min(100, bar.busynessPercent));
            const barHeight = Math.max(8, (clampedPercent / 100) * POPULAR_TIMES_BAR_HEIGHT);
            const isPeak = peak > 0 && bar.busynessPercent === peak;
            const isCurrentHour = currentHour === bar.hour;
            const showLabel = !condensedLabels || CONDENSED_LABEL_TICKS.has(bar.hour);

            return (
              <View key={bar.hour} style={styles.popularTimesBarGroup}>
                <Text style={[styles.popularTimesNowLabel, !isCurrentHour && styles.popularTimesNowLabelHidden]}>
                  {isCurrentHour ? nowLabel : ' '}
                </Text>
                <View style={styles.popularTimesTrack}>
                  <View
                    style={[
                      styles.popularTimesFill,
                      isCurrentHour && currentLotColor
                        ? styles.popularTimesFillCurrentCustom
                        : isCurrentHour
                          ? styles.popularTimesFillCurrent
                          : isPeak
                            ? styles.popularTimesFillPeak
                            : styles.popularTimesFillBase,
                      isCurrentHour && currentLotColor && { backgroundColor: currentLotColor },
                      { height: barHeight },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.popularTimesLabel,
                    isCurrentHour && styles.popularTimesLabelCurrent,
                    !showLabel && styles.popularTimesLabelHidden,
                  ]}
                >
                  {showLabel ? bar.hour : ' '}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function LotDetailsScreen() {
  const [lang] = useState<'en' | 'es'>(getLang());
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const { width } = useWindowDimensions();
  const isStackedLayout = width < STACKED_LAYOUT_BREAKPOINT;
  const shouldCondenseHistogramLabels = width < CONDENSED_LABEL_BREAKPOINT;

  const text = {
    capacitySubtitle:
      lang === 'en'
        ? 'Live capacity and recent readings.'
        : 'Capacidad en vivo y lecturas recientes.',
    total: lang === 'en' ? 'Total Spaces' : 'Espacios Totales',
    occupied: lang === 'en' ? 'Occupied' : 'Ocupados',
    available: lang === 'en' ? 'Available' : 'Disponibles',
    crowd: lang === 'en' ? 'Crowd' : 'Afluencia',
    hours: lang === 'en' ? 'Hours' : 'Horario',
    type: lang === 'en' ? 'Type' : 'Tipo',
    back: lang === 'en' ? 'Back to Map' : 'Volver al Mapa',
    notFound: lang === 'en' ? 'Lot not found' : 'Lote no encontrado',
    popularTimes: lang === 'en' ? 'Popular times' : 'Horas populares',
    typicalWeekday: lang === 'en' ? 'Typical weekday' : 'Dia tipico entre semana',
    now: lang === 'en' ? 'Now' : 'Ahora',
  };

  const statusText = {
    full: lang === 'en' ? 'Full' : 'Lleno',
    plenty: lang === 'en' ? 'Plenty of spaces' : 'Muchos espacios',
    some: lang === 'en' ? 'Some spaces' : 'Algunos espacios',
    limited: lang === 'en' ? 'Limited' : 'Limitado',
    loading: lang === 'en' ? 'Loading...' : 'Cargando...',
  };

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DetailsRoute>();
  const { lotId } = route.params;
  const lotCenter = LOT_CENTER_BY_ID[lotId] ?? CAMPUS_CENTER;
  const lotZoom = LOT_ZOOM_BY_ID[lotId] ?? CAMPUS_ZOOM;

  const lot = useMemo(() => LOTS.find((entry) => entry.id === lotId), [lotId]);
  const [lotData, setLotData] = useState<LotData | null>(null);
  const [lotFullnessById, setLotFullnessById] = useState<Record<string, number>>({});

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadLotDetails() {
      try {
        const nextLotData = await fetchLotData(lotId);
        if (active) {
          setLotData(nextLotData);
        }
      } catch {
        try {
          await randomizeData(lotId);
          const nextLotData = await fetchLotData(lotId);
          if (active) {
            setLotData(nextLotData);
          }
        } catch {
          if (active) {
            setLotData(null);
          }
        }
      }
    }

    void loadLotDetails();

    return () => {
      active = false;
    };
  }, [lotId]);

  useEffect(() => {
    let active = true;

    fetchLotFullnessPercentages()
      .then((byId) => {
        if (!active) {
          return;
        }

        const next: Record<string, number> = {};
        LOTS.forEach((lotEntry) => {
          const percent = byId[String(lotEntry.id)];
          if (typeof percent !== 'number' || !Number.isFinite(percent)) {
            return;
          }

          next[String(lotEntry.id)] = percent;
          next[lotEntry.name] = percent;
        });

        setLotFullnessById(next);
      })
      .catch(() => {
        if (active) {
          setLotFullnessById({});
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const total = lotData?.total_capacity ?? null;
  const occupied = lotData?.current ?? null;
  const available =
    total != null && occupied != null ? Math.max(0, total - occupied) : null;
  const percentFull =
    typeof lotData?.percent_full === 'number'
      ? Math.min(100, Math.max(0, lotData.percent_full))
      : null;
  const percentLabel = percentFull != null ? `${percentFull.toFixed(1)}% full` : '--';
  const currentPopularTimesHour = getCurrentPopularTimesHour(new Date(currentTimestamp));

  let statusChip = statusText.loading;

  if (total != null && available != null) {
    if (available <= 0) {
      statusChip = statusText.full;
    } else if (available >= total * 0.4) {
      statusChip = statusText.plenty;
    } else if (available >= total * 0.15) {
      statusChip = statusText.some;
    } else {
      statusChip = statusText.limited;
    }
  }

  let barColor = COLORS.accent;
  const crowdState = lotData?.state;
  if (crowdState && STATE_RGB[crowdState]) {
    const [r, g, b] = STATE_RGB[crowdState];
    barColor = `rgb(${r},${g},${b})`;
  }

  if (!lot) {
    return (
      <View style={styles.screen}>
        <View style={styles.notFoundWrap}>
          <Text style={styles.title}>{text.notFound}</Text>
          <Pressable style={styles.btn} onPress={() => navigation.navigate('Map')}>
            <Text style={styles.btnText}>{text.back}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.contentRow, isStackedLayout && styles.contentRowStacked]}>
        <View style={[styles.leftPane, isStackedLayout && styles.leftPaneStacked]}>
          <Text style={styles.lotTitle}>{lot.name}</Text>
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
                <Text style={styles.statValue}>{total != null ? total : '--'}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{text.occupied}</Text>
                <Text style={styles.statValue}>{occupied != null ? occupied : '--'}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{text.available}</Text>
                <Text style={styles.statValue}>{available != null ? available : '--'}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{text.crowd}</Text>
                <Text style={styles.statValue}>{lotData ? lotData.state : '--'}</Text>
              </View>
            </View>

            <View style={styles.extraInfo}>
              <Text style={styles.extraInfoText}>
                {text.hours}: {lotData ? lotData.hours : '--'}
              </Text>
              <Text style={styles.extraInfoText}>
                {text.type}: {lotData ? lotData.type : '--'}
              </Text>
            </View>
          </View>

          <View style={styles.histogramWrap}>
            <PopularTimesSection
              bars={useMemo(
                () =>
                  POPULAR_TIMES_PROFILE.map((bar) => ({
                    ...bar,
                    busynessPercent:
                      currentPopularTimesHour === bar.hour && percentFull != null
                        ? percentFull
                        : bar.busynessPercent,
                  })),
                [currentPopularTimesHour, percentFull]
              )}
              title={text.popularTimes}
              dayLabel={text.typicalWeekday}
              condensedLabels={shouldCondenseHistogramLabels}
              currentHour={currentPopularTimesHour}
              nowLabel={text.now}
              currentLotColor={barColor}
            />
          </View>
        </View>

        <View style={[styles.rightPane, isStackedLayout && styles.rightPaneStacked]}>
          <View style={[styles.card, styles.mapCard]}>
            <View style={styles.mapOuter}>
              <View style={styles.mapInner}>
                <MapboxView
                  style={StyleSheet.absoluteFillObject}
                  centerCoordinate={lotCenter}
                  zoomLevel={lotZoom}
                  pointerEvents="none"
                  lotFullnessById={lotFullnessById}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 24,
    alignItems: 'center',
  },
  contentRow: {
    width: '100%',
    maxWidth: 1400,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contentRowStacked: {
    flexDirection: 'column',
  },
  leftPane: {
    flex: 1,
    minWidth: 0,
    padding: 16,
    marginRight: 8,
  },
  leftPaneStacked: {
    width: '100%',
    marginRight: 0,
    marginBottom: 16,
  },
  rightPane: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    marginLeft: 8,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  rightPaneStacked: {
    width: '100%',
    marginLeft: 0,
  },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  mapOuter: {
    width: '100%',
    aspectRatio: MAP_ASPECT,
    overflow: 'hidden',
  },
  mapInner: {
    flex: 1,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  lotTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  sub: {
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontSize: 14,
  },
  card: {
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
    gap: 12,
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
  extraInfoText: {
    color: '#e5e7eb',
    fontSize: 16,
  },
  histogramWrap: {
    marginTop: 16,
  },
  popularTimesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  popularTimesTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  popularTimesDay: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  popularTimesChart: {
    position: 'relative',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#343434',
    backgroundColor: '#181818',
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 10,
  },
  popularTimesBaseline: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 34,
    height: 1,
    backgroundColor: '#2f2f2f',
  },
  popularTimesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  popularTimesBarGroup: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  popularTimesTrack: {
    height: POPULAR_TIMES_BAR_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
  },
  popularTimesFill: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  popularTimesFillBase: {
    backgroundColor: '#5b5b5b',
  },
  popularTimesFillPeak: {
    backgroundColor: '#d8d8d8',
  },
  popularTimesFillCurrent: {
    backgroundColor: '#f1c232',
    borderWidth: 1,
    borderColor: '#ffe599',
  },
  popularTimesFillCurrentCustom: {
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  popularTimesNowLabel: {
    marginBottom: 8,
    color: '#ffe599',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  popularTimesNowLabelHidden: {
    color: 'transparent',
  },
  popularTimesLabel: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  popularTimesLabelCurrent: {
    color: '#ffe599',
    fontWeight: '700',
  },
  popularTimesLabelHidden: {
    color: 'transparent',
  },
  btn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
