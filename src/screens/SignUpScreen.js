import React, { useState, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { MIN_PASSWORD_LENGTH } from '../utils/validation';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

export default function SignUpScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length > 0 && !isSubmitting;

  // Wraps a state setter so typing also clears the error message.
  const withClear = (setter) => (text) => {
    setter(text);
    setError('');
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsSubmitting(true);
    const result = await signUp({ name, email, password });
    // On success the navigator swaps to the main app, so there is nothing more to do.
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to start organizing your tasks."
      footerText="Already have an account?"
      footerAction="Log in"
      onFooterPress={() => navigation.navigate('Login')}
    >
      <CustomInput
        placeholder="Name"
        value={name}
        onChangeText={withClear(setName)}
        autoCapitalize="words"
      />
      <CustomInput
        placeholder="Email"
        value={email}
        onChangeText={withClear(setEmail)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <CustomInput
        placeholder={`Password (min ${MIN_PASSWORD_LENGTH} characters)`}
        value={password}
        onChangeText={withClear(setPassword)}
        secureTextEntry
        autoCapitalize="none"
      />
      <CustomInput
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={withClear(setConfirmPassword)}
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={canSubmit ? handleSignUp : undefined}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Sign up" onPress={handleSignUp} disabled={!canSubmit} />
    </AuthLayout>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  error: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
});
