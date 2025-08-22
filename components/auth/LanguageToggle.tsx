import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { Theme } from '@/constants/Theme';

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  const toggleLanguage = () => {
    const newLocale = locale === 'ko' ? 'en' : 'ko';
    setLocale(newLocale);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
      <Ionicons 
        name="language" 
        size={20} 
        color={Theme.colors.text.secondary} 
      />
      <Text style={styles.text}>
        {locale === 'ko' ? 'EN' : '한'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.glass.background,
    borderRadius: Theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.glassLight,
  },
  text: {
    marginLeft: Theme.spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
  },
});