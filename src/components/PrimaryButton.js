import React, { useMemo } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES } from '../theme/spacing';

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        isDanger
          ? [styles.buttonDanger, pressed && styles.buttonDangerPressed]
          : (pressed || disabled) && styles.buttonDark,
        style,
      ]}
    >
      <Text style={[styles.text, isDanger && styles.textDanger]}>{title}</Text>
    </Pressable>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  button: {
    height: SIZES.buttonHeight,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDark: {
    backgroundColor: COLORS.primaryPressed,
  },
  buttonDanger: {
    backgroundColor: COLORS.background,
    borderWidth: SIZES.outlineBorder,
    borderColor: COLORS.error,
  },
  buttonDangerPressed: {
    backgroundColor: COLORS.inputBackground,
  },
  text: {
    ...TYPOGRAPHY.button,
    color: COLORS.textOnPrimary,
  },
  textDanger: {
    color: COLORS.error,
  },
});