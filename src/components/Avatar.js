import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS } from '../theme/spacing';

// The user's profile photo, or their initial on a colored circle when they have none.
export default function Avatar({ name = '', photo, size, textStyle }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const shape = { width: size, height: size, borderRadius: RADIUS.round };

  if (photo) {
    return <Image source={{ uri: photo }} style={[styles.image, shape]} />;
  }
  return (
    <View style={[styles.fallback, shape]}>
      <Text style={[styles.initial, textStyle]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  image: {
    backgroundColor: COLORS.inputBackground,
  },
  fallback: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    ...TYPOGRAPHY.button,
    color: COLORS.textOnPrimary,
  },
});
