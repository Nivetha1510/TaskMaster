import React, { useState, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

export default function LoginScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { logIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleLogIn = async () => {
    setError('');
    setIsSubmitting(true);
    const result = await logIn({ email, password });
    // On success the navigator swaps to the main app, so there is nothing more to do.
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your tasks."
      footerText="Don't have an account?"
      footerAction="Sign up"
      onFooterPress={() => navigation.navigate('SignUp')}
    >
      <CustomInput
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <CustomInput
        placeholder="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError('');
        }}
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={canSubmit ? handleLogIn : undefined}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Log in" onPress={handleLogIn} disabled={!canSubmit} />
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
