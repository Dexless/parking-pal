import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import {
  buildLotPolygonGeoJson,
  DEFAULT_LOT_POLYGON_GEOJSON,
} from './mapLotGeoJson';

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
  lotFullnessById?: Record<string, number>;
};

const GEOJSON_SOURCE_ID = 'parking-pal-geojson-source';
const GEOJSON_FILL_LAYER_ID = 'parking-pal-geojson-fill';
const GEOJSON_LINE_LAYER_ID = 'parking-pal-geojson-line';

const ensureGeoJsonLayer = (map: mapboxgl.Map) => {
  if (!map.getSource(GEOJSON_SOURCE_ID)) {
    map.addSource(GEOJSON_SOURCE_ID, {
      type: 'geojson',
      data: DEFAULT_LOT_POLYGON_GEOJSON as GeoJSON.FeatureCollection,
    });
  }
  if (!map.getLayer(GEOJSON_FILL_LAYER_ID)) {
    map.addLayer({
      id: GEOJSON_FILL_LAYER_ID,
      type: 'fill',
      source: GEOJSON_SOURCE_ID,
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'percent_full'], null], '#4b5563',
          ['>=', ['get', 'percent_full'], 95], '#cc0000',
          ['>=', ['get', 'percent_full'], 85], '#e69138',
          ['>=', ['get', 'percent_full'], 60], '#f1c232',
          ['>=', ['get', 'percent_full'], 30], '#6aa84f',
          '#3d85c6',
        ],
        'fill-opacity': 0.5,
      },
    });
  }
  if (!map.getLayer(GEOJSON_LINE_LAYER_ID)) {
    map.addLayer({
      id: GEOJSON_LINE_LAYER_ID,
      type: 'line',
      source: GEOJSON_SOURCE_ID,
      paint: {
        'line-color': '#f3f4f6',
        'line-width': 1.5,
        'line-opacity': 0.9,
      },
    });
  }
};

const token =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ??
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  console.warn(
    'Missing EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN. Set it in frontend/.env (or shell env) and restart Expo.'
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
      lotFullnessById,
    },
    ref
  ) => {
    const containerRef = useRef<any>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const lotPopupRef = useRef<mapboxgl.Popup | null>(null);
    const isHoveringMarkerRef = useRef(false);
    const [mapReady, setMapReady] = useState(false);
    const lotPolygonGeoJson = useMemo(
      () => buildLotPolygonGeoJson(lotFullnessById),
      [lotFullnessById]
    );

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
      getCenter: async () => {
        if (!mapRef.current) {
          return null;
        }
        const center = mapRef.current.getCenter();
        if (!Number.isFinite(center.lng) || !Number.isFinite(center.lat)) {
          return null;
        }
        return [center.lng, center.lat];
      },
      getAimCoordinate: async (verticalOffsetPx = 0) => {
        if (!mapRef.current) {
          return null;
        }
        const canvas = mapRef.current.getCanvas();
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
          const center = mapRef.current.getCenter();
          return [center.lng, center.lat];
        }

        const target = mapRef.current.unproject([
          width / 2,
          height / 2 + verticalOffsetPx,
        ]);
        if (!Number.isFinite(target.lng) || !Number.isFinite(target.lat)) {
          return null;
        }
        return [target.lng, target.lat];
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
      mapRef.current.on('load', () => {
        if (!mapRef.current) return;
        ensureGeoJsonLayer(mapRef.current);
        setMapReady(true);
      });

      return () => {
        lotPopupRef.current?.remove();
        lotPopupRef.current = null;
        mapRef.current?.remove();
        mapRef.current = null;
        setMapReady(false);
      };
    }, [centerCoordinate, zoomLevel, interactive, bounds]);

    useEffect(() => {
      if (!mapReady || !mapRef.current) return;
      const source = mapRef.current.getSource(
        GEOJSON_SOURCE_ID
      ) as mapboxgl.GeoJSONSource | undefined;
      source?.setData(lotPolygonGeoJson as GeoJSON.FeatureCollection);
    }, [mapReady, lotPolygonGeoJson]);

    useEffect(() => {
      if (!mapReady || !mapRef.current) return;
      const map = mapRef.current;
      if (!lotPopupRef.current) {
        lotPopupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: '220px',
        });
      }
      const onLotClick = (event: mapboxgl.MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const rawLotId = feature?.properties?.lot_id;
        const lotId = typeof rawLotId === 'number' ? rawLotId : Number(rawLotId);
        if (Number.isFinite(lotId) && lotId >= 0) {
          onMarkerPress?.(lotId);
        }
      };
      const hidePopup = () => {
        lotPopupRef.current?.remove();
      };
      const onLotMouseMove = (event: mapboxgl.MapLayerMouseEvent) => {
        if (isHoveringMarkerRef.current) {
          hidePopup();
          return;
        }
        const feature = event.features?.[0];
        const lotName = String(feature?.properties?.lot_name ?? 'Lot');
        const percentLabel = String(feature?.properties?.percent_label ?? 'No data');
        const coordinates = event.lngLat;
        lotPopupRef.current
          ?.setLngLat([coordinates.lng, coordinates.lat])
          .setHTML(
            `<div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; font-size: 12px; line-height: 1.35;"><strong>${lotName}</strong><br/>${percentLabel}</div>`
          )
          .addTo(map);
      };
      const onLotMouseLeave = () => {
        clearPointerCursor();
        hidePopup();
      };
      const setPointerCursor = () => {
        if (!interactive || isHoveringMarkerRef.current) {
          return;
        }
        map.getCanvas().style.cursor = 'pointer';
      };
      const clearPointerCursor = () => {
        map.getCanvas().style.cursor = '';
      };

      map.on('click', GEOJSON_FILL_LAYER_ID, onLotClick);
      map.on('mousemove', GEOJSON_FILL_LAYER_ID, onLotMouseMove);
      map.on('mouseenter', GEOJSON_FILL_LAYER_ID, setPointerCursor);
      map.on('mouseleave', GEOJSON_FILL_LAYER_ID, onLotMouseLeave);

      return () => {
        map.off('click', GEOJSON_FILL_LAYER_ID, onLotClick);
        map.off('mousemove', GEOJSON_FILL_LAYER_ID, onLotMouseMove);
        map.off('mouseenter', GEOJSON_FILL_LAYER_ID, setPointerCursor);
        map.off('mouseleave', GEOJSON_FILL_LAYER_ID, onLotMouseLeave);
        hidePopup();
        clearPointerCursor();
      };
    }, [mapReady, onMarkerPress, interactive]);

    useEffect(() => {
      if (!mapReady || !mapRef.current) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      isHoveringMarkerRef.current = false;
      lotPopupRef.current?.remove();

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
          isHoveringMarkerRef.current = true;
          lotPopupRef.current?.remove();
          if (interactive) {
            mapRef.current?.getCanvas().style.setProperty('cursor', '');
          }
          tooltip.style.opacity = '1';
          tooltip.style.transform = 'translateX(-50%) translateY(0)';
        };
        const hideTooltip = () => {
          isHoveringMarkerRef.current = false;
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
        isHoveringMarkerRef.current = false;
      };
    }, [mapReady, markers, onMarkerPress, interactive]);

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
