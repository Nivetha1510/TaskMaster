import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS, SIZES } from '../theme/spacing';

export default function Checkbox({ checked, onPress }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.box, checked && styles.boxChecked]}
    >
      {checked && <Feather name="check" size={16} color={COLORS.textOnPrimary} />}
    </TouchableOpacity>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  box: {
    width: SIZES.checkbox,
    height: SIZES.checkbox,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});