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
