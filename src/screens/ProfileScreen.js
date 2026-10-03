import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import SettingsGroup from '../components/SettingsGroup';
import SettingsRow from '../components/SettingsRow';
import FormModal from '../components/FormModal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/date';
import { getTaskAlerts } from '../utils/alerts';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

const MAX_ALERTS_SHOWN = 5;

const ALERT_ICONS = { overdue: 'alert-circle', today: 'calendar', reminder: 'bell' };

function StatCard({ value, label }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { user, updateProfile, logOut } = useAuth();
  const { tasks, settings } = useApp();

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isLogOutOpen, setIsLogOutOpen] = useState(false);

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  const alerts = getTaskAlerts(tasks, settings.remindersEnabled);
  const visibleAlerts = alerts.slice(0, MAX_ALERTS_SHOWN);

  // While logging out, this screen can render once more after the user is gone.
  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Profile" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.since}>Member since {formatDate(user.createdAt)}</Text>
        </View>

        <View style={styles.stats}>
          <StatCard value={pendingCount} label="Pending" />
          <StatCard value={completedCount} label="Completed" />
        </View>

        <SettingsGroup title={alerts.length > 0 ? `Notifications (${alerts.length})` : 'Notifications'}>
          {alerts.length === 0 ? (
            <SettingsRow icon="check-circle" label="You are all caught up" />
          ) : (
            visibleAlerts.map(({ task, kind, label }) => (
              <SettingsRow
                key={task.id}
                icon={ALERT_ICONS[kind]}
                label={task.title}
                value={label}
                destructive={kind === 'overdue'}
                onPress={() =>
                  navigation.navigate('Tasks', { screen: 'TaskDetails', params: { taskId: task.id } })
                }
              />
            ))
          )}
          {alerts.length > MAX_ALERTS_SHOWN ? (
            <SettingsRow
              icon="more-horizontal"
              label={`${alerts.length - MAX_ALERTS_SHOWN} more`}
              onPress={() => navigation.navigate('Tasks', { screen: 'TasksList' })}
            />
          ) : null}
        </SettingsGroup>

        <SettingsGroup title="Account">
          <SettingsRow
            icon="user"
            label="Name"
            value={user.name}
            onPress={() => setIsEditNameOpen(true)}
          />
          <SettingsRow
            icon="settings"
            label="Settings"
            onPress={() => navigation.navigate('Settings')}
          />
          <SettingsRow
            icon="log-out"
            label="Log out"
            destructive
            onPress={() => setIsLogOutOpen(true)}
          />
        </SettingsGroup>
      </ScrollView>

      <FormModal
        visible={isEditNameOpen}
        title="Edit name"
        fields={[{ key: 'name', placeholder: 'Your name' }]}
        initialValues={{ name: user.name }}
        onSubmit={({ name }) => updateProfile({ name })}
        onClose={() => setIsEditNameOpen(false)}
      />

      <ConfirmModal
        visible={isLogOutOpen}
        title="Log out"
        message="You can log back in any time. Your tasks stay saved on this device."
        confirmText="Log out"
        onConfirm={() => {
          setIsLogOutOpen(false);
          logOut();
        }}
        onCancel={() => setIsLogOutOpen(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  identity: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: SIZES.avatar,
    height: SIZES.avatar,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.textOnPrimary,
  },
  name: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  email: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  since: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.divider,
  },
  statValue: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
  },
});
