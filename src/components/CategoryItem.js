import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

export default function CategoryItem({ category, onEdit }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.row}>
      <Text style={styles.name} numberOfLines={1}>
        {category.name}
      </Text>
      <TouchableOpacity
        onPress={onEdit}
        hitSlop={10}
        accessibilityLabel={`Edit ${category.name}`}
      >
        <Feather name="edit-2" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
  },
  name: {
    ...TYPOGRAPHY.body,
    flex: 1,
    color: COLORS.textPrimary,
    marginRight: SPACING.md,
  },
});
