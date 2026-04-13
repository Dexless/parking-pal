import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Mapbox from './mapbox';
import { buildLotPolygonGeoJson } from './mapLotGeoJson';

export type MapboxViewHandle = {
  reset: () => void;
  getCenter: () => Promise<[number, number] | null>;
  getAimCoordinate: (verticalOffsetPx?: number) => Promise<[number, number] | null>;
};

export type MapboxMarker = {
  id: number;
  name: string;
  coordinate: [number, number];
  detail?: string;
};

type MapboxViewProps = {
  style?: StyleProp<ViewStyle>;
  centerCoordinate: [number, number];
  zoomLevel: number;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  interactive?: boolean;
  bounds?: {
    ne: [number, number];
    sw: [number, number];
  };
  markers?: MapboxMarker[];
  onMarkerPress?: (id: number) => void;
  lotFullnessById?: Record<string, number>;
};

const MapboxView = forwardRef<MapboxViewHandle, MapboxViewProps>(
  (
    {
      style,
      centerCoordinate,
      zoomLevel,
      pointerEvents = 'auto',
      interactive = false,
      bounds,
      markers,
      onMarkerPress,
      lotFullnessById,
    },
    ref
  ) => {
    const cameraRef = useRef<Mapbox.Camera>(null);
    const mapViewRef = useRef<Mapbox.MapView>(null);
    const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
    const lotPolygonGeoJson = useMemo(
      () => buildLotPolygonGeoJson(lotFullnessById),
      [lotFullnessById]
    );
    const markerGeoJson = useMemo<GeoJSON.FeatureCollection>(() => {
      const features: GeoJSON.Feature[] = (markers ?? [])
        .filter(
          (marker) =>
            Number.isFinite(marker.coordinate[0]) &&
            Number.isFinite(marker.coordinate[1])
        )
        .map((marker) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: marker.coordinate,
          },
          properties: {
            id: marker.id,
            name: marker.name,
          },
        }));
      return {
        type: 'FeatureCollection',
        features,
      };
    }, [markers]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        cameraRef.current?.setCamera({
          centerCoordinate,
          zoomLevel,
          pitch: 0,
          heading: 0,
        });
      },
      getCenter: async () => {
        const center = await mapViewRef.current?.getCenter();
        if (!center || center.length < 2) {
          return null;
        }
        const [lng, lat] = center;
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
          return null;
        }
        return [lng, lat];
      },
      getAimCoordinate: async (verticalOffsetPx = 0) => {
        if (!mapViewRef.current) {
          return null;
        }
        if (mapSize.width <= 0 || mapSize.height <= 0) {
          const center = await mapViewRef.current.getCenter();
          if (!center || center.length < 2) {
            return null;
          }
          const [lng, lat] = center;
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return null;
          }
          return [lng, lat];
        }

        try {
          const point: [number, number] = [
            mapSize.width / 2,
            mapSize.height / 2 + verticalOffsetPx,
          ];
          const coordinate = await mapViewRef.current.getCoordinateFromView(point);
          if (!coordinate || coordinate.length < 2) {
            return null;
          }
          const [lng, lat] = coordinate;
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return null;
          }
          return [lng, lat];
        } catch {
          const center = await mapViewRef.current.getCenter();
          if (!center || center.length < 2) {
            return null;
          }
          const [lng, lat] = center;
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return null;
          }
          return [lng, lat];
        }
      },
    }));

    return (
      <Mapbox.MapView
        ref={mapViewRef}
        style={style}
        styleURL={Mapbox.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={interactive}
        rotateEnabled={interactive}
        pointerEvents={pointerEvents}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setMapSize({ width, height });
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={zoomLevel}
          centerCoordinate={centerCoordinate}
          pitch={0}
          heading={0}
          bounds={bounds}
        />
        <Mapbox.ShapeSource
          id="parking-pal-geojson-source"
          shape={lotPolygonGeoJson}
          onPress={(event) => {
            const feature = event.features?.[0] as { properties?: { lot_id?: number | string } } | undefined;
            const rawLotId = feature?.properties?.lot_id;
            const lotId = typeof rawLotId === 'number' ? rawLotId : Number(rawLotId);
            if (Number.isFinite(lotId) && lotId >= 0) {
              onMarkerPress?.(lotId);
            }
          }}
        >
          <Mapbox.FillLayer
            id="parking-pal-geojson-fill"
            style={{
              fillColor: [
                'case',
                ['==', ['get', 'percent_full'], null], '#4b5563',
                ['>=', ['get', 'percent_full'], 95], '#cc0000',
                ['>=', ['get', 'percent_full'], 85], '#e69138',
                ['>=', ['get', 'percent_full'], 60], '#f1c232',
                ['>=', ['get', 'percent_full'], 30], '#6aa84f',
                '#3d85c6',
              ] as any,
              fillOpacity: 0.5,
            }}
          />
          <Mapbox.LineLayer
            id="parking-pal-geojson-line"
            style={{
              lineColor: '#f3f4f6',
              lineWidth: 1.5,
              lineOpacity: 0.9,
            }}
          />
        </Mapbox.ShapeSource>
        {markerGeoJson.features.length > 0 ? (
          <Mapbox.ShapeSource
            id="parking-pal-marker-source"
            shape={markerGeoJson}
            onPress={(event) => {
              const feature = event.features?.[0] as { properties?: { id?: number | string } } | undefined;
              const rawMarkerId = feature?.properties?.id;
              const markerId =
                typeof rawMarkerId === 'number'
                  ? rawMarkerId
                  : Number(rawMarkerId);
              if (Number.isFinite(markerId)) {
                onMarkerPress?.(markerId);
              }
            }}
          >
            <Mapbox.CircleLayer
              id="parking-pal-marker-circle"
              style={{
                circleRadius: 6,
                circleColor: '#ef4444',
                circleOpacity: 0.95,
                circleStrokeWidth: 2,
                circleStrokeColor: '#f3f4f6',
              }}
            />
          </Mapbox.ShapeSource>
        ) : null}
      </Mapbox.MapView>
    );
  }
);

MapboxView.displayName = 'MapboxView';

export default MapboxView;
