import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, AppState, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { HABIT_PRESETS, describeHabit } from '../data/habits';
import { ensurePermission, getNotificationStatus } from '../services/reminderService';
import { generateId } from '../utils/id';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

const STATUS_MESSAGES = {
  'expo-go':
    'Reminders cannot run in Expo Go on Android. Use a development build to receive them.',
  denied: 'Notifications are blocked. Allow them in your phone settings to get reminders.',
};

export default function HabitsScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { settings, updateSettings } = useApp();
  const habits = settings.habits ?? [];

  const [status, setStatus] = useState('granted');

  // Re-check when the app returns to the foreground (e.g. after changing phone settings).
  useEffect(() => {
    getNotificationStatus().then(setStatus);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') getNotificationStatus().then(setStatus);
    });
    return () => subscription.remove();
  }, []);

  const handleAllow = async () => {
    await ensurePermission();
    setStatus(await getNotificationStatus());
    updateSettings({}); // re-schedules now that permission may have changed
  };

  const toggleHabit = (habitId, enabled) =>
    updateSettings({
      habits: habits.map((habit) => (habit.id === habitId ? { ...habit, enabled } : habit)),
    });

  const addPreset = (preset) => {
    updateSettings({ habits: [...habits, { ...preset, id: generateId(), enabled: true }] });
  };

  const unusedPresets = HABIT_PRESETS.filter(
    (preset) => !habits.some((habit) => habit.title === preset.title)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Healthy habits" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Get a gentle nudge at regular intervals during the hours you choose.
        </Text>

        {status === 'undetermined' ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Allow notifications so reminders can reach you.</Text>
            <TouchableOpacity onPress={handleAllow}>
              <Text style={styles.bannerAction}>Allow</Text>
            </TouchableOpacity>
          </View>
        ) : STATUS_MESSAGES[status] ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{STATUS_MESSAGES[status]}</Text>
            {status === 'denied' ? (
              <TouchableOpacity onPress={() => Linking.openSettings()}>
                <Text style={styles.bannerAction}>Settings</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {habits.map((habit) => (
          <View key={habit.id} style={styles.card}>
            {/* Only this area opens the editor; the switch sits outside it. */}
            <TouchableOpacity
              style={styles.cardMain}
              onPress={() => navigation.navigate('HabitEdit', { habitId: habit.id })}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${habit.title}`}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={habit.icon ?? 'notifications'} size={22} color={COLORS.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{habit.title}</Text>
                <Text style={styles.cardMeta}>{describeHabit(habit)}</Text>
              </View>
            </TouchableOpacity>
            <Switch
              value={habit.enabled}
              onValueChange={(value) => toggleHabit(habit.id, value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
              accessibilityLabel={`${habit.title} reminders`}
            />
          </View>
        ))}

        {unusedPresets.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Quick start</Text>
            {unusedPresets.map((preset) => (
              <TouchableOpacity
                key={preset.title}
                style={styles.card}
                onPress={() => addPreset(preset)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Add ${preset.title}`}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={preset.icon} size={22} color={COLORS.textSecondary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{preset.title}</Text>
                  <Text style={styles.cardMeta}>{describeHabit(preset)}</Text>
                </View>
                <Ionicons name="add-circle" size={26} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </>
        ) : null}

        <PrimaryButton
          title="Create custom habit"
          onPress={() => navigation.navigate('HabitEdit')}
          style={styles.createButton}
        />
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
  intro: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBackground,
  },
  bannerText: {
    ...TYPOGRAPHY.secondary,
    flex: 1,
    color: COLORS.textPrimary,
  },
  bannerAction: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    marginLeft: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.divider,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBackground,
  },
  cardText: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.taskTitle,
    color: COLORS.textPrimary,
  },
  cardMeta: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  createButton: {
    marginTop: SPACING.lg,
  },
});
