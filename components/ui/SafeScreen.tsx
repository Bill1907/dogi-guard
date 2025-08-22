import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeScreenProps {
  children: ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  mode?: 'padding' | 'margin';
}

export function SafeScreen({ 
  children, 
  style, 
  backgroundColor = 'transparent',
  edges = ['top', 'bottom'],
  mode = 'padding'
}: SafeScreenProps) {
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }, style]}
      edges={edges}
      mode={mode}
    >
      {children}
    </SafeAreaView>
  );
}

// Hook for manual safe area control
export function useSafeAreaSpacing() {
  const insets = useSafeAreaInsets();
  
  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    statusBarHeight: insets.top,
    navigationBarHeight: insets.bottom,
    insets
  };
}

// Utility component for custom spacing
interface SafeAreaSpacerProps {
  position: 'top' | 'bottom' | 'left' | 'right';
  backgroundColor?: string;
}

export function SafeAreaSpacer({ position, backgroundColor = 'transparent' }: SafeAreaSpacerProps) {
  const insets = useSafeAreaInsets();
  
  const getSpacingStyle = () => {
    switch (position) {
      case 'top':
        return { height: insets.top, backgroundColor };
      case 'bottom':
        return { height: insets.bottom, backgroundColor };
      case 'left':
        return { width: insets.left, backgroundColor };
      case 'right':
        return { width: insets.right, backgroundColor };
    }
  };
  
  return <View style={getSpacingStyle()} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});