import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';

export default function BackButton({ onPress, style }) {
  const navigation = useNavigation();

  function handlePress() {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  }

  return (
    <Pressable onPress={handlePress} style={[styles.button, style]} accessibilityLabel="Go back">
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors.ink}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M15 18l-6-6 6-6" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...theme.clayShadowButton,
  },
});
