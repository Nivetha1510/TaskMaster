import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import SettingsGroup from '../components/SettingsGroup';
import SettingsRow from '../components/SettingsRow';
import Avatar from '../components/Avatar';
import OptionSheet from '../components/OptionSheet';
import FormModal from '../components/FormModal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pickProfilePhoto } from '../utils/profilePhoto';
import { formatDate } from '../utils/date';
import { getTaskAlerts, withoutDismissed } from '../utils/alerts';
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
  const { tasks, settings, updateSettings } = useApp();

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isLogOutOpen, setIsLogOutOpen] = useState(false);
  const [isPhotoSheetOpen, setIsPhotoSheetOpen] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  const allAlerts = getTaskAlerts(tasks, settings.remindersEnabled);
  const alerts = withoutDismissed(allAlerts, settings.dismissedAlerts);
  const visibleAlerts = alerts.slice(0, MAX_ALERTS_SHOWN);

  const dismissAlert = ({ task, kind }) =>
    updateSettings({ dismissedAlerts: { ...settings.dismissedAlerts, [task.id]: kind } });

  const clearAllAlerts = () =>
    updateSettings({
      dismissedAlerts: allAlerts.reduce(
        (map, { task, kind }) => ({ ...map, [task.id]: kind }),
        {}
      ),
    });

  const photoOptions = [
    { value: 'library', label: 'Choose from gallery', icon: 'image' },
    ...(Platform.OS === 'web' ? [] : [{ value: 'camera', label: 'Take a photo', icon: 'camera' }]),
    ...(user?.photo
      ? [{ value: 'remove', label: 'Remove photo', icon: 'trash-2', destructive: true }]
      : []),
  ];

  const handlePhotoSelect = async (action) => {
    setIsPhotoSheetOpen(false);
    setPhotoError('');
    if (action === 'remove') {
      await updateProfile({ photo: null });
      return;
    }
    // Wait for the sheet to finish closing before the picker opens (iOS).
    await new Promise((resolve) => setTimeout(resolve, 300));
    const result = await pickProfilePhoto(action);
    if (result.photo) await updateProfile({ photo: result.photo });
    else if (result.error) setPhotoError(result.error);
  };

  // While logging out, this screen can render once more after the user is gone.
  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Profile" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <TouchableOpacity
            onPress={() => setIsPhotoSheetOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <Avatar
              name={user.name}
              photo={user.photo}
              size={SIZES.avatar}
              textStyle={styles.avatarText}
            />
            <View style={styles.cameraBadge}>
              <Feather name="camera" size={14} color={COLORS.textOnPrimary} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsPhotoSheetOpen(true)} hitSlop={8}>
            <Text style={styles.changePhoto}>{user.photo ? 'Edit photo' : 'Add photo'}</Text>
          </TouchableOpacity>
          {photoError ? <Text style={styles.photoError}>{photoError}</Text> : null}
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
            visibleAlerts.map((alert) => {
              const { task, kind, label } = alert;
              return (
              <SettingsRow
                key={task.id}
                icon={ALERT_ICONS[kind]}
                label={task.title}
                value={label}
                destructive={kind === 'overdue'}
                onPress={() =>
                  navigation.navigate('Tasks', { screen: 'TaskDetails', params: { taskId: task.id } })
                }
                right={
                  <TouchableOpacity
                    onPress={() => dismissAlert(alert)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Clear notification for ${task.title}`}
                  >
                    <Feather name="x" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                }
              />
              );
            })
          )}
          {alerts.length > MAX_ALERTS_SHOWN ? (
            <SettingsRow
              icon="more-horizontal"
              label={`${alerts.length - MAX_ALERTS_SHOWN} more`}
              onPress={() => navigation.navigate('Tasks', { screen: 'TasksList' })}
            />
          ) : null}
          {alerts.length > 0 ? (
            <SettingsRow icon="x-circle" label="Clear all notifications" onPress={clearAllAlerts} />
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
            icon="heart"
            label="Healthy habits"
            onPress={() => navigation.navigate('Habits')}
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

      <OptionSheet
        visible={isPhotoSheetOpen}
        title="Profile photo"
        options={photoOptions}
        onSelect={handlePhotoSelect}
        onClose={() => setIsPhotoSheetOpen(false)}
      />

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
        message="You can log back in any time. Your tasks stay saved in your account."
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
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: RADIUS.round,
    borderWidth: 2,
    borderColor: COLORS.background,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhoto: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  photoError: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.error,
    marginTop: SPACING.xs,
    textAlign: 'center',
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
