import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { COLORS } from './screens/colors';

const NOTIFICATION_IN_MS = 500;
const NOTIFICATION_HOLD_MS = 2000;
const NOTIFICATION_OUT_MS = 500;

type VehicleEventNotification = {
  id: number;
  message: string;
};

type VehicleEventNotificationContextValue = {
  hideVehicleEventNotification: () => void;
  showVehicleEventNotification: (message: string) => void;
};

const VehicleEventNotificationContext =
  createContext<VehicleEventNotificationContextValue | null>(null);

export function VehicleEventNotificationProvider({
  children,
}: PropsWithChildren) {
  const { height } = useWindowDimensions();
  const [notification, setNotification] =
    useState<VehicleEventNotification | null>(null);
  const notificationProgress = useRef(new Animated.Value(0)).current;
  const activeNotificationId = useRef<number | null>(null);
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const notificationTopOffset = Math.max(5, Math.min(14, height * 0.0125));
  const notificationTranslateY = notificationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const notificationScale = notificationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  const hideVehicleEventNotification = useCallback(() => {
    activeAnimation.current?.stop();
    activeAnimation.current = null;
    activeNotificationId.current = null;
    notificationProgress.setValue(0);
    setNotification(null);
  }, [notificationProgress]);

  const showVehicleEventNotification = useCallback(
    (message: string) => {
      const id = Date.now();
      const nextNotification = { id, message };
      activeAnimation.current?.stop();
      activeNotificationId.current = id;
      notificationProgress.setValue(0);
      setNotification(nextNotification);

      const animation = Animated.sequence([
        Animated.timing(notificationProgress, {
          toValue: 1,
          duration: NOTIFICATION_IN_MS,
          useNativeDriver: true,
        }),
        Animated.delay(NOTIFICATION_HOLD_MS),
        Animated.timing(notificationProgress, {
          toValue: 0,
          duration: NOTIFICATION_OUT_MS,
          useNativeDriver: true,
        }),
      ]);

      activeAnimation.current = animation;
      animation.start(({ finished }) => {
        if (finished && activeNotificationId.current === id) {
          activeAnimation.current = null;
          setNotification(null);
        }
      });
    },
    [notificationProgress]
  );

  return (
    <VehicleEventNotificationContext.Provider
      value={{ hideVehicleEventNotification, showVehicleEventNotification }}
    >
      <View style={styles.root}>
        {children}
        {notification ? (
          <View
            pointerEvents="none"
            style={[
              styles.notificationLayer,
              { paddingTop: notificationTopOffset },
            ]}
          >
            <Animated.View
              style={[
                styles.notificationBanner,
                {
                  opacity: notificationProgress,
                  transform: [
                    { translateY: notificationTranslateY },
                    { scale: notificationScale },
                  ],
                },
              ]}
            >
              <Text
                style={styles.notificationText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {notification.message}
              </Text>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </VehicleEventNotificationContext.Provider>
  );
}

export function useVehicleEventNotification() {
  const value = useContext(VehicleEventNotificationContext);
  if (!value) {
    throw new Error(
      'useVehicleEventNotification must be used within VehicleEventNotificationProvider'
    );
  }
  return value;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  notificationLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    zIndex: 1000,
    elevation: 1000,
  },
  notificationBanner: {
    minHeight: 40,
    maxHeight: 48,
    maxWidth: '88%',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3d3d3d',
    backgroundColor: 'rgba(31,31,31,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  notificationText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
