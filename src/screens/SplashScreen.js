import React, { useMemo } from 'react';
import { Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { FONTS, TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

// The artwork is drawn in the coordinates of the design file, then scaled to fit.
const VIEW_BOX = { x: 140, y: 370, width: 510, height: 545 };
const STROKE = 37;
const MAX_ARTWORK_WIDTH = 320;
const ARTWORK_SCREEN_RATIO = 0.7;

// Five-point star: outer points on a circle of radius `outer`, inner points on `inner`.
const buildStarPoints = (cx, cy, outer, inner) =>
  Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');

const STAR_POINTS = buildStarPoints(492, 793, 133, 65);

export default function SplashScreen() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { width: screenWidth } = useWindowDimensions();

  const artworkWidth = Math.min(screenWidth * ARTWORK_SCREEN_RATIO, MAX_ARTWORK_WIDTH);
  const artworkHeight = (artworkWidth * VIEW_BOX.height) / VIEW_BOX.width;

  return (
    <LinearGradient
      colors={[COLORS.splashTop, COLORS.splashBottom]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <Svg
        width={artworkWidth}
        height={artworkHeight}
        viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
        accessibilityLabel="TaskMaster logo"
      >
        {/* Clipboard: open at the bottom right, with a clip on top */}
        <Path
          d="M 324 883.5 H 194 Q 175.5 883.5 175.5 865 V 474 Q 175.5 455.5 194 455.5 H 268.5"
          stroke={COLORS.splashInk}
          strokeWidth={STROKE}
          fill="none"
        />
        <Path
          d="M 454.5 455.5 H 529 Q 547.5 455.5 547.5 474 V 604"
          stroke={COLORS.splashInk}
          strokeWidth={STROKE}
          fill="none"
        />
        <Rect
          x={268.5}
          y={399.5}
          width={186}
          height={112}
          rx={20}
          stroke={COLORS.splashInk}
          strokeWidth={STROKE}
          fill="none"
        />

        <Polygon points={STAR_POINTS} fill={COLORS.splashStar} />

        <SvgText
          x={490}
          y={648}
          fontSize={54}
          fontFamily={FONTS.bold}
          fill={COLORS.splashInk}
          textAnchor="middle"
        >
          TaskMaster
        </SvgText>
      </Svg>

      <Text style={styles.tagline}>Organize your day, conquer your goals.</Text>
    </LinearGradient>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.xl,
      paddingBottom: SPACING.xxl * 2, // sits a little above the middle, like the design
    },
    tagline: {
      ...TYPOGRAPHY.body,
      color: COLORS.splashInk,
      marginTop: SPACING.xxl + SPACING.xl,
      textAlign: 'center',
    },
  });
