import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import ProfileAvatarButton from '../components/ProfileAvatarButton';
import CategoryItem from '../components/CategoryItem';
import CategoryModal from '../components/CategoryModal';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { SIZES, SPACING } from '../theme/spacing';

export default function CategoriesScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { categories, addCategory, updateCategory } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null means adding

  const otherNames = categories
    .filter((category) => category.id !== editingCategory?.id)
    .map((category) => category.name);

  const openAddModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSave = (name) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, name);
    } else {
      addCategory(name);
    }
    setIsModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Categories"
        onBack={() => navigation.navigate('Tasks')}
        right={<ProfileAvatarButton />}
      />

      <FlatList
        style={styles.flex}
        data={categories}
        keyExtractor={(category) => category.id}
        renderItem={({ item }) => (
          <CategoryItem category={item} onEdit={() => openEditModal(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <PrimaryButton title="Add category" onPress={openAddModal} />
      </View>

      <CategoryModal
        visible={isModalOpen}
        title={editingCategory ? 'Edit category' : 'Add category'}
        initialName={editingCategory?.name ?? ''}
        otherNames={otherNames}
        onSave={handleSave}
        onCancel={() => setIsModalOpen(false)}
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
  list: {
    paddingHorizontal: SIZES.screenPadding,
  },
  footer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
});
