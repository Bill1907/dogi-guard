import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "@/hooks/useTranslation";

export default function Index() {
  const { t, locale, setLocale } = useTranslation();

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ko' : 'en';
    setLocale(newLocale);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{t('greeting')}</Text>
      <Text style={styles.welcome}>{t('welcome')}</Text>
      
      <View style={styles.languageInfo}>
        <Text style={styles.currentLanguage}>
          {t('language.current')}: {locale === 'en' ? t('language.english') : t('language.korean')}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
        <Text style={styles.buttonText}>
          {t('language.switchTo', { 
            language: locale === 'en' ? t('language.korean') : t('language.english') 
          })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  welcome: {
    fontSize: 18,
    marginBottom: 30,
    color: "#666",
    textAlign: "center",
  },
  languageInfo: {
    marginBottom: 20,
  },
  currentLanguage: {
    fontSize: 16,
    color: "#444",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
