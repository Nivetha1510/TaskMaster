import React, { useState, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ProfileAvatarButton from '../components/ProfileAvatarButton';
import TaskItem from '../components/TaskItem';
import QuickAddBar from '../components/QuickAddBar';
import DoNowModal from '../components/DoNowModal';
import FAB from '../components/FAB';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import SearchBar from '../components/SearchBar';
import OptionChips from '../components/OptionChips';
import OptionSheet from '../components/OptionSheet';
import { useApp } from '../context/AppContext';
import {
  FILTER_OPTIONS,
  PRIORITY_FILTER_OPTIONS,
  SORT_OPTIONS,
  DEFAULT_PRIORITY,
  getPriorityRank,
} from '../data/taskOptions';
import { getDueDateTime } from '../utils/date';
import { getGreeting } from '../utils/greeting';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { RADIUS, SIZES, SPACING } from '../theme/spacing';

const getMenuOptions = (task) => [
  { value: 'edit', label: 'Edit', icon: 'edit-2' },
  {
    value: 'pin',
    label: task?.pinned ? 'Unpin' : 'Pin to top',
    icon: task?.pinned ? 'pin-outline' : 'pin',
    iconFamily: 'ionicons',
  },
  { value: 'duplicate', label: 'Duplicate', icon: 'copy' },
  { value: 'delete', label: 'Delete', icon: 'trash-2', destructive: true },
];

// Time to let the action sheet finish closing before another modal opens
// (iOS can drop a modal that opens while another is still dismissing).
const MODAL_SWITCH_DELAY_MS = 300;

const COMPARATORS = {
  recent: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  due: (a, b) => {
    const aDue = getDueDateTime(a)?.getTime() ?? Infinity;
    const bDue = getDueDateTime(b)?.getTime() ?? Infinity;
    if (aDue === bDue) return 0; // also covers two tasks with no due date
    return aDue < bDue ? -1 : 1;
  },
  priority: (a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority),
  alpha: (a, b) => a.title.localeCompare(b.title),
};

export default function TasksScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `${getGreeting()}, ${firstName}` : getGreeting();
  const { tasks, isLoading, toggleTask, toggleFavorite, togglePin, deleteTask, duplicateTask, getCategoryName } = useApp();

  const [searchText, setSearchText] = useState('');
  const [tab, setTab] = useState('pending'); // 'all' | 'pending' | 'completed'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [sortBy, setSortBy] = useState('recent');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [menuTask, setMenuTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDoNowOpen, setIsDoNowOpen] = useState(false);

  const openAddTask = () => navigation.navigate('AddTask');
  const openTaskDetails = (taskId) => navigation.navigate('TaskDetails', { taskId });

  const pendingCount = tasks.filter((task) => !task.completed).length;
  const countText =
    pendingCount === 0
      ? 'All caught up'
      : `${pendingCount} ${pendingCount === 1 ? 'task' : 'tasks'} remaining`;

  // Search + tab + priority filter, then sort.
  const query = searchText.trim().toLowerCase();
  const visibleTasks = tasks
    .filter((task) => {
      if (tab === 'pending' && task.completed) return false;
      if (tab === 'completed' && !task.completed) return false;
      if (priorityFilter !== 'all' && (task.priority ?? DEFAULT_PRIORITY) !== priorityFilter) {
        return false;
      }
      if (favoritesOnly && !task.favorite) return false;
      if (!query) return true;
      return (
        task.title.toLowerCase().includes(query) ||
        getCategoryName(task.categoryId).toLowerCase().includes(query)
      );
    })
    .sort(COMPARATORS[sortBy]);

  // Group: Pinned (pending pinned tasks), then Today (due today, overdue, or no date),
  // Upcoming (due after today) and Completed.
  const tomorrowStart = new Date();
  tomorrowStart.setHours(0, 0, 0, 0);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const isUpcoming = (task) => Boolean(task.dueDate) && new Date(task.dueDate) >= tomorrowStart;

  // Daily progress: tasks finished today vs. everything on today's plate
  // (finished today + still pending and not due in the future).
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const doneToday = tasks.filter(
    (task) => task.completed && task.completedAt && new Date(task.completedAt) >= todayStart
  ).length;
  const pendingToday = tasks.filter((task) => !task.completed && !isUpcoming(task)).length;
  const totalToday = doneToday + pendingToday;
  const progress = totalToday === 0 ? 0 : doneToday / totalToday;

  const sections = [
    {
      key: 'pinned',
      title: 'Pinned',
      data: visibleTasks.filter((task) => !task.completed && task.pinned),
    },
    {
      key: 'today',
      title: 'Today',
      data: visibleTasks.filter((task) => !task.completed && !task.pinned && !isUpcoming(task)),
    },
    {
      key: 'upcoming',
      title: 'Upcoming',
      data: visibleTasks.filter((task) => !task.completed && !task.pinned && isUpcoming(task)),
    },
    {
      key: 'completed',
      title: 'Completed',
      data: visibleTasks.filter((task) => task.completed),
    },
  ].filter((section) => section.data.length > 0);

  const handleMenuSelect = (action) => {
    const task = menuTask;
    setMenuTask(null);
    if (action === 'edit') {
      navigation.navigate('AddTask', { taskId: task.id });
    } else if (action === 'pin') {
      togglePin(task.id);
    } else if (action === 'duplicate') {
      duplicateTask(task.id);
    } else if (action === 'delete') {
      setTimeout(() => setTaskToDelete(task), MODAL_SWITCH_DELAY_MS);
    }
  };

  const handleConfirmDelete = () => {
    deleteTask(taskToDelete.id);
    setTaskToDelete(null);
  };

  const hasPriorityFilter = priorityFilter !== 'all';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="My Tasks" right={<ProfileAvatarButton />} />
      <Text style={styles.greeting}>{greeting}</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Daily progress</Text>
          <Text style={styles.progressValue}>
            {doneToday}/{totalToday} done · {Math.round(progress * 100)}%
          </Text>
        </View>
        <View
          style={styles.progressTrack}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Daily progress"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        >
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.actionRow}>
        <QuickAddBar />
        <TouchableOpacity
          style={styles.doNowButton}
          onPress={() => setIsDoNowOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="What should I do now?"
        >
          <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
          <Text style={styles.doNowText}>Do now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <SearchBar value={searchText} onChangeText={setSearchText} />
        <OptionChips options={FILTER_OPTIONS} value={tab} onChange={setTab} style={styles.tabs} />

        <View style={styles.toolbar}>
          <Text style={styles.count}>{countText}</Text>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setFavoritesOnly((previous) => !previous)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Show favorites only"
            accessibilityState={{ selected: favoritesOnly }}
          >
            <Ionicons
              name={favoritesOnly ? 'star' : 'star-outline'}
              size={18}
              color={favoritesOnly ? COLORS.favorite : COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setIsFilterOpen(true)}
            hitSlop={8}
            accessibilityLabel="Filters"
          >
            <Feather
              name="sliders"
              size={16}
              color={hasPriorityFilter ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.toolbarText, hasPriorityFilter && styles.toolbarTextActive]}>
              Filters
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setIsSortOpen(true)}
            hitSlop={8}
            accessibilityLabel="Sort"
          >
            <Feather name="bar-chart" size={16} color={COLORS.textSecondary} />
            <Text style={styles.toolbarText}>Sort</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(task) => task.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            categoryName={getCategoryName(item.categoryId)}
            onPress={() => openTaskDetails(item.id)}
            onToggle={() => toggleTask(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onMenu={() => setMenuTask(item)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.list, sections.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          isLoading ? null : tasks.length === 0 ? (
            <EmptyState title="No tasks yet" message="Tap + to add your first task." />
          ) : (
            <EmptyState
              title="No matching tasks"
              message="Try a different search or filter."
            />
          )
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={openAddTask} />

      <DoNowModal
        visible={isDoNowOpen}
        onClose={() => setIsDoNowOpen(false)}
        onOpenTask={openTaskDetails}
      />

      <OptionSheet
        visible={isFilterOpen}
        title="Filter by priority"
        options={PRIORITY_FILTER_OPTIONS}
        selected={priorityFilter}
        onSelect={(value) => {
          setPriorityFilter(value);
          setIsFilterOpen(false);
        }}
        onClose={() => setIsFilterOpen(false)}
      />

      <OptionSheet
        visible={isSortOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        selected={sortBy}
        onSelect={(value) => {
          setSortBy(value);
          setIsSortOpen(false);
        }}
        onClose={() => setIsSortOpen(false)}
      />

      <OptionSheet
        visible={Boolean(menuTask)}
        title={menuTask?.title}
        options={getMenuOptions(menuTask)}
        onSelect={handleMenuSelect}
        onClose={() => setMenuTask(null)}
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
  greeting: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SPACING.sm,
  },
  progressCard: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.inputBackground,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    ...TYPOGRAPHY.taskTitle,
    color: COLORS.textPrimary,
  },
  progressValue: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.divider,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SPACING.md,
  },
  doNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    height: SIZES.chipHeight + SPACING.sm,
    borderRadius: RADIUS.round,
    borderWidth: SIZES.cardBorder,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.inputBackground,
  },
  doNowText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  controls: {
    paddingHorizontal: SIZES.screenPadding,
  },
  tabs: {
    marginTop: SPACING.md,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  count: {
    ...TYPOGRAPHY.secondary,
    flex: 1,
    color: COLORS.textSecondary,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.lg,
  },
  toolbarText: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  toolbarTextActive: {
    color: COLORS.primary,
  },
  list: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.fab + SPACING.xxl, // keeps the last card clear of the FAB
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
  },
  sectionCount: {
    ...TYPOGRAPHY.secondary,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
});
