import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Checkbox from './Checkbox';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

export default function CompletedItem({ title, completedOn, onUndo, onDelete }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.row}>
      <Checkbox checked onPress={onUndo} />
      <View style={styles.textArea}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.completedOn}>{`Completed on ${completedOn}`}</Text>
      </View>
      {onDelete ? (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={10}
          accessibilityLabel={`Delete ${title}`}
        >
          <Feather name="trash-2" size={20} color={COLORS.error} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  textArea: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  deleteButton: {
    marginLeft: SPACING.md,
    padding: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.taskTitle,
    color: COLORS.textPrimary,
  },
  completedOn: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
  },
});
