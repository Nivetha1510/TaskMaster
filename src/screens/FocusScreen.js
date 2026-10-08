import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ProfileAvatarButton from '../components/ProfileAvatarButton';
import OptionChips from '../components/OptionChips';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { loadFocusSessions, saveFocusSessions } from '../services/storageService';
import { generateId } from '../utils/id';
import { useTheme } from '../theme/ThemeContext';
import { FONTS, TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 25, label: '25 min' },
  { value: 45, label: '45 min' },
];

const pad = (number) => String(number).padStart(2, '0');
const formatClock = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

export default function FocusScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { tasks } = useApp();
  const { user } = useAuth();

  const [minutes, setMinutes] = useState(25);
  const [taskId, setTaskId] = useState(null);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const endsAt = useRef(null);

  const pendingTasks = tasks.filter((task) => !task.completed);
  const selectedTask = tasks.find((task) => task.id === taskId);

  const logSession = useCallback(
    async (sessionMinutes) => {
      if (sessionMinutes < 1) return;
      const sessions = await loadFocusSessions(user.id);
      await saveFocusSessions(user.id, [
        ...sessions,
        { id: generateId(), taskId, minutes: sessionMinutes, endedAt: new Date().toISOString() },
      ]);
    },
    [user.id, taskId]
  );

  // Count against a fixed end time so the clock stays right if the tab is throttled.
  useEffect(() => {
    if (!running) return undefined;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        setFinished(true);
        logSession(minutes);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [running, minutes, logSession]);

  const start = () => {
    endsAt.current = Date.now() + remaining * 1000;
    setFinished(false);
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = (nextMinutes = minutes) => {
    setRunning(false);
    setFinished(false);
    setRemaining(nextMinutes * 60);
  };

  // Stopping early still counts the time actually spent.
  const stopEarly = () => {
    const spent = Math.floor((minutes * 60 - remaining) / 60);
    logSession(spent);
    reset();
  };

  const chooseDuration = (value) => {
    setMinutes(value);
    reset(value);
  };

  const started = remaining < minutes * 60;
  const progress = 1 - remaining / (minutes * 60);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Focus" right={<ProfileAvatarButton />} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel} numberOfLines={1}>
            {finished
              ? 'Session complete - great work!'
              : selectedTask
                ? selectedTask.title
                : 'Pick a task to focus on'}
          </Text>
          <Text style={styles.clock} accessibilityLabel={`${formatClock(remaining)} remaining`}>
            {formatClock(remaining)}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {!running && !started ? (
          <OptionChips options={DURATIONS} value={minutes} onChange={chooseDuration} />
        ) : null}

        <View style={styles.actions}>
          {running ? (
            <PrimaryButton title="Pause" onPress={pause} />
          ) : (
            <PrimaryButton
              title={started && !finished ? 'Resume' : 'Start focus'}
              onPress={start}
            />
          )}
          {started && !finished ? (
            <TouchableOpacity style={styles.stopButton} onPress={stopEarly}>
              <Text style={styles.stopText}>Stop and save</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.habitsCard}
          onPress={() => navigation.navigate('Habits')}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Ionicons name="water" size={24} color={COLORS.primary} />
          <View style={styles.habitsText}>
            <Text style={styles.habitsTitle}>Healthy habits</Text>
            <Text style={styles.habitsMeta}>Hourly reminders to drink water, walk and stretch</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Focus on</Text>
        {pendingTasks.length === 0 ? (
          <Text style={styles.empty}>No pending tasks. Add one from the Tasks tab.</Text>
        ) : (
          pendingTasks.map((task) => {
            const selected = task.id === taskId;
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskRow, selected && styles.taskRowSelected]}
                onPress={() => setTaskId(selected ? null : task.id)}
                disabled={running}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SPACING.xxl,
  },
  timerCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.inputBackground,
  },
  timerLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  clock: {
    fontFamily: FONTS.bold,
    fontSize: 64,
    color: COLORS.textPrimary,
    marginVertical: SPACING.md,
  },
  track: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.divider,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  actions: {
    marginTop: SPACING.sm,
  },
  stopButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  stopText: {
    ...TYPOGRAPHY.button,
    color: COLORS.error,
  },
  habitsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.divider,
  },
  habitsText: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  habitsTitle: {
    ...TYPOGRAPHY.taskTitle,
    color: COLORS.textPrimary,
  },
  habitsMeta: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  empty: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.divider,
  },
  taskRowSelected: {
    borderColor: COLORS.primary,
  },
  taskTitle: {
    ...TYPOGRAPHY.body,
    flex: 1,
    marginLeft: SPACING.md,
    color: COLORS.textPrimary,
  },
});
