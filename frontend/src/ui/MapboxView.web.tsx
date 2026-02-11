import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';

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
  style?: object;
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
      markers,
      onMarkerPress,
    },
    ref
  ) => {
    const containerRef = useRef<any>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [mapReady, setMapReady] = useState(false);

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
      setMapReady(true);

      return () => {
        mapRef.current?.remove();
        mapRef.current = null;
        setMapReady(false);
      };
    }, [centerCoordinate, zoomLevel]);

    useEffect(() => {
      if (!mapReady || !mapRef.current) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (!markers?.length) return;

      markersRef.current = markers.map((marker) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '18px';
        wrapper.style.height = '18px';
        wrapper.style.pointerEvents = 'auto';

        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', marker.name);
        button.style.position = 'absolute';
        button.style.top = '0';
        button.style.left = '0';
        button.style.width = '18px';
        button.style.height = '18px';
        button.style.borderRadius = '50%';
        button.style.border = '2px solid #0b0b0b';
        button.style.background = '#e11d48';
        button.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.35)';
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => onMarkerPress?.(marker.id));

        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '26px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%) translateY(6px)';
        tooltip.style.background = '#111';
        tooltip.style.border = '1px solid #2f2f2f';
        tooltip.style.color = '#f5f5f5';
        tooltip.style.padding = '6px 8px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.fontSize = '12px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.4)';
        tooltip.style.opacity = '0';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.transition = 'opacity 160ms ease, transform 160ms ease';

        const title = document.createElement('div');
        title.textContent = marker.name;
        title.style.fontWeight = '700';
        title.style.marginBottom = '2px';

        const detail = document.createElement('div');
        detail.textContent = marker.detail ?? 'Loading…';
        detail.style.color = '#c7c7c7';

        tooltip.appendChild(title);
        tooltip.appendChild(detail);

        const showTooltip = () => {
          tooltip.style.opacity = '1';
          tooltip.style.transform = 'translateX(-50%) translateY(0)';
        };
        const hideTooltip = () => {
          tooltip.style.opacity = '0';
          tooltip.style.transform = 'translateX(-50%) translateY(6px)';
        };

        wrapper.addEventListener('mouseenter', showTooltip);
        wrapper.addEventListener('mouseleave', hideTooltip);
        wrapper.addEventListener('focusin', showTooltip);
        wrapper.addEventListener('focusout', hideTooltip);

        wrapper.appendChild(button);
        wrapper.appendChild(tooltip);

        return new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat(marker.coordinate)
          .addTo(mapRef.current!);
      });

      return () => {
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
      };
    }, [mapReady, markers, onMarkerPress]);

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
