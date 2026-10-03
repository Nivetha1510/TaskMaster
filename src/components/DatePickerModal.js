import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTH_SHORT_NAMES = MONTH_NAMES.map((name) => name.slice(0, 3));
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const isSameDay = (a, b) =>
  Boolean(a && b) &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Splits a month into rows of 7 cells; cells outside the month are null.
const buildMonthRows = (monthStart) => {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const leadingBlanks = monthStart.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
};

export default function DatePickerModal({ visible, value, onConfirm, onCancel }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [viewMonth, setViewMonth] = useState(getMonthStart(value ?? new Date()));
  const [selectedDate, setSelectedDate] = useState(value ?? null);
  const [mode, setMode] = useState('days'); // 'days' or 'months'
  const [yearInView, setYearInView] = useState(getMonthStart(value ?? new Date()).getFullYear());

  // Each time the calendar opens, start from the saved date's month (or this month).
  useEffect(() => {
    if (visible) {
      setViewMonth(getMonthStart(value ?? new Date()));
      setSelectedDate(value ?? null);
      setMode('days');
    }
  }, [visible, value]);

  const today = getStartOfToday();
  const rows = useMemo(() => buildMonthRows(viewMonth), [viewMonth]);
  const isCurrentMonth = viewMonth <= getMonthStart(today);

  const currentYear = today.getFullYear();

  const openMonthPicker = () => {
    setYearInView(viewMonth.getFullYear());
    setMode('months');
  };

  const handleSelectMonth = (monthIndex) => {
    setViewMonth(new Date(yearInView, monthIndex, 1));
    setMode('days');
  };

  const goToMonth = (offset) =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + offset, 1));

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
            <TouchableOpacity
              onPress={() => onConfirm(selectedDate)}
              disabled={!selectedDate}
              hitSlop={10}
            >
              <Text style={[styles.actionText, !selectedDate && styles.mutedText]}>Done</Text>
            </TouchableOpacity>
          </View>

          {mode === 'days' ? (
            <>
            <View style={styles.monthHeader}>
              <TouchableOpacity
                onPress={() => goToMonth(-1)}
                disabled={isCurrentMonth}
                hitSlop={10}
                accessibilityLabel="Previous month"
              >
                <Feather
                  name="chevron-left"
                  size={24}
                  color={isCurrentMonth ? COLORS.border : COLORS.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.monthTitleButton}
                onPress={openMonthPicker}
                accessibilityLabel="Choose month and year"
              >
                <Text style={styles.monthTitle}>
                  {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </Text>
                <Feather name="chevron-down" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => goToMonth(1)}
                hitSlop={10}
                accessibilityLabel="Next month"
              >
                <Feather name="chevron-right" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((weekday) => (
                <Text key={weekday} style={styles.weekday}>
                  {weekday}
                </Text>
              ))}
            </View>

            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.weekRow}>
                {row.map((day, cellIndex) => {
                  if (!day) return <View key={cellIndex} style={styles.cell} />;

                  const isPast = day < today;
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, today);

                  return (
                    <View key={cellIndex} style={styles.cell}>
                      <TouchableOpacity
                        style={[
                          styles.day,
                          isToday && styles.dayToday,
                          isSelected && styles.daySelected,
                        ]}
                        disabled={isPast}
                        onPress={() => setSelectedDate(day)}
                        accessibilityLabel={day.toDateString()}
                        accessibilityState={{ selected: isSelected, disabled: isPast }}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isPast && styles.dayTextPast,
                            isSelected && styles.dayTextSelected,
                          ]}
                        >
                          {day.getDate()}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}
            </>
          ) : (
          <>
            <View style={styles.monthHeader}>
              <TouchableOpacity
                onPress={() => setYearInView(yearInView - 1)}
                disabled={yearInView <= currentYear}
                hitSlop={10}
                accessibilityLabel="Previous year"
              >
                <Feather
                  name="chevron-left"
                  size={24}
                  color={yearInView <= currentYear ? COLORS.border : COLORS.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{yearInView}</Text>
              <TouchableOpacity
                onPress={() => setYearInView(yearInView + 1)}
                hitSlop={10}
                accessibilityLabel="Next year"
              >
                <Feather name="chevron-right" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthGrid}>
              {MONTH_SHORT_NAMES.map((name, monthIndex) => {
                const isPast =
                  yearInView < currentYear ||
                  (yearInView === currentYear && monthIndex < today.getMonth());
                const isViewed =
                  yearInView === viewMonth.getFullYear() &&
                  monthIndex === viewMonth.getMonth();

                return (
                  <View key={name} style={styles.monthCell}>
                    <TouchableOpacity
                      style={[styles.monthPill, isViewed && styles.monthPillSelected]}
                      disabled={isPast}
                      onPress={() => handleSelectMonth(monthIndex)}
                      accessibilityLabel={`${MONTH_NAMES[monthIndex]} ${yearInView}`}
                      accessibilityState={{ selected: isViewed, disabled: isPast }}
                    >
                      <Text
                        style={[
                          styles.monthText,
                          isPast && styles.monthTextPast,
                          isViewed && styles.monthTextSelected,
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
          )}
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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.lg,
  },
  monthTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    ...TYPOGRAPHY.navLabel,
    flex: 1,
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingBottom: SPACING.sm,
  },
  cell: {
    flex: 1,
    height: SIZES.dayCellHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: SIZES.dayCircle,
    height: SIZES.dayCircle,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.round,
  },
  dayToday: {
    borderWidth: SIZES.outlineBorder,
    borderColor: COLORS.primary,
  },
  daySelected: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  dayTextPast: {
    color: COLORS.border,
  },
  dayTextSelected: {
    color: COLORS.textOnPrimary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '33.333%',
    height: SIZES.monthCellHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPill: {
    width: SIZES.monthPillWidth,
    height: SIZES.monthPillHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.round,
  },
  monthPillSelected: {
    backgroundColor: COLORS.primary,
  },
  monthText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  monthTextPast: {
    color: COLORS.border,
  },
  monthTextSelected: {
    color: COLORS.textOnPrimary,
  },
});
