import { useTranslation } from "@/hooks/useTranslation";
import { StyleSheet, Text, View } from "react-native";

export default function Header() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text>{t("language.current")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
});
