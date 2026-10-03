import React, { useEffect, useState, useMemo } from 'react';
import { Modal, View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import CustomInput from './CustomInput';
import PrimaryButton from './PrimaryButton';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

export default function CategoryModal({
  visible,
  title,
  initialName = '',
  otherNames = [],
  onSave,
  onCancel,
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');

  // Each time the modal opens, start from the given name with no error.
  useEffect(() => {
    if (visible) {
      setName(initialName);
      setError('');
    }
  }, [visible, initialName]);

  const handleChangeText = (text) => {
    setName(text);
    setError('');
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a category name');
      return;
    }
    const isDuplicate = otherNames.some(
      (otherName) => otherName.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setError('This category already exists');
      return;
    }
    onSave(trimmedName);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlay} onPress={onCancel}>
          {/* The inner Pressable stops taps on the card from closing it */}
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>{title}</Text>

            <CustomInput
              placeholder="Category name"
              value={name}
              onChangeText={handleChangeText}
              error={error}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <View style={styles.buttons}>
              <PrimaryButton title="Cancel" onPress={onCancel} style={styles.button} />
              <PrimaryButton title="Save" onPress={handleSave} style={styles.button} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  flex: {
    flex: 1,
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
    marginBottom: SPACING.lg,
  },
  buttons: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});
