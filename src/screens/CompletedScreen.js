import React, { useState, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import ProfileAvatarButton from '../components/ProfileAvatarButton';
import CompletedItem from '../components/CompletedItem';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import { useApp } from '../context/AppContext';
import { formatIsoDate } from '../utils/date';
import { useTheme } from '../theme/ThemeContext';
import { SIZES } from '../theme/spacing';

export default function CompletedScreen() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { tasks, isLoading, toggleTask, deleteTask } = useApp();
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Filter first, then sort the new array so the context array is never mutated.
  const completedTasks = tasks
    .filter((task) => task.completed)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const handleConfirmDelete = () => {
    deleteTask(taskToDelete.id);
    setTaskToDelete(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Completed" right={<ProfileAvatarButton />} />

      <FlatList
        data={completedTasks}
        keyExtractor={(task) => task.id}
        renderItem={({ item }) => (
          <CompletedItem
            title={item.title}
            completedOn={formatIsoDate(item.completedAt)}
            onUndo={() => toggleTask(item.id)}
            onDelete={() => setTaskToDelete(item)}
          />
        )}
        contentContainerStyle={[styles.list, completedTasks.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="No completed tasks yet"
              message="Tasks you finish will appear here."
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <ConfirmModal
        visible={Boolean(taskToDelete)}
        title="Delete task"
        message={`Delete "${taskToDelete?.title ?? ''}"? This can't be undone.`}
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </SafeAreaView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    paddingHorizontal: SIZES.screenPadding,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
