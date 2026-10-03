import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import SubtaskItem from '../components/SubtaskItem';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import ConfirmModal from '../components/ConfirmModal';
import { useApp } from '../context/AppContext';
import { formatDueDate } from '../utils/date';
import { getPriorityLabel, getReminderLabel, getRepeatLabel } from '../data/taskOptions';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SIZES, SPACING } from '../theme/spacing';

export default function TaskDetailsScreen({ navigation, route }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { tasks, toggleSubtask, deleteTask, getCategoryName } = useApp();
  const { taskId } = route.params;
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Always read the latest version of the task from the context,
  // so subtask checks update this screen immediately.
  const task = tasks.find((item) => item.id === taskId);

  const handleConfirmDelete = () => {
    setIsDeleteConfirmOpen(false);
    navigation.goBack();
    deleteTask(taskId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Task Details" onBack={() => navigation.goBack()} />

      {!task ? (
        <View style={styles.centered}>
          <EmptyState title="Task not found" message="This task no longer exists." />
        </View>
      ) : (
        <>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.category}>
            Category: {getCategoryName(task.categoryId)}
          </Text>
          <Text style={styles.dueDate}>
            Due date: {task.dueDate ? formatDueDate(task) : 'Not set'}
          </Text>
          <Text style={styles.dueDate}>Priority: {getPriorityLabel(task.priority)}</Text>
          <Text style={styles.dueDate}>Reminder: {getReminderLabel(task.reminder)}</Text>
          <Text style={styles.dueDate}>Repeat: {getRepeatLabel(task.repeat)}</Text>
          {task.favorite || task.pinned ? (
            <Text style={styles.dueDate}>
              {[task.favorite && 'Favorite', task.pinned && 'Pinned'].filter(Boolean).join(' · ')}
            </Text>
          ) : null}

          <Text style={styles.sectionTitle}>Subtasks</Text>

          {task.subtasks.length === 0 ? (
            <Text style={styles.noSubtasks}>No subtasks</Text>
          ) : (
            task.subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={() => toggleSubtask(task.id, subtask.id)}
              />
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title="Edit Task"
            onPress={() => navigation.navigate('AddTask', { taskId })}
          />
          <PrimaryButton
            title="Delete Task"
            variant="danger"
            onPress={() => setIsDeleteConfirmOpen(true)}
            style={styles.deleteButton}
          />
        </View>

        <ConfirmModal
          visible={isDeleteConfirmOpen}
          title="Delete task"
          message={`Delete "${task.title}"? This can't be undone.`}
          confirmText="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
        </>
      )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.textPrimary,
  },
  category: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  dueDate: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  footer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  deleteButton: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  noSubtasks: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    paddingVertical: SPACING.md,
  },
});