import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OptionChips from './OptionChips';
import PrimaryButton from './PrimaryButton';
import { useApp } from '../context/AppContext';
import { getRecommendations } from '../utils/recommend';
import { formatDueDate } from '../utils/date';
import { formatEstimate, getPriorityColor } from '../data/taskOptions';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

const TIME_OPTIONS = [
  { value: null, label: 'Any time' },
  { value: 10, label: '10 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
];

// "What should I do now?" - pick how much time you have and get the best task for it,
// plus the other tasks that fit in that time.
export default function DoNowModal({ visible, onClose, onOpenTask }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask, getCategoryName } = useApp();

  const [available, setAvailable] = useState(null);
  const [skipped, setSkipped] = useState(0);

  // Start fresh each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setAvailable(null);
      setSkipped(0);
    }
  }, [visible]);

  const handleTimeChange = (value) => {
    setAvailable(value);
    setSkipped(0);
  };

  const results = visible ? getRecommendations(tasks, available) : [];
  const pick = results.length > 0 ? results[skipped % results.length] : null;
  const others = results.filter((result) => result !== pick);

  const timeText = available === null ? '' : ` in ${available === 60 ? '1 hour' : `${available} min`}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* The inner Pressable stops taps on the sheet from closing it */}
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}
          onPress={() => {}}
        >
          <Text style={styles.title}>What should I do now?</Text>
          <Text style={styles.label}>I have</Text>
          <OptionChips options={TIME_OPTIONS} value={available} onChange={handleTimeChange} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {pick ? (
              <View style={styles.pickCard}>
                <Text style={styles.pickLabel}>Do this next</Text>
                <View style={styles.pickTitleRow}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: getPriorityColor(pick.task.priority, COLORS) },
                    ]}
                  />
                  <Text style={styles.pickTitle}>{pick.task.title}</Text>
                </View>
                <Text style={styles.pickMeta}>
                  {[
                    getCategoryName(pick.task.categoryId),
                    formatEstimate(pick.minutes) + (pick.task.estimate ? '' : ' (assumed)'),
                    pick.task.dueDate ? formatDueDate(pick.task) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Text style={styles.reason}>{pick.reason}</Text>

                <View style={styles.pickActions}>
                  <PrimaryButton
                    title="Mark done"
                    onPress={() => toggleTask(pick.task.id)}
                    style={styles.pickButton}
                  />
                  <PrimaryButton
                    title="Open"
                    onPress={() => {
                      onClose();
                      onOpenTask(pick.task.id);
                    }}
                    style={styles.pickButton}
                  />
                </View>
                {results.length > 1 ? (
                  <TouchableOpacity
                    style={styles.skip}
                    onPress={() => setSkipped((previous) => previous + 1)}
                  >
                    <Text style={styles.skipText}>Suggest another</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="checkmark-circle-outline" size={36} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>
                  {tasks.some((task) => !task.completed)
                    ? `Nothing fits${timeText}. Try a longer time, or set a shorter "Time needed" on your tasks.`
                    : 'You are all caught up. Nothing left to do!'}
                </Text>
              </View>
            )}

            {others.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>
                  {available === null ? 'Up next' : `Also fits${timeText}`} ({others.length})
                </Text>
                {others.map((result) => (
                  <TouchableOpacity
                    key={result.task.id}
                    style={styles.row}
                    onPress={() => {
                      onClose();
                      onOpenTask(result.task.id);
                    }}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: getPriorityColor(result.task.priority, COLORS) },
                      ]}
                    />
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {result.task.title}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {result.reason}
                      </Text>
                    </View>
                    <Text style={styles.rowTime}>{formatEstimate(result.minutes)}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    width: '100%',
    maxWidth: SIZES.sheetMaxWidth,
    alignSelf: 'center',
  },
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  pickCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.inputBackground,
  },
  pickLabel: {
    ...TYPOGRAPHY.navLabel,
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  pickTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickTitle: {
    ...TYPOGRAPHY.sectionTitle,
    flex: 1,
    color: COLORS.textPrimary,
  },
  pickMeta: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  reason: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  pickActions: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
  },
  pickButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  skip: {
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  skipText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  empty: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.taskTitle,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
    marginRight: SPACING.sm,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  rowMeta: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
  },
  rowTime: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
  },
});
