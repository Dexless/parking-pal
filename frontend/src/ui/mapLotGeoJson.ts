import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  LineString,
  Polygon,
  Position,
} from 'geojson';
import parkingPalGeoJsonFile from '../../assets/Parking-Pal.json';
import { LOTS } from './data/campusLots';

type RawFeature = Feature<LineString | Polygon, GeoJsonProperties>;
type RawFeatureCollection = FeatureCollection<LineString | Polygon, GeoJsonProperties>;

export type LotPolygonProperties = {
  lot_id: number;
  lot_name: string;
  fillColor: string;
  percent_full: number | null;
  percent_label: string;
};

export type LotPolygonCollection = FeatureCollection<Polygon, LotPolygonProperties>;

const lotIdByName = new Map(LOTS.map((lot) => [lot.name, lot.id]));

const parseRawGeoJson = (): RawFeatureCollection => {
  if (
    parkingPalGeoJsonFile &&
    typeof parkingPalGeoJsonFile === 'object' &&
    'type' in parkingPalGeoJsonFile &&
    (parkingPalGeoJsonFile as RawFeatureCollection).type === 'FeatureCollection'
  ) {
    return parkingPalGeoJsonFile as RawFeatureCollection;
  }

  const rawFeatures =
    parkingPalGeoJsonFile &&
    typeof parkingPalGeoJsonFile === 'object' &&
    'features' in parkingPalGeoJsonFile &&
    Array.isArray((parkingPalGeoJsonFile as { features?: unknown[] }).features)
      ? (parkingPalGeoJsonFile as { features: unknown[] }).features
      : [];

  return {
    type: 'FeatureCollection',
    features: rawFeatures as RawFeature[],
  };
};

const closeRing = (coordinates: Position[]): Position[] => {
  if (coordinates.length < 3) return [];
  const ring = coordinates.map(([lng, lat]) => [Number(lng), Number(lat)] as Position);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }
  return ring.length >= 4 ? ring : [];
};

const resolveLotIdentity = (properties: GeoJsonProperties): { lotId: number; lotName: string } => {
  const props = properties ?? {};
  const namedEntry = Object.entries(props).find(([key]) => /^P\d+$/i.test(key));

  let lotName = namedEntry?.[0]?.toUpperCase() ?? '';
  let lotId: number | undefined;

  if (namedEntry) {
    const rawId = namedEntry[1];
    if (typeof rawId === 'number' && Number.isFinite(rawId)) {
      lotId = rawId;
    } else if (typeof rawId === 'string' && rawId.trim() !== '') {
      const parsed = Number(rawId);
      if (Number.isFinite(parsed)) lotId = parsed;
    }
  }

  if (!lotName && typeof props.lot_name === 'string') {
    lotName = props.lot_name.toUpperCase();
  }
  if (lotId === undefined && typeof props.lot_id === 'number' && Number.isFinite(props.lot_id)) {
    lotId = props.lot_id;
  }
  if (lotId === undefined && lotName) {
    lotId = lotIdByName.get(lotName);
  }

  return {
    lotId: lotId ?? -1,
    lotName: lotName || `LOT_${lotId ?? 'UNKNOWN'}`,
  };
};

const clampPercent = (value: number | undefined): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
};

const colorForFullness = (percentFull: number | null): string => {
  if (percentFull === null) return '#4b5563';
  if (percentFull >= 95) return '#cc0000';
  if (percentFull >= 85) return '#e69138';
  if (percentFull >= 60) return '#f1c232';
  if (percentFull >= 30) return '#6aa84f';
  return '#3d85c6';
};

const isPointOnSegment = (
  [lng, lat]: [number, number],
  [startLng, startLat]: Position,
  [endLng, endLat]: Position
): boolean => {
  const cross =
    (lat - Number(startLat)) * (Number(endLng) - Number(startLng)) -
    (lng - Number(startLng)) * (Number(endLat) - Number(startLat));
  if (Math.abs(cross) > 1e-10) return false;

  const minLng = Math.min(Number(startLng), Number(endLng));
  const maxLng = Math.max(Number(startLng), Number(endLng));
  const minLat = Math.min(Number(startLat), Number(endLat));
  const maxLat = Math.max(Number(startLat), Number(endLat));
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
};

const isPointInRing = (point: [number, number], ring: Position[]): boolean => {
  const [lng, lat] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const start = ring[j];
    const end = ring[i];
    const startLng = Number(start[0]);
    const startLat = Number(start[1]);
    const endLng = Number(end[0]);
    const endLat = Number(end[1]);

    if (
      !Number.isFinite(startLng) ||
      !Number.isFinite(startLat) ||
      !Number.isFinite(endLng) ||
      !Number.isFinite(endLat)
    ) {
      continue;
    }

    if (isPointOnSegment(point, start, end)) {
      return true;
    }

    const intersects =
      startLat > lat !== endLat > lat &&
      lng < ((endLng - startLng) * (lat - startLat)) / (endLat - startLat) + startLng;
    if (intersects) inside = !inside;
  }

  return inside;
};

export const findLotContainingCoordinate = (
  coordinate: [number, number]
): { lotId: number; lotName: string } | null => {
  const [lng, lat] = coordinate;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  const raw = parseRawGeoJson();
  for (const feature of raw.features) {
    if (!feature?.geometry) continue;
    const { lotId, lotName } = resolveLotIdentity(feature.properties);
    const rawCoordinates =
      feature.geometry.type === 'LineString'
        ? feature.geometry.coordinates
        : feature.geometry.coordinates[0];
    const ring = closeRing(rawCoordinates as Position[]);
    if (!ring.length) continue;
    if (isPointInRing(coordinate, ring)) {
      return { lotId, lotName };
    }
  }

  return null;
};

export const buildLotPolygonGeoJson = (
  lotFullnessById?: Record<string, number>
): LotPolygonCollection => {
  const raw = parseRawGeoJson();
  const features: Feature<Polygon, LotPolygonProperties>[] = [];

  raw.features.forEach((feature, index) => {
    if (!feature?.geometry) return;
    const { lotId, lotName } = resolveLotIdentity(feature.properties);
    const rawCoordinates =
      feature.geometry.type === 'LineString'
        ? feature.geometry.coordinates
        : feature.geometry.coordinates[0];
    const ring = closeRing(rawCoordinates as Position[]);
    if (!ring.length) return;

    const percentFull = clampPercent(
      lotFullnessById?.[String(lotId)] ??
      (lotName ? lotFullnessById?.[lotName] : undefined)
    );
    features.push({
      type: 'Feature',
      id: feature.id ?? `${lotName}-${index}`,
      properties: {
        lot_id: lotId,
        lot_name: lotName,
        percent_full: percentFull,
        percent_label: percentFull === null ? 'No data' : `${percentFull.toFixed(1)}% full`,
        fillColor: colorForFullness(percentFull),
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    });
  });

  return {
    type: 'FeatureCollection',
    features,
  };
};

export const DEFAULT_LOT_POLYGON_GEOJSON = buildLotPolygonGeoJson();
