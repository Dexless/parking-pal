import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Mapbox from './mapbox';

export type MapboxViewHandle = {
  reset: () => void;
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
    },
    ref
  ) => {
    const cameraRef = useRef<Mapbox.Camera>(null);

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
      </Mapbox.MapView>
    );
  }
);

MapboxView.displayName = 'MapboxView';

export default MapboxView;
