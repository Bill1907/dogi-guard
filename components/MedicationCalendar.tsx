import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Dog } from '@/types/Dog';
import { MedicationRecord, MedicationRecordInput } from '@/types/MedicationRecord';
import { calculateDDay, formatDate, getDDayColor } from '@/utils/dateHelpers';
import { useTranslation } from '@/hooks/useTranslation';
import { useSupabaseDogs } from '@/hooks/useSupabaseDogs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MedicationSelector } from './MedicationSelector';
import * as Haptics from 'expo-haptics';

// Configure Korean locale
LocaleConfig.locales['ko'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};

// Configure English locale (default)
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};

interface MedicationCalendarProps {
  dog: Dog;
  onFlip: () => void;
}

export const MedicationCalendar: React.FC<MedicationCalendarProps> = ({ dog, onFlip }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('');
  const [showMedicationSelector, setShowMedicationSelector] = useState(false);
  const [selectedDateForRecord, setSelectedDateForRecord] = useState('');
  const [medicationRecords, setMedicationRecords] = useState<MedicationRecord[]>([]);
  const [medicationSummary, setMedicationSummary] = useState<{ [date: string]: MedicationRecord[] }>({});
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Get medication functions from hook
  const { 
    recordMedication, 
    getMedicationRecordsForDate,
    getMedicationRecords 
  } = useSupabaseDogs();
  
  // Set locale based on current language
  const currentLocale = t('language.current') === 'Korean' ? 'ko' : 'en';
  LocaleConfig.defaultLocale = currentLocale;

  // Format dates for the calendar
  const lastMedDateStr = new Date(dog.lastHeartworkMedicationDate).toISOString().split('T')[0];
  const nextMedDateStr = new Date(dog.nextHeartworkMedicationDate).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate D-Day for next medication
  const nextDDay = calculateDDay(dog.nextHeartworkMedicationDate);
  const nextMedColor = getDDayColor(nextDDay);

  // Load medication records for the current month
  useEffect(() => {
    loadMedicationSummary();
  }, [dog.id]);

  const loadMedicationSummary = async () => {
    try {
      // Get all medication records for this dog
      const records = await getMedicationRecords(dog.id);
      
      if (records && records.length > 0) {
        // Group records by date
        const summary: { [date: string]: MedicationRecord[] } = {};
        records.forEach(record => {
          const date = record.recorded_date;
          if (!summary[date]) {
            summary[date] = [];
          }
          summary[date].push(record);
        });
        
        setMedicationSummary(summary);
      }
    } catch (error) {
      console.error('Error loading medication summary:', error);
    }
  };

  const handleDayPress = async (day: any) => {
    const selectedDate = day.dateString;
    setSelected(selectedDate);

    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.selectionAsync();
    }

    // Check if this date is in the future (don't allow recording future medications)
    const today = new Date();
    const clickedDate = new Date(selectedDate);
    
    if (clickedDate > today) {
      Alert.alert(
        t('medication.record.error'),
        t('medication.record.cannotRecordFuture'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    // Load existing records for this date
    setLoading(true);
    try {
      const records = await getMedicationRecordsForDate(dog.id, selectedDate);
      setMedicationRecords(records);
      
      // Show medication selector
      setSelectedDateForRecord(selectedDate);
      setShowMedicationSelector(true);
    } catch (error) {
      console.error('Error loading records for date:', error);
      Alert.alert(
        t('medication.record.error'),
        t('medication.record.failed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMedication = async (
    medications: string[], 
    dosages: { [key: string]: string }, 
    notes: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      let success = true;
      const newRecords: MedicationRecord[] = [];
      
      // Record each selected medication
      for (const medicationName of medications) {
        const input: MedicationRecordInput = {
          dog_id: dog.id,
          medication_name: medicationName,
          recorded_date: selectedDateForRecord,
          is_heartworm_medication: medicationName === dog.heartworkMedicationName,
          dosage: dosages[medicationName] || '',
          notes: notes || undefined,
        };

        const result = await recordMedication(input);
        if (result) {
          // Create a temporary record for immediate UI update
          newRecords.push({
            id: `temp-${Date.now()}-${Math.random()}`,
            dog_id: dog.id,
            medication_name: medicationName,
            recorded_date: selectedDateForRecord,
            is_heartworm_medication: medicationName === dog.heartworkMedicationName,
            dosage: dosages[medicationName] || '',
            notes: notes || undefined,
            user_id: '', // This will be populated by the backend
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          success = false;
          break;
        }
      }

      if (success) {
        // Immediately update medication summary state for instant UI feedback
        setMedicationSummary(prevSummary => {
          const updatedSummary = { ...prevSummary };
          const date = selectedDateForRecord;
          
          if (!updatedSummary[date]) {
            updatedSummary[date] = [];
          }
          
          // Add new records to the summary
          updatedSummary[date] = [...updatedSummary[date], ...newRecords];
          
          return updatedSummary;
        });

        // Show success message
        Alert.alert(
          t('notifications.success'),
          t('medication.record.success'),
          [{ text: t('common.ok') }]
        );

        // Close the selector
        setShowMedicationSelector(false);
        setSelectedDateForRecord('');
        
        // Reload medication summary in the background to get accurate data
        loadMedicationSummary().catch(console.error);
      } else {
        Alert.alert(
          t('medication.record.error'),
          t('medication.record.failed'),
          [{ text: t('common.ok') }]
        );
      }

      return success;
    } catch (error) {
      console.error('Error recording medications:', error);
      Alert.alert(
        t('medication.record.error'),
        t('medication.record.failed'),
        [{ text: t('common.ok') }]
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMedicationSelector = () => {
    setShowMedicationSelector(false);
    setSelectedDateForRecord('');
    setMedicationRecords([]);
  };

  // Prepare marked dates
  const markedDates: any = {};
  
  // Add medication records to marked dates
  Object.keys(medicationSummary).forEach(date => {
    markedDates[date] = {
      selected: false,
      marked: true,
      dotColor: '#4A90E2', // Blue for recorded medications
      customStyles: {
        container: {
          backgroundColor: 'rgba(74, 144, 226, 0.2)',
          borderRadius: 8,
        },
        text: {
          color: '#ffffff',
          fontWeight: 'bold' as any,
        },
      },
    };
  });
  
  // Add last medication date (if not already recorded)
  if (!markedDates[lastMedDateStr]) {
    markedDates[lastMedDateStr] = {
      selected: false,
      marked: true,
      dotColor: '#34C759', // Green for completed
      customStyles: {
        container: {
          backgroundColor: 'rgba(52, 199, 89, 0.2)',
          borderRadius: 8,
        },
        text: {
          color: '#ffffff',
          fontWeight: 'bold' as any,
        },
      },
    };
  }
  
  // Add next medication date
  markedDates[nextMedDateStr] = {
    selected: false,
    marked: true,
    dotColor: nextMedColor,
    customStyles: {
      container: {
        backgroundColor: `${nextMedColor}33`, // 20% opacity
        borderRadius: 8,
      },
      text: {
        color: '#ffffff',
        fontWeight: 'bold' as any,
      },
    },
  };
  
  // Add selected date
  if (selected) {
    markedDates[selected] = {
      ...markedDates[selected],
      selected: true,
      selectedColor: 'rgba(255, 255, 255, 0.2)',
      selectedTextColor: '#ffffff',
    };
  }

  // Calendar theme for dark mode with holographic effect
  const calendarTheme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: 'rgba(255, 255, 255, 0.7)',
    textSectionTitleDisabledColor: 'rgba(255, 255, 255, 0.3)',
    selectedDayBackgroundColor: 'rgba(255, 255, 255, 0.2)',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#FFD700', // Gold color for today
    todayBackgroundColor: 'rgba(255, 215, 0, 0.1)',
    dayTextColor: '#ffffff',
    textDisabledColor: 'rgba(255, 255, 255, 0.3)',
    dotColor: '#ffffff',
    selectedDotColor: '#ffffff',
    arrowColor: '#ffffff',
    disabledArrowColor: 'rgba(255, 255, 255, 0.3)',
    monthTextColor: '#ffffff',
    indicatorColor: '#ffffff',
    textDayFontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    textMonthFontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    textDayHeaderFontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    textDayFontWeight: '500' as any,
    textMonthFontWeight: 'bold' as any,
    textDayHeaderFontWeight: '600' as any,
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Platform.OS === 'ios' 
              ? Math.max(100, insets.bottom + 60) // Extra padding for iPhone home indicator
              : 100
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        scrollEventThrottle={16}
        decelerationRate="normal"
        keyboardShouldPersistTaps="handled"
      >
        {/* Calendar with medication dates marked */}
        <Calendar
          current={todayStr}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType={'custom'}
          theme={calendarTheme}
          style={styles.calendar}
          enableSwipeMonths={true}
          hideExtraDays={false}
          firstDay={0} // Sunday as first day
          renderArrow={(direction) => (
            <Ionicons 
              name={direction === 'left' ? 'chevron-back' : 'chevron-forward'} 
              size={20} 
              color="#ffffff" 
            />
          )}
        />

        {/* Instruction text */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            {t('medication.record.clickDateToRecord')}
          </Text>
        </View>

        {/* Medication info card */}
        <View style={styles.medicationInfo}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.infoCard}
          >
            <Text style={styles.infoTitle}>{dog.heartworkMedicationName}</Text>
            
            <View style={styles.infoRow}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.infoText}>
                {t('medication.lastDose')}: {formatDate(dog.lastHeartworkMedicationDate, currentLocale === 'ko' ? 'ko' : 'en')}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={[styles.statusDot, { backgroundColor: nextMedColor }]} />
              <Text style={styles.infoText}>
                {t('medication.nextDose')}: {formatDate(dog.nextHeartworkMedicationDate, currentLocale === 'ko' ? 'ko' : 'en')}
                <Text style={styles.dDayText}>
                  {' '}(D{nextDDay === 0 ? '-Day' : nextDDay > 0 ? `-${nextDDay}` : `+${Math.abs(nextDDay)}`})
                </Text>
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Medication schedule info section */}
        <View style={styles.scheduleSection}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
            style={styles.scheduleCard}
          >
            <Text style={styles.sectionTitle}>
              {currentLocale === 'ko' ? '투약 스케줄' : 'Medication Schedule'}
            </Text>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>
                • {currentLocale === 'ko' ? '정기 투약 주기' : 'Regular interval'}
              </Text>
              <Text style={styles.scheduleValue}>
                {currentLocale === 'ko' ? '매월 1회' : 'Monthly'}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>
                • {currentLocale === 'ko' ? '다음 투약까지' : 'Until next dose'}
              </Text>
              <Text style={[styles.scheduleValue, { color: nextMedColor }]}>
                {Math.abs(nextDDay)}{currentLocale === 'ko' ? '일' : ' days'} {nextDDay <= 0 ? (currentLocale === 'ko' ? '지연' : 'overdue') : (currentLocale === 'ko' ? '남음' : 'left')}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>
                • {currentLocale === 'ko' ? '투약 시간 권장' : 'Recommended time'}
              </Text>
              <Text style={styles.scheduleValue}>
                {currentLocale === 'ko' ? '오전 9:00 ~ 11:00' : '9:00 ~ 11:00 AM'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Tips section */}
        <View style={styles.tipsSection}>
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={styles.tipsCard}
          >
            <Text style={styles.sectionTitle}>
              💡 {currentLocale === 'ko' ? '투약 팁' : 'Medication Tips'}
            </Text>
            <Text style={styles.tipText}>
              • {currentLocale === 'ko' ? '같은 시간에 투약하여 습관을 만드세요' : 'Take medication at the same time to build routine'}
            </Text>
            <Text style={styles.tipText}>
              • {currentLocale === 'ko' ? '투약 전후 음식과 함께 주면 흡수가 좋습니다' : 'Give with food for better absorption'}
            </Text>
            <Text style={styles.tipText}>
              • {currentLocale === 'ko' ? '투약 후 30분간 격렬한 운동은 피해주세요' : 'Avoid intense exercise for 30 minutes after medication'}
            </Text>
            <Text style={styles.tipText}>
              • {currentLocale === 'ko' ? '부작용이 있으면 즉시 수의사와 상담하세요' : 'Consult veterinarian immediately if side effects occur'}
            </Text>
          </LinearGradient>
        </View>

        {/* Additional space for better scrolling */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Medication Selector Modal */}
      {showMedicationSelector && (
        <View style={styles.medicationSelectorOverlay}>
          <MedicationSelector
            dog={dog}
            selectedDate={selectedDateForRecord}
            onRecord={handleRecordMedication}
            onCancel={handleCancelMedicationSelector}
            loading={loading}
          />
        </View>
      )}

      {/* Back hint - positioned outside ScrollView to stay fixed */}
      <TouchableOpacity
        style={styles.backHint}
        onPress={onFlip}
        activeOpacity={0.6}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="card-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    minHeight: '120%', // Force content to be larger than container
    padding: Platform.OS === 'ios' ? 16 : 12,
    // paddingBottom is now handled dynamically in component
  },
  calendar: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginBottom: 20,
  },
  medicationInfo: {
    marginTop: 20,
  },
  bottomSpacing: {
    height: 80, // Additional space at bottom for better scrolling
  },
  infoCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  dDayText: {
    fontWeight: 'bold',
    opacity: 1,
  },
  backHint: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 8,
    zIndex: 10,
  },
  
  // Schedule section styles
  scheduleSection: {
    marginTop: 16,
  },
  scheduleCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  scheduleValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'right',
  },
  
  // Tips section styles
  tipsSection: {
    marginTop: 16,
  },
  tipsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tipText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginBottom: 6,
  },
  
  // Instruction text styles
  instructionContainer: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  instructionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Medication selector overlay
  medicationSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay for better contrast
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});