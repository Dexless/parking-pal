import Mapbox from '@rnmapbox/maps';

const token =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ??
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  console.warn(
    'Missing EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN. Create frontend/.env and restart Expo.'
  );
} else {
  Mapbox.setAccessToken(token);
}

// optional
Mapbox.setTelemetryEnabled(false);

export default Mapbox;
