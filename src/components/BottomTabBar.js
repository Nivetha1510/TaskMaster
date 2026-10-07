import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

// [active icon, inactive icon] for each tab
const TAB_ICONS = {
  Tasks: ['list', 'list-outline'],
  Focus: ['timer', 'timer-outline'],
  Insights: ['stats-chart', 'stats-chart-outline'],
  Profile: ['person', 'person-outline'],
};

export default function BottomTabBar({ state, navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? COLORS.textPrimary : COLORS.textSecondary;
        const [activeIcon, inactiveIcon] = TAB_ICONS[route.name];

        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
          >
            <Ionicons name={focused ? activeIcon : inactiveIcon} size={26} color={color} />
            <Text style={[styles.label, { color }]}>{route.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.navLabel,
  },
});