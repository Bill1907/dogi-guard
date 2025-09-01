import { Stack } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';

export default function MapLayout() {
  const { t } = useI18n();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('map.title'),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: t('map.placeDetail'),
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}