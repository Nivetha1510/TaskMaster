import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Checkbox from './Checkbox';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';
import { formatDueDate } from '../utils/date';
import { formatEstimate, getPriorityColor, getPriorityLabel, getRepeatLabel } from '../data/taskOptions';

function MetaItem({ icon, text, color }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const tint = color ?? COLORS.textSecondary;
  return (
    <View style={styles.metaItem}>
      <Feather name={icon} size={14} color={tint} />
      <Text style={[styles.metaText, { color: tint }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export default function TaskItem({
  task,
  categoryName,
  onPress,
  onToggle,
  onToggleFavorite,
  onMenu,
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.card}>
      <Checkbox checked={task.completed} onPress={onToggle} />

      <TouchableOpacity style={styles.textArea} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.titleRow}>
          {task.pinned ? (
            <Ionicons name="pin" size={14} color={COLORS.primary} style={styles.pinIcon} />
          ) : null}
          <View
            style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority, COLORS) }]}
            accessible
            accessibilityLabel={`${getPriorityLabel(task.priority)} priority`}
          />
          <Text
            style={[styles.title, task.completed && styles.titleCompleted]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
        </View>
        <View style={styles.meta}>
          <MetaItem icon="tag" text={categoryName} />
          {task.estimate ? <MetaItem icon="clock" text={formatEstimate(task.estimate)} /> : null}
          {task.dueDate ? <MetaItem icon="calendar" text={formatDueDate(task)} /> : null}
          {task.repeat ? (
            <MetaItem icon="repeat" text={`Repeats ${getRepeatLabel(task.repeat).toLowerCase()}`} />
          ) : null}
        </View>
      </TouchableOpacity>

      {onToggleFavorite ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onToggleFavorite}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={
            task.favorite ? `Remove ${task.title} from favorites` : `Add ${task.title} to favorites`
          }
          accessibilityState={{ selected: Boolean(task.favorite) }}
        >
          <Ionicons
            name={task.favorite ? 'star' : 'star-outline'}
            size={22}
            color={task.favorite ? COLORS.favorite : COLORS.textSecondary}
          />
        </TouchableOpacity>
      ) : null}

      {onMenu ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMenu}
          hitSlop={10}
          accessibilityLabel={`More options for ${task.title}`}
        >
          <Feather name="more-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.background,
  },
  textArea: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: SPACING.xs,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
    marginRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.taskTitle,
    flexShrink: 1,
    color: COLORS.textPrimary,
  },
  titleCompleted: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: SPACING.xs,
  },
  metaText: {
    ...TYPOGRAPHY.secondary,
    marginLeft: SPACING.xs,
  },
  iconButton: {
    marginLeft: SPACING.md,
    padding: SPACING.xs,
  },
});
