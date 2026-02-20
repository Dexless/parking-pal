import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Mapbox from './mapbox';
import { buildLotPolygonGeoJson } from './mapLotGeoJson';

export type MapboxViewHandle = {
  reset: () => void;
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
      onMarkerPress,
      lotFullnessById,
    },
    ref
  ) => {
    const cameraRef = useRef<Mapbox.Camera>(null);
    const lotPolygonGeoJson = useMemo(
      () => buildLotPolygonGeoJson(lotFullnessById),
      [lotFullnessById]
    );

    useImperativeHandle(ref, () => ({
      reset: () => {
        cameraRef.current?.setCamera({
          centerCoordinate,
          zoomLevel,
          pitch: 0,
          heading: 0,
        });
      },
    }));

    return (
      <Mapbox.MapView
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
      </Mapbox.MapView>
    );
  }
);

MapboxView.displayName = 'MapboxView';

export default MapboxView;
