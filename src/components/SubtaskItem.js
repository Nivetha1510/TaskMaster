import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Checkbox from './Checkbox';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

export default function SubtaskItem({ subtask, onToggle, onRemove }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.row}>
      {onToggle ? <Checkbox checked={subtask.completed} onPress={onToggle} /> : null}

      <Text style={[styles.title, onToggle && styles.titleWithCheckbox]}>
        {subtask.title}
      </Text>

      {onRemove ? (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={10}
          accessibilityLabel={`Remove ${subtask.title}`}
        >
          <Feather name="x" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.body,
    flex: 1,
    color: COLORS.textPrimary,
  },
  titleWithCheckbox: {
    marginLeft: SPACING.lg,
  },
});