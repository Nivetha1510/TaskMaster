import React, { useMemo } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

export default function SearchBar({ value, onChangeText, placeholder = 'Search tasks' }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      <Feather name="search" size={20} color={COLORS.textSecondary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityLabel="Clear search"
        >
          <Feather name="x" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    height: SIZES.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBackground,
  },
  input: {
    ...TYPOGRAPHY.input,
    flex: 1,
    color: COLORS.textPrimary,
    marginHorizontal: SPACING.md,
  },
});
