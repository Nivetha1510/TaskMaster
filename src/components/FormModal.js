import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import CustomInput from './CustomInput';
import PrimaryButton from './PrimaryButton';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

// A centered card with a few text fields and Cancel / submit buttons.
// `fields` is [{ key, placeholder, secure? }]. `onSubmit(values)` may return
// { error } to show a message; otherwise the modal closes via `onClose`.
export default function FormModal({
  visible,
  title,
  fields,
  initialValues = {},
  submitLabel = 'Save',
  onSubmit,
  onClose,
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Each time the modal opens, start from the initial values with no error.
  useEffect(() => {
    if (visible) {
      setValues(initialValues);
      setError('');
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleChange = (key, text) => {
    setValues((previous) => ({ ...previous, [key]: text }));
    setError('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await onSubmit(values);
    setIsSubmitting(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          {/* The inner Pressable stops taps on the card from closing it */}
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>{title}</Text>

            {fields.map((field, index) => (
              <CustomInput
                key={field.key}
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onChangeText={(text) => handleChange(field.key, text)}
                secureTextEntry={field.secure}
                autoCapitalize={field.secure ? 'none' : 'words'}
                autoFocus={index === 0}
              />
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.buttons}>
              <PrimaryButton title="Cancel" onPress={onClose} style={styles.button} />
              <PrimaryButton
                title={submitLabel}
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={styles.button}
              />
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
  error: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  buttons: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});
