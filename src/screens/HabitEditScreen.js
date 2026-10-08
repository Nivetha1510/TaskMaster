import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import CustomInput from '../components/CustomInput';
import OptionChips from '../components/OptionChips';
import PrimaryButton from '../components/PrimaryButton';
import ConfirmModal from '../components/ConfirmModal';
import TimePickerModal from '../components/TimePickerModal';
import { useApp } from '../context/AppContext';
import { INTERVAL_OPTIONS, TEST_INTERVAL, getHabitSlots, isValidWindow } from '../data/habits';
import { formatTime } from '../utils/date';
import { generateId } from '../utils/id';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SIZES, SPACING } from '../theme/spacing';

// Create or edit one habit reminder. Pass `habitId` in the route params to edit.
export default function HabitEditScreen({ navigation, route }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { settings, updateSettings } = useApp();
  const habits = settings.habits ?? [];

  const editing = habits.find((habit) => habit.id === route.params?.habitId);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [message, setMessage] = useState(editing?.message ?? '');
  const [intervalMinutes, setIntervalMinutes] = useState(editing?.intervalMinutes ?? 60);
  const [startTime, setStartTime] = useState(editing?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(editing?.endTime ?? '18:00');
  const [picking, setPicking] = useState(null); // 'start' | 'end' | null
  const [error, setError] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const draft = { intervalMinutes, startTime, endTime };
  const isTest = intervalMinutes === TEST_INTERVAL;
  const slotCount = isValidWindow(draft) ? getHabitSlots(draft).length : 0;

  const handleSave = () => {
    if (!title.trim()) {
      setError('Please enter a name for the habit');
      return;
    }
    if (!isTest && !isValidWindow(draft)) {
      setError('The end time must be after the start time');
      return;
    }
    const habit = {
      id: editing?.id ?? generateId(),
      icon: editing?.icon ?? 'notifications',
      enabled: editing?.enabled ?? true,
      title: title.trim(),
      message: message.trim() || `Time for: ${title.trim()}`,
      intervalMinutes,
      startTime,
      endTime,
    };
    updateSettings({
      habits: editing
        ? habits.map((item) => (item.id === editing.id ? habit : item))
        : [...habits, habit],
    });
    navigation.goBack();
  };

  const handleDelete = () => {
    updateSettings({ habits: habits.filter((item) => item.id !== editing.id) });
    setIsDeleteOpen(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={editing ? 'Edit habit' : 'New habit'} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CustomInput
            placeholder="Habit name (e.g. Drink water)"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setError('');
            }}
          />
          <CustomInput
            placeholder="Reminder message (optional)"
            value={message}
            onChangeText={setMessage}
          />

          <Text style={styles.fieldTitle}>Remind me every</Text>
          <OptionChips
            options={INTERVAL_OPTIONS}
            value={intervalMinutes}
            onChange={setIntervalMinutes}
          />

          <Text style={styles.fieldTitle}>Between</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <CustomInput
                placeholder="Start time"
                value={formatTime(startTime)}
                onPress={() => setPicking('start')}
              />
            </View>
            <Text style={styles.to}>to</Text>
            <View style={styles.timeField}>
              <CustomInput
                placeholder="End time"
                value={formatTime(endTime)}
                onPress={() => setPicking('end')}
              />
            </View>
          </View>

          <Text style={styles.summary}>
            {isTest
              ? 'Test mode: reminds you every 2 minutes starting right now, ignoring the hours. Switch it off or change the interval when done.'
              : slotCount > 0
              ? `${slotCount} ${slotCount === 1 ? 'reminder' : 'reminders'} a day, every day.`
              : 'Choose an end time after the start time.'}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Save habit" onPress={handleSave} style={styles.saveButton} />
          {editing ? (
            <PrimaryButton
              title="Delete habit"
              variant="danger"
              onPress={() => setIsDeleteOpen(true)}
              style={styles.deleteButton}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <TimePickerModal
        visible={picking !== null}
        value={picking === 'end' ? endTime : startTime}
        onConfirm={(time) => {
          if (picking === 'end') setEndTime(time);
          else setStartTime(time);
          setPicking(null);
          setError('');
        }}
        onCancel={() => setPicking(null)}
      />

      <ConfirmModal
        visible={isDeleteOpen}
        title="Delete habit"
        message={`Delete "${editing?.title ?? ''}"? Its reminders will stop.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SPACING.xxl,
  },
  fieldTitle: {
    ...TYPOGRAPHY.taskTitle,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeField: {
    flex: 1,
  },
  to: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.md,
  },
  summary: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  error: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.error,
    marginTop: SPACING.md,
  },
  saveButton: {
    marginTop: SPACING.xl,
  },
  deleteButton: {
    marginTop: SPACING.md,
  },
});
