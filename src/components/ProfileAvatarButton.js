import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getTaskAlerts } from '../utils/alerts';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

// Shows who is logged in (their initial); tapping it opens the Profile tab.
// A red badge counts the tasks that need attention (overdue, due today, reminders).
export default function ProfileAvatarButton() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { tasks, settings } = useApp();

  if (!user) return null;

  const alertCount = getTaskAlerts(tasks, settings.remindersEnabled).length;

  return (
    <TouchableOpacity
      style={styles.avatar}
      onPress={() => navigation.navigate('Profile')}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`Logged in as ${user.name}. ${alertCount} notifications. Open profile`}
    >
      <Text style={styles.initial}>{user.name.charAt(0).toUpperCase()}</Text>
      {alertCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{alertCount > 9 ? '9+' : alertCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  avatar: {
    width: SIZES.avatarSmall,
    height: SIZES.avatarSmall,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -SPACING.xs,
    right: -SPACING.xs,
    minWidth: SIZES.badge,
    height: SIZES.badge,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...TYPOGRAPHY.navLabel,
    color: COLORS.textOnPrimary,
  },
  initial: {
    ...TYPOGRAPHY.button,
    color: COLORS.textOnPrimary,
  },
});
