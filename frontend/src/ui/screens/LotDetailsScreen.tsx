// src/app/screens/LotDetailsScreen.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../RootNavigator';
import { LOTS } from '../data/campusLots';
import { fetchLotData, Lot as LotData } from '../../api/lotApi';


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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lot.name}</Text>
      <Text style={styles.sub}>ID: {lot.id}</Text>

      <View style={styles.card}>
        <Text style={styles.h}>Status</Text>

        {lotData ? (
          <>
            <Text>
              Open spots: {lotData.total_capacity - lotData.current}
            </Text>
            <Text>Capacity: {lotData.total_capacity}</Text>
            <Text>Currently parked: {lotData.current}</Text>
            <Text>Percent full: {lotData.percent_full}%</Text>
            <Text>Crowd: {lotData.state}</Text>
            <Text>Hours: {lotData.hours}</Text>
            <Text>Type: {lotData.type}</Text>
          </>
        ) : (
          <>
            <Text>Open spots: —</Text>
            <Text>Capacity: —</Text>
            <Text>Hours: —</Text>
            <Text>Type: —</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  sub: { color: '#666', marginBottom: 16 },
  card: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, gap: 6 },
  h: { fontWeight: '700', marginBottom: 4 },
  btn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
