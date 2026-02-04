import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';

export type MapboxViewHandle = {
  reset: () => void;
};

type MapboxViewProps = {
  style?: object;
  centerCoordinate: [number, number];
  zoomLevel: number;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  interactive?: boolean;
  bounds?: {
    ne: [number, number];
    sw: [number, number];
  };
};

const token =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ??
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  console.warn(
    'Missing EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN. Create frontend/.env and restart Expo.'
  );
}

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
    const containerRef = useRef<any>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        mapRef.current?.easeTo({
          center: centerCoordinate,
          zoom: zoomLevel,
          bearing: 0,
          pitch: 0,
          duration: 300,
        });
      },
    }));

    useEffect(() => {
      if (!containerRef.current || !token) return;
      mapboxgl.accessToken = token;

      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: centerCoordinate,
        zoom: zoomLevel,
        interactive,
        attributionControl: false,
      });
      if (bounds) {
        mapRef.current.setMaxBounds([bounds.sw, bounds.ne]);
      }
      mapRef.current.resize();

      return () => {
        mapRef.current?.remove();
        mapRef.current = null;
      };
    }, [centerCoordinate, zoomLevel]);

    useEffect(() => {
      if (!containerRef.current || !mapRef.current) return;
      const element = containerRef.current as HTMLElement;
      const resize = () => mapRef.current?.resize();
      if (typeof ResizeObserver === 'undefined') {
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
      }
      const observer = new ResizeObserver(() => resize());
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    return (
      <View ref={containerRef} style={style} pointerEvents={pointerEvents} />
    );
  }
);

MapboxView.displayName = 'MapboxView';

export default MapboxView;
