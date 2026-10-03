import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OptionChips from './OptionChips';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const PERIOD_OPTIONS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

const pad = (number) => String(number).padStart(2, '0');

// Splits '14:05' into the 12-hour parts the pickers use (defaults to 9:00 AM).
const parseTime = (time) => {
  if (!time) return { hour: 9, minute: 0, period: 'AM' };
  const [hours, minutes] = time.split(':').map(Number);
  return { hour: hours % 12 || 12, minute: minutes, period: hours >= 12 ? 'PM' : 'AM' };
};

// Pure-JS time picker bottom sheet. `value` and onConfirm use 24-hour 'HH:MM'.
export default function TimePickerModal({ visible, value, onConfirm, onCancel }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [minuteText, setMinuteText] = useState('00'); // what is typed in the minute box
  const [period, setPeriod] = useState('AM');

  // Each time the picker opens, start from the saved time (or 9:00 AM).
  useEffect(() => {
    if (visible) {
      const parts = parseTime(value);
      setHour(parts.hour);
      setMinute(parts.minute);
      setMinuteText(pad(parts.minute));
      setPeriod(parts.period);
    }
  }, [visible, value]);

  const selectMinute = (value) => {
    setMinute(value);
    setMinuteText(pad(value));
  };

  // Typing any minute from 00 to 59 works; anything else is ignored as you type.
  const handleMinuteTextChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    setMinuteText(digits);
    if (digits !== '' && Number(digits) <= 59) setMinute(Number(digits));
  };

  // If the box is left empty or invalid, show the minute that is actually selected.
  const handleMinuteBlur = () => setMinuteText(pad(minute));

  const handleDone = () => {
    const hours24 = (hour % 12) + (period === 'PM' ? 12 : 0);
    onConfirm(`${pad(hours24)}:${pad(minute)}`);
  };

  const renderGrid = (items, selected, onSelect, format) => (
    <View style={styles.grid}>
      {items.map((item) => {
        const isSelected = item === selected;
        return (
          <View key={item} style={styles.gridCell}>
            <TouchableOpacity
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onSelect(item)}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {format(item)}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}
          onPress={() => {}}
        >
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} hitSlop={10}>
              <Text style={[styles.actionText, styles.mutedText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDone} hitSlop={10}>
              <Text style={styles.actionText}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Hour</Text>
          {renderGrid(HOURS, hour, setHour, String)}

          <View style={styles.minuteHeader}>
            <Text style={styles.minuteLabel}>Minute</Text>
            <TextInput
              style={styles.minuteInput}
              value={minuteText}
              onChangeText={handleMinuteTextChange}
              onBlur={handleMinuteBlur}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              accessibilityLabel="Type the minute, 0 to 59"
            />
          </View>
          {renderGrid(MINUTES, minute, selectMinute, pad)}

          <OptionChips
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            style={styles.period}
          />
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
    width: '100%',
    maxWidth: SIZES.sheetMaxWidth,
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  mutedText: {
    color: COLORS.textSecondary,
  },
  label: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  minuteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  minuteLabel: {
    ...TYPOGRAPHY.secondary,
    flex: 1,
    color: COLORS.textSecondary,
  },
  minuteInput: {
    ...TYPOGRAPHY.input,
    width: SIZES.timePillWidth,
    height: SIZES.chipHeight,
    textAlign: 'center',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    paddingVertical: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '25%',
    height: SIZES.monthPillHeight + SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: SIZES.timePillWidth,
    height: SIZES.monthPillHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.round,
  },
  pillSelected: {
    backgroundColor: COLORS.primary,
  },
  pillText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  pillTextSelected: {
    color: COLORS.textOnPrimary,
  },
  period: {
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
});
