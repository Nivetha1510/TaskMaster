import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ProfileAvatarButton from '../components/ProfileAvatarButton';
import CompletedItem from '../components/CompletedItem';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { loadFocusSessions } from '../services/storageService';
import { formatIsoDate } from '../utils/date';
import { formatHour, getBestHour, getStreak, getWeekStats } from '../utils/insights';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

const CHART_HEIGHT = 120;
const RECENT_WINS = 5;

function StatCard({ icon, value, label, color }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={color ?? COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { tasks, toggleTask } = useApp();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);

  // Reload on every visit so minutes from a just-finished focus session show up.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadFocusSessions(user.id).then((loaded) => active && setSessions(loaded));
      return () => {
        active = false;
      };
    }, [user.id])
  );

  const streak = getStreak(tasks);
  const week = getWeekStats(tasks, sessions);
  const weekDone = week.reduce((sum, day) => sum + day.completed, 0);
  const weekFocus = week.reduce((sum, day) => sum + day.focusMinutes, 0);
  const bestHour = getBestHour(tasks);
  const maxCompleted = Math.max(1, ...week.map((day) => day.completed));

  const wins = tasks
    .filter((task) => task.completed && task.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, RECENT_WINS);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Insights" right={<ProfileAvatarButton />} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard
            icon="flame"
            value={`${streak} ${streak === 1 ? 'day' : 'days'}`}
            label="Streak"
            color={COLORS.favorite}
          />
          <StatCard icon="checkmark-done" value={weekDone} label="Done this week" />
          <StatCard icon="timer" value={`${weekFocus}m`} label="Focus this week" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last 7 days</Text>
          <View style={styles.chart}>
            {week.map((day) => (
              <View key={day.key} style={styles.barColumn}>
                <Text style={styles.barValue}>{day.completed || ''}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(day.completed / maxCompleted) * 100}%`,
                        backgroundColor: day.isToday ? COLORS.primary : COLORS.primaryPressed,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, day.isToday && styles.barLabelToday]}>
                  {day.label}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.hint}>
            {bestHour === null
              ? 'Finish a few tasks to discover your most productive time.'
              : `You get the most done around ${formatHour(bestHour)}.`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recent wins</Text>
        {wins.length === 0 ? (
          <Text style={styles.empty}>Tasks you finish will show up here.</Text>
        ) : (
          wins.map((task) => (
            <CompletedItem
              key={task.id}
              title={task.title}
              completedOn={formatIsoDate(task.completedAt)}
              onUndo={() => toggleTask(task.id)}
            />
          ))
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
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBackground,
  },
  statValue: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.navLabel,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    padding: SPACING.lg,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.divider,
  },
  cardTitle: {
    ...TYPOGRAPHY.taskTitle,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    ...TYPOGRAPHY.navLabel,
    color: COLORS.textSecondary,
    height: 16,
  },
  barTrack: {
    width: 20,
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.divider,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: RADIUS.sm,
  },
  barLabel: {
    ...TYPOGRAPHY.navLabel,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  barLabelToday: {
    color: COLORS.primary,
  },
  hint: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
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
});
