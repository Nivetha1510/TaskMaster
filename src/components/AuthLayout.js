import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { FONTS, TYPOGRAPHY } from '../theme/typography';
import { SIZES, SPACING } from '../theme/spacing';

// Shared page shell for the Log in and Sign up screens.
export default function AuthLayout({
  title,
  subtitle,
  footerText,
  footerAction,
  onFooterPress,
  children,
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.brand}>TaskMaster</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {children}

            <TouchableOpacity style={styles.footer} onPress={onFooterPress}>
              <Text style={styles.footerText}>
                {footerText} <Text style={styles.footerAction}>{footerAction}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: SIZES.modalMaxWidth,
    alignSelf: 'center',
  },
  brand: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.primary,
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  footerAction: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});
