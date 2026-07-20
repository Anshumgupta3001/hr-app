import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { theme } from '../theme';

function Blob({ color, position, delay }) {
  const { height } = useWindowDimensions();
  const size = height * 0.6;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, delay]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const translateY = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });

  return (
    <Animated.View
      style={[
        styles.blob,
        position,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateY }, { scale }],
        },
      ]}
    />
  );
}

const FULL_BLOBS = [
  { color: 'rgba(124, 58, 237, 0.1)', position: { top: '-12%', left: '-25%' }, delay: 0 },
  { color: 'rgba(219, 39, 119, 0.1)', position: { top: '20%', right: '-30%' }, delay: 2000 },
  { color: 'rgba(14, 165, 233, 0.1)', position: { bottom: '-18%', left: '10%' }, delay: 4000 },
];

const CALM_BLOBS = [
  { color: 'rgba(124, 58, 237, 0.1)', position: { top: '-15%', right: '-25%' }, delay: 0 },
  { color: 'rgba(14, 165, 233, 0.1)', position: { bottom: '-18%', left: '-25%' }, delay: 3000 },
];

export default function ConfettiBackground({ calm = false }) {
  const blobs = calm ? CALM_BLOBS : FULL_BLOBS;
  return (
    <>
      {blobs.map((blob, i) => (
        <Blob key={i} color={blob.color} position={blob.position} delay={blob.delay} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
});
