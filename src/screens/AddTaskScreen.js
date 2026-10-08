import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Header from '../components/Header';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import SubtaskItem from '../components/SubtaskItem';
import CategoryPickerModal from '../components/CategoryPickerModal';
import ConfirmModal from '../components/ConfirmModal';
import CategoryModal from '../components/CategoryModal';
import DatePickerModal from '../components/DatePickerModal';
import TimePickerModal from '../components/TimePickerModal';
import OptionChips from '../components/OptionChips';
import { useApp } from '../context/AppContext';
import { formatDate, formatTime } from '../utils/date';
import { detectConflicts } from '../utils/conflicts';
import { ESTIMATE_OPTIONS, PRIORITY_OPTIONS, REMINDER_OPTIONS, REPEAT_OPTIONS } from '../data/taskOptions';
import { generateId } from '../utils/id';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SIZES, SPACING } from '../theme/spacing';

export default function AddTaskScreen({ navigation, route }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { tasks, categories, settings, addTask, updateTask, addCategory, updateCategory, deleteCategory } = useApp();
  const subtaskInputRef = useRef(null);

  const editingTaskId = route.params?.taskId;
  const editingTask = tasks.find((task) => task.id === editingTaskId);
  const isEditing = Boolean(editingTask);

  const [title, setTitle] = useState(editingTask?.title ?? '');
  const [categoryId, setCategoryId] = useState(editingTask?.categoryId ?? null);
  const [dueDate, setDueDate] = useState(
    editingTask?.dueDate ? new Date(editingTask.dueDate) : null
  ); // a Date object, or null
  const [dueTime, setDueTime] = useState(editingTask?.dueTime ?? null); // 'HH:MM', or null
  const [priority, setPriority] = useState(editingTask?.priority ?? settings.defaultPriority);
  const [estimate, setEstimate] = useState(editingTask?.estimate ?? null); // minutes, or null
  const [reminder, setReminder] = useState(editingTask?.reminder ?? null); // minutes before, or null
  const [repeat, setRepeat] = useState(editingTask?.repeat ?? null); // 'daily' | 'weekly' | 'monthly'
  const [favorite, setFavorite] = useState(editingTask?.favorite ?? false);
  const [pinned, setPinned] = useState(editingTask?.pinned ?? false);
  const [subtasks, setSubtasks] = useState(
    editingTask
      ? editingTask.subtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
          completed: subtask.completed,
        }))
      : []
  );
  const [subtaskText, setSubtaskText] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [conflictMessages, setConflictMessages] = useState([]);
  const [categoryToEdit, setCategoryToEdit] = useState(null); // null means adding
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const selectedCategory = categories.find((category) => category.id === categoryId);
  const canSave = title.trim().length > 0;

  // Let the picker sheet finish closing before the next modal opens (iOS drops it otherwise).
  const handleCreateCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryPickerOpen(false);
    setTimeout(() => setIsNewCategoryOpen(true), 300);
  };

  const handleEditCategory = (category) => {
    setCategoryToEdit(category);
    setIsCategoryPickerOpen(false);
    setTimeout(() => setIsNewCategoryOpen(true), 300);
  };

  const handleDeleteCategory = (category) => {
    setIsCategoryPickerOpen(false);
    setTimeout(() => setCategoryToDelete(category), 300);
  };

  const handleSaveCategory = (name) => {
    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, name);
    } else {
      const created = addCategory(name);
      setCategoryId(created.id);
      setCategoryError('');
    }
    setIsNewCategoryOpen(false);
  };

  const handleConfirmDeleteCategory = () => {
    deleteCategory(categoryToDelete.id);
    if (categoryToDelete.id === categoryId) setCategoryId(null);
    setCategoryToDelete(null);
  };

  const handleSelectCategory = (id) => {
    setCategoryId(id);
    setCategoryError('');
    setIsCategoryPickerOpen(false);
  };

  const handleConfirmDate = (date) => {
    const chosenDate = new Date(date);
    chosenDate.setHours(12, 0, 0, 0); // noon avoids time-zone date shifts
    setDueDate(chosenDate);
    setIsDatePickerOpen(false);
  };

  const handleConfirmTime = (time) => {
    setDueTime(time);
    setIsTimePickerOpen(false);
  };

  const handleAddSubtask = () => {
    const text = subtaskText.trim();
    if (!text) {
      subtaskInputRef.current?.focus(); // empty row: put the cursor there
      return;
    }
    setSubtasks((previous) => [
      ...previous,
      { id: generateId(), title: text, completed: false },
    ]);
    setSubtaskText('');
    subtaskInputRef.current?.focus(); // keep typing the next one
  };

  const handleRemoveSubtask = (subtaskId) => {
    setSubtasks((previous) => previous.filter((subtask) => subtask.id !== subtaskId));
  };

  // Checks for clashes first; if there are any, asks before saving.
  const handleSave = () => {
    if (!categoryId) {
      setCategoryError('Please choose a category');
      return;
    }
    const { messages } = detectConflicts(tasks, {
      id: editingTask?.id,
      dueDate,
      dueTime,
      estimate,
    });
    if (messages.length > 0) {
      setConflictMessages(messages);
      return;
    }
    commitSave();
  };

  const commitSave = () => {
    setConflictMessages([]);

    // If something is typed in the subtask row but "+" wasn't tapped, keep it.
    const pendingSubtask = subtaskText.trim();
    const dueDateIso = dueDate ? dueDate.toISOString() : null;
    // A time and a reminder only make sense when there is a due date.
    const savedDueTime = dueDate ? dueTime : null;
    const savedReminder = dueDate ? reminder : null;
    const savedRepeat = dueDate ? repeat : null;

    if (isEditing) {
      updateTask(editingTask.id, {
        title,
        categoryId,
        dueDate: dueDateIso,
        dueTime: savedDueTime,
        priority,
        reminder: savedReminder,
        repeat: savedRepeat,
        estimate,
        favorite,
        pinned,
        subtasks: [
          ...subtasks,
          ...(pendingSubtask
            ? [{ id: generateId(), title: pendingSubtask, completed: false }]
            : []),
        ],
      });
    } else {
      addTask({
        title,
        categoryId,
        dueDate: dueDateIso,
        dueTime: savedDueTime,
        priority,
        reminder: savedReminder,
        repeat: savedRepeat,
        estimate,
        favorite,
        pinned,
        subtasks: [
          ...subtasks.map((subtask) => subtask.title),
          ...(pendingSubtask ? [pendingSubtask] : []),
        ],
      });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={isEditing ? 'Edit Task' : 'Add Task'} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CustomInput
            placeholder="Task title"
            value={title}
            onChangeText={setTitle}
            returnKeyType="done"
          />

          <CustomInput
            placeholder="Category"
            value={selectedCategory?.name}
            onPress={() => setIsCategoryPickerOpen(true)}
            error={categoryError}
          />

          <CustomInput
            placeholder="Due date"
            value={dueDate ? formatDate(dueDate) : ''}
            onPress={() => setIsDatePickerOpen(true)}
          />

          {dueDate ? (
            <>
              <CustomInput
                placeholder="Due time (optional)"
                value={dueTime ? formatTime(dueTime) : ''}
                onPress={() => setIsTimePickerOpen(true)}
              />

              <Text style={styles.fieldTitle}>Reminder</Text>
              <OptionChips options={REMINDER_OPTIONS} value={reminder} onChange={setReminder} />

              <Text style={styles.fieldTitle}>Repeat</Text>
              <OptionChips options={REPEAT_OPTIONS} value={repeat} onChange={setRepeat} />
            </>
          ) : null}

          <Text style={styles.fieldTitle}>Time needed</Text>
          <OptionChips options={ESTIMATE_OPTIONS} value={estimate} onChange={setEstimate} />

          <Text style={styles.fieldTitle}>Priority</Text>
          <OptionChips options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mark as favorite</Text>
            <Switch
              value={favorite}
              onValueChange={setFavorite}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Pin to top</Text>
            <Switch
              value={pinned}
              onValueChange={setPinned}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
          </View>

          <Text style={styles.sectionTitle}>Subtasks</Text>

          <View style={styles.addSubtaskRow}>
            <TextInput
              ref={subtaskInputRef}
              style={styles.addSubtaskInput}
              placeholder="Add Subtask"
              placeholderTextColor={COLORS.textPrimary}
              value={subtaskText}
              onChangeText={setSubtaskText}
              onSubmitEditing={handleAddSubtask}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleAddSubtask}
              hitSlop={10}
              accessibilityLabel="Add subtask"
            >
              <Feather name="plus" size={26} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onRemove={() => handleRemoveSubtask(subtask.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title={isEditing ? 'Update Task' : 'Save Task'}
            onPress={handleSave}
            disabled={!canSave}
          />
        </View>
      </KeyboardAvoidingView>

      <CategoryPickerModal
        visible={isCategoryPickerOpen}
        categories={categories}
        selectedId={categoryId}
        onSelect={handleSelectCategory}
        onCreate={handleCreateCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        onClose={() => setIsCategoryPickerOpen(false)}
      />

      <CategoryModal
        visible={isNewCategoryOpen}
        title={categoryToEdit ? 'Edit category' : 'New category'}
        initialName={categoryToEdit?.name ?? ''}
        otherNames={categories
          .filter((category) => category.id !== categoryToEdit?.id)
          .map((category) => category.name)}
        onSave={handleSaveCategory}
        onCancel={() => setIsNewCategoryOpen(false)}
      />

      <ConfirmModal
        visible={conflictMessages.length > 0}
        title="Schedule conflict"
        message={[...conflictMessages, 'Save this task anyway?'].join('\n\n')}
        confirmText="Save anyway"
        onConfirm={commitSave}
        onCancel={() => setConflictMessages([])}
      />

      <ConfirmModal
        visible={Boolean(categoryToDelete)}
        title="Delete category"
        message={`Delete "${categoryToDelete?.name ?? ''}"? Its tasks will be kept as Uncategorized.`}
        confirmText="Delete"
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />

      <TimePickerModal
        visible={isTimePickerOpen}
        value={dueTime}
        onConfirm={handleConfirmTime}
        onCancel={() => setIsTimePickerOpen(false)}
      />

      <DatePickerModal
        visible={isDatePickerOpen}
        value={dueDate}
        onConfirm={handleConfirmDate}
        onCancel={() => setIsDatePickerOpen(false)}
      />
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
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  switchLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  fieldTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  addSubtaskInput: {
    ...TYPOGRAPHY.body,
    flex: 1,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.md,
  },
  footer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
});