import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

// A wrapping row of single-choice pills. `options` is [{ value, label }].
export default function OptionChips({ options, value, onChange, style }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={[styles.row, style]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.label}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    height: SIZES.chipHeight,
    paddingHorizontal: SPACING.lg,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
  },
  text: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textPrimary,
  },
  textSelected: {
    color: COLORS.textOnPrimary,
  },
});
