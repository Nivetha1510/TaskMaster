import React, { useMemo } from 'react';
import { Modal, View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { FONTS, TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

function OptionIcon({ family, ...props }) {
  const Icon = family === 'ionicons' ? Ionicons : Feather;
  return <Icon {...props} />;
}

// A bottom sheet with a list of choices.
// `options` is [{ value, label, icon?, iconFamily?, destructive? }]; `selected` shows a check mark.
export default function OptionSheet({ visible, title, options, selected, onSelect, onClose }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* The inner Pressable stops taps on the sheet from closing it */}
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}
          onPress={() => {}}
        >
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}

          {options.map((option) => {
            const isSelected = option.value === selected;
            const color = option.destructive ? COLORS.error : COLORS.textPrimary;
            return (
              <TouchableOpacity
                key={option.label}
                style={styles.option}
                onPress={() => onSelect(option.value)}
                activeOpacity={0.6}
              >
                <View style={styles.optionLeft}>
                  {option.icon ? (
                    <OptionIcon
                      family={option.iconFamily}
                      name={option.icon}
                      size={20}
                      color={color}
                      style={styles.optionIcon}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.optionText,
                      { color },
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {isSelected ? <Feather name="check" size={20} color={COLORS.primary} /> : null}
              </TouchableOpacity>
            );
          })}
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
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md + SPACING.xs,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: SPACING.md,
  },
  optionText: {
    ...TYPOGRAPHY.body,
  },
  optionTextSelected: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});
