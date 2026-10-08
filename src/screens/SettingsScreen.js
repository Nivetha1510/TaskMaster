import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, Switch, AppState, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import SettingsGroup from '../components/SettingsGroup';
import SettingsRow from '../components/SettingsRow';
import FormModal from '../components/FormModal';
import ConfirmModal from '../components/ConfirmModal';
import OptionSheet from '../components/OptionSheet';
import TimePickerModal from '../components/TimePickerModal';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { PRIORITY_OPTIONS, getPriorityLabel } from '../data/taskOptions';
import appConfig from '../../app.json';
import { useTheme, THEME_OPTIONS } from '../theme/ThemeContext';
import { getNotificationStatus, ensurePermission } from '../services/reminderService';
import { formatTime } from '../utils/date';
import { SIZES, SPACING } from '../theme/spacing';

const PASSWORD_FIELDS = [
  { key: 'current', placeholder: 'Current password', secure: true },
  { key: 'next', placeholder: 'New password', secure: true },
  { key: 'confirm', placeholder: 'Confirm new password', secure: true },
];

export default function SettingsScreen({ navigation }) {
  const { colors: COLORS, preference, setPreference } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { changePassword, deleteAccount } = useAuth();
  const { tasks, settings, updateSettings, clearCompleted } = useApp();

  const [notificationStatus, setNotificationStatus] = useState('undetermined');
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSummaryTimeOpen, setIsSummaryTimeOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const completedCount = tasks.filter((task) => task.completed && !task.archived).length;

  // Check the system permission now, and again whenever the app comes back to the
  // foreground (for example after the user changed it in the system settings).
  useEffect(() => {
    getNotificationStatus().then(setNotificationStatus);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') getNotificationStatus().then(setNotificationStatus);
    });
    return () => subscription.remove();
  }, []);

  const handleAllowNotifications = async () => {
    await ensurePermission();
    setNotificationStatus(await getNotificationStatus());
    updateSettings({}); // re-schedules reminders now that permission may have changed
  };

  const themeLabel = THEME_OPTIONS.find((option) => option.value === preference)?.label;

  const handleChangePassword = ({ current = '', next = '', confirm = '' }) => {
    if (next !== confirm) return { error: 'New passwords do not match' };
    return changePassword(current, next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsGroup title="Appearance">
          <SettingsRow
            icon="moon"
            label="Theme"
            value={themeLabel}
            onPress={() => setIsThemeOpen(true)}
          />
        </SettingsGroup>

        <SettingsGroup title="Notifications">
          {notificationStatus === 'granted' ? (
            <SettingsRow icon="bell" label="Notifications are on" />
          ) : notificationStatus === 'denied' ? (
            <SettingsRow
              icon="bell-off"
              label="Notifications are blocked"
              value="Open settings"
              onPress={() => Linking.openSettings()}
            />
          ) : notificationStatus === 'expo-go' ? (
            <SettingsRow icon="bell-off" label="Needs a development build (not Expo Go)" />
          ) : notificationStatus === 'unsupported' ? (
            <SettingsRow icon="bell-off" label="Notifications need the phone app" />
          ) : (
            <SettingsRow
              icon="bell"
              label="Allow notifications"
              onPress={handleAllowNotifications}
            />
          )}
          <SettingsRow
            icon="clock"
            label="Task reminders"
            right={
              <Switch
                value={settings.remindersEnabled}
                onValueChange={(value) => updateSettings({ remindersEnabled: value })}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            }
          />
          <SettingsRow
            icon="sunrise"
            label="Daily summary"
            right={
              <Switch
                value={settings.dailySummary}
                onValueChange={(value) => updateSettings({ dailySummary: value })}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            }
          />
          {settings.dailySummary ? (
            <SettingsRow
              icon="watch"
              label="Summary time"
              value={formatTime(settings.summaryTime)}
              onPress={() => setIsSummaryTimeOpen(true)}
            />
          ) : null}
        </SettingsGroup>

        <SettingsGroup title="Tasks">
          <SettingsRow
            icon="flag"
            label="Default priority"
            value={getPriorityLabel(settings.defaultPriority)}
            onPress={() => setIsPriorityOpen(true)}
          />
          <SettingsRow
            icon="check-square"
            label="Clear completed tasks"
            value={String(completedCount)}
            onPress={() => setIsClearOpen(true)}
          />
        </SettingsGroup>

        <SettingsGroup title="Account">
          <SettingsRow
            icon="lock"
            label="Change password"
            onPress={() => setIsPasswordOpen(true)}
          />
          <SettingsRow
            icon="trash-2"
            label="Delete account"
            destructive
            onPress={() => setIsDeleteOpen(true)}
          />
        </SettingsGroup>

        <SettingsGroup title="About">
          <SettingsRow icon="info" label="Version" value={appConfig.expo.version} />
        </SettingsGroup>
      </ScrollView>

      <OptionSheet
        visible={isThemeOpen}
        title="Theme"
        options={THEME_OPTIONS}
        selected={preference}
        onSelect={(value) => {
          setPreference(value);
          setIsThemeOpen(false);
        }}
        onClose={() => setIsThemeOpen(false)}
      />

      <TimePickerModal
        visible={isSummaryTimeOpen}
        value={settings.summaryTime}
        onConfirm={(time) => {
          updateSettings({ summaryTime: time });
          setIsSummaryTimeOpen(false);
        }}
        onCancel={() => setIsSummaryTimeOpen(false)}
      />

      <OptionSheet
        visible={isPriorityOpen}
        title="Default priority"
        options={PRIORITY_OPTIONS}
        selected={settings.defaultPriority}
        onSelect={(value) => {
          updateSettings({ defaultPriority: value });
          setIsPriorityOpen(false);
        }}
        onClose={() => setIsPriorityOpen(false)}
      />

      <FormModal
        visible={isPasswordOpen}
        title="Change password"
        fields={PASSWORD_FIELDS}
        submitLabel="Update"
        onSubmit={handleChangePassword}
        onClose={() => setIsPasswordOpen(false)}
      />

      <ConfirmModal
        visible={isClearOpen}
        title="Clear completed tasks"
        message={`Clear ${completedCount} completed ${
          completedCount === 1 ? 'task' : 'tasks'
        } from your list? They still count towards your Insights.`}
        confirmText="Clear"
        onConfirm={() => {
          clearCompleted();
          setIsClearOpen(false);
        }}
        onCancel={() => setIsClearOpen(false)}
      />

      <ConfirmModal
        visible={isDeleteOpen}
        title="Delete account"
        message="This permanently deletes your account and all of its tasks from every device. This can't be undone."
        confirmText="Delete"
        onConfirm={async () => {
          setIsDeleteOpen(false);
          const result = await deleteAccount();
          if (result?.error) setDeleteError(result.error);
        }}
        onCancel={() => setIsDeleteOpen(false)}
      />

      <ConfirmModal
        visible={Boolean(deleteError)}
        title="Could not delete account"
        message={deleteError}
        confirmText="OK"
        onConfirm={() => setDeleteError('')}
        onCancel={() => setDeleteError('')}
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
});
