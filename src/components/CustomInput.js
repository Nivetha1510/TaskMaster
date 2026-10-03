import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

export default function CustomInput({
  placeholder,
  value,
  onChangeText,
  onPress,
  error,
  ...textInputProps
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const hasValue = Boolean(value);

  return (
    <View style={styles.wrapper}>
      {onPress ? (
        <TouchableOpacity style={styles.field} onPress={onPress} activeOpacity={0.7}>
          <Text
            style={[styles.text, !hasValue && styles.placeholder]}
            numberOfLines={1}
          >
            {hasValue ? value : placeholder}
          </Text>
        </TouchableOpacity>
      ) : (
        <TextInput
          style={[styles.field, styles.text]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          {...textInputProps}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  field: {
    height: SIZES.inputHeight,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBackground,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    ...TYPOGRAPHY.input,
    color: COLORS.textPrimary,
  },
  placeholder: {
    color: COLORS.textSecondary,
  },
  error: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});