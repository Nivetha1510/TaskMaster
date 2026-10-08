import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { useApp } from '../context/AppContext';
import { parseQuickAdd } from '../utils/quickAdd';
import { detectConflicts } from '../utils/conflicts';
import { useSpeechInput } from '../utils/speech';
import { formatDate, formatTime } from '../utils/date';
import { formatEstimate, getPriorityColor, getPriorityLabel } from '../data/taskOptions';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

// A "Quick add" button that opens a one-line task entry:
// "Call client tomorrow 10 AM high" fills in date, time and priority.
export default function QuickAddBar() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { tasks, categories, settings, addTask } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');

  const parsed = text.trim() ? parseQuickAdd(text, categories) : null;
  const priority = parsed?.priority ?? settings.defaultPriority;
  const category = parsed?.category ?? categories[0];

  // Warn about a clash with another task, or an overloaded day, before adding.
  const conflicts = parsed?.dueDate
    ? detectConflicts(tasks, {
        dueDate: parsed.dueDate,
        dueTime: parsed.dueTime,
        estimate: parsed.estimate,
      })
    : null;

  const chips = parsed
    ? [
        parsed.dueDate && { key: 'date', icon: 'calendar-outline', label: formatDate(parsed.dueDate) },
        parsed.dueTime && { key: 'time', icon: 'time-outline', label: formatTime(parsed.dueTime) },
        parsed.estimate && { key: 'estimate', icon: 'hourglass-outline', label: formatEstimate(parsed.estimate) },
        parsed.repeat && { key: 'repeat', icon: 'repeat', label: parsed.repeat },
        { key: 'priority', dot: getPriorityColor(priority, COLORS), label: getPriorityLabel(priority) },
        category && { key: 'category', icon: 'folder-outline', label: category.name },
      ].filter(Boolean)
    : [];

  const speech = useSpeechInput((transcript) => setText(transcript));

  const close = () => {
    speech.stop();
    setIsOpen(false);
    setText('');
  };

  const handleSubmit = () => {
    if (!parsed || !parsed.title) return;
    addTask({
      title: parsed.title,
      categoryId: category?.id ?? null,
      dueDate: parsed.dueDate ? parsed.dueDate.toISOString() : null,
      dueTime: parsed.dueDate ? parsed.dueTime : null,
      priority,
      estimate: parsed.estimate,
      repeat: parsed.dueDate ? parsed.repeat : null,
    });
    close();
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Quick add task"
      >
        <Ionicons name="flash" size={18} color={COLORS.primary} />
        <Text style={styles.buttonText}>Quick add</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.overlay} onPress={close}>
            {/* The inner Pressable stops taps on the card from closing it */}
            <Pressable style={styles.card} onPress={() => {}}>
              <Text style={styles.title}>Quick add</Text>
              <Text style={styles.hint}>Try: Call client tomorrow 10 AM high</Text>

              <View style={styles.inputRow}>
                <Ionicons name="flash" size={20} color={COLORS.primary} />
                <TextInput
                  style={styles.input}
                  placeholder="Type a task with date, time, priority"
                  placeholderTextColor={COLORS.textSecondary}
                  value={text}
                  onChangeText={setText}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="done"
                  autoFocus
                />
                {speech.isSupported ? (
                  <TouchableOpacity
                    style={[styles.micButton, speech.isListening && styles.micButtonActive]}
                    onPress={speech.isListening ? speech.stop : speech.start}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={speech.isListening ? 'Stop listening' : 'Speak a task'}
                  >
                    <Ionicons
                      name={speech.isListening ? 'stop' : 'mic'}
                      size={18}
                      color={speech.isListening ? COLORS.textOnPrimary : COLORS.primary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              {speech.isListening ? (
                <Text style={styles.listening}>Listening... say something like "Remind me to buy milk tomorrow evening"</Text>
              ) : speech.error ? (
                <Text style={styles.speechError}>{speech.error}</Text>
              ) : null}

              {parsed ? (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {parsed.title}
                  </Text>
                  <View style={styles.chips}>
                    {chips.map((chip) => (
                      <View key={chip.key} style={styles.chip}>
                        {chip.dot ? (
                          <View style={[styles.dot, { backgroundColor: chip.dot }]} />
                        ) : (
                          <Ionicons name={chip.icon} size={13} color={COLORS.textSecondary} />
                        )}
                        <Text style={styles.chipText}>{chip.label}</Text>
                      </View>
                    ))}
                  </View>
                  {conflicts?.messages.map((message) => (
                    <View key={message} style={styles.warning}>
                      <Ionicons name="warning" size={16} color={COLORS.favorite} />
                      <Text style={styles.warningText}>{message}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.actions}>
                <PrimaryButton title="Cancel" onPress={close} style={styles.action} />
                <PrimaryButton
                  title={conflicts?.messages.length ? 'Add anyway' : 'Add task'}
                  onPress={handleSubmit}
                  disabled={!parsed}
                  style={styles.action}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    height: SIZES.chipHeight + SPACING.sm,
    borderRadius: RADIUS.round,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.inputBackground,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    backgroundColor: COLORS.overlay,
  },
  card: {
    width: '100%',
    maxWidth: SIZES.modalMaxWidth,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
  },
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
  },
  hint: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  inputRow: {
    height: SIZES.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.inputBackground,
  },
  input: {
    ...TYPOGRAPHY.input,
    flex: 1,
    marginLeft: SPACING.md,
    color: COLORS.textPrimary,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.primary,
  },
  micButtonActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  listening: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  speechError: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  preview: {
    marginTop: SPACING.md,
  },
  previewTitle: {
    ...TYPOGRAPHY.taskTitle,
    color: COLORS.textPrimary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    marginTop: SPACING.xs,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBackground,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
  },
  chipText: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
    textTransform: 'capitalize',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
  },
  warningText: {
    ...TYPOGRAPHY.secondary,
    flex: 1,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
  },
  action: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});
