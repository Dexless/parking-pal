// src/app/screens/LotDetailsScreen.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../RootNavigator';
import { LOTS } from '../data/campusLots';
import { fetchLotData, Lot as LotData } from '../../api/lotApi';
import { COLORS } from './colors';


type DetailsRoute = RouteProp<RootStackParamList, 'LotDetails'>;

export default function LotDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailsRoute>();
  const { lotId } = route.params;
  console.log("[LotDetailsScreen] lotId:", lotId, "type:", typeof lotId);

  const lot = useMemo(() => LOTS.find(l => l.id === lotId), [lotId]);

  const [lotData, setLotData] = useState<LotData | null>(null);


  useEffect(() => {
    fetchLotData(lotId)
      .then(setLotData)
      .catch(err => {
        console.error('Failed to fetch lot from API', err);
      });
  }, [lotId]);

  if (!lot) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lot not found</Text>
        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  //Make all the text display white.

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lot.name}</Text>
      <Text style={styles.sub}>ID: {lot.id}</Text>

      <View style={styles.card}>
        <Text style={styles.h}>Status</Text>

        {lotData ? (
          <>
              <Text style={{ color: '#fff' }}>Open spots: {lotData.total_capacity - lotData.current}</Text>
            <Text style={{ color: '#fff' }}>Capacity: {lotData.total_capacity}</Text>
            <Text style={{ color: '#fff' }}>Currently parked: {lotData.current}</Text>
            <Text style={{ color: '#fff' }}>Percent full: {lotData.percent_full}%</Text>
            <Text style={{ color: '#fff' }}>Crowd: {lotData.state}</Text>
            <Text style={{ color: '#fff' }}>Hours: {lotData.hours}</Text>
            <Text style={{ color: '#fff' }}>Type: {lotData.type}</Text>
          </>
        ) : (
          <>
            <Text style={{ color: '#fff' }}>Open spots: —</Text>
            <Text style={{ color: '#fff' }}>Capacity: —</Text>
            <Text style={{ color: '#fff' }}>Hours: —</Text>
            <Text style={{ color: '#fff' }}>Type: —</Text>
          </>
        )}
      </View>

      <Pressable
        style={[styles.btn, { marginTop: 16 }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.btnText}>Back to Map</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  sub: {
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  h: {
    fontWeight: '700',
    marginBottom: 4,
    color: COLORS.textPrimary,
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
