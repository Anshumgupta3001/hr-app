import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { theme } from '../theme';

const FILLS = {
  primary: { backgroundColor: theme.colors.violet, color: theme.colors.white },
  secondary: { backgroundColor: theme.colors.white, color: theme.colors.ink },
  teal: { backgroundColor: theme.colors.teal, color: theme.colors.white },
  mustard: { backgroundColor: theme.colors.mustard, color: theme.colors.white },
};

export default function CandyButton({
  title,
  onPress,
  variant = 'primary',
  small = false,
  disabled = false,
  pill = false,
  style,
}) {
  const [pressed, setPressed] = useState(false);
  const radius = pill ? 999 : theme.radius.button;
  const fill = FILLS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        {
          opacity: disabled ? 0.5 : 1,
          alignSelf: pill ? 'flex-start' : 'stretch',
        },
        style,
      ]}
    >
      <View
        style={[
          styles.face,
          theme.clayShadowButton,
          {
            backgroundColor: fill.backgroundColor,
            borderRadius: radius,
            paddingVertical: small ? 10 : 15,
            paddingHorizontal: small ? 18 : 26,
            minHeight: small ? 0 : 56,
            transform: [{ scale: pressed && !disabled ? 0.92 : 1 }],
          },
        ]}
      >
        <Text
          style={{
            fontFamily: theme.fonts.bodyBold,
            fontSize: small ? 14 : 16,
            color: fill.color,
          }}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
