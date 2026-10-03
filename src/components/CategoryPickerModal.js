import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { FONTS, TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SPACING } from '../theme/spacing';

export default function CategoryPickerModal({
  visible,
  categories,
  selectedId,
  onSelect,
  onClose,
}) {
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
          <Text style={styles.title}>Select category</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {categories.map((category) => {
              const selected = category.id === selectedId;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.option}
                  onPress={() => onSelect(category.id)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {category.name}
                  </Text>
                  {selected ? (
                    <Feather name="check" size={20} color={COLORS.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
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
    maxHeight: '60%',
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
    paddingVertical: SPACING.md + 2,
  },
  optionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});