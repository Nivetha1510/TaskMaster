import React, { useEffect } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const APP_MAX_WIDTH = 480;
const STYLE_ID = 'taskmaster-responsive-styles';

// Real CSS media queries, injected once on web. React Native styles cannot express them.
const WEB_CSS = `
  html, body, #root {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  body {
    overflow: hidden;
    overscroll-behavior: none;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  #taskmaster-frame {
    height: 100vh;
    height: 100dvh;
  }

  /* Phones: fill the screen edge to edge, stop iOS zooming into inputs. */
  @media (max-width: 480px) {
    #taskmaster-frame {
      max-width: 100% !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
    input, textarea, select {
      font-size: 16px !important;
    }
  }

  /* Tablets and desktop: show the app as a centered phone-width column. */
  @media (min-width: 481px) {
    body {
      background-color: #0f172a;
    }
    #taskmaster-frame {
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.35);
    }
  }

  /* Tall desktop windows get a rounded device-like frame. */
  @media (min-width: 481px) and (min-height: 760px) {
    #taskmaster-frame {
      height: min(calc(100dvh - 48px), 900px);
      margin-top: 24px;
      border-radius: 24px !important;
    }
  }

  /* Landscape phones: avoid notch overlap. */
  @media (max-height: 480px) and (orientation: landscape) {
    #taskmaster-frame {
      max-width: 100% !important;
    }
  }
`;

function useWebResponsiveStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = WEB_CSS;
    document.head.appendChild(style);
  }, []);
}

// Constrains the app to a phone-width column on wide web viewports; a no-op on native.
export default function ResponsiveContainer({ children }) {
  const { colors } = useTheme();
  useWebResponsiveStyles();

  if (Platform.OS !== 'web') {
    return <View style={styles.native}>{children}</View>;
  }

  return (
    <View style={styles.outer}>
      <View
        nativeID="taskmaster-frame"
        style={[styles.frame, { backgroundColor: colors.background }]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  native: {
    flex: 1,
  },
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: APP_MAX_WIDTH,
    overflow: 'hidden',
  },
});
