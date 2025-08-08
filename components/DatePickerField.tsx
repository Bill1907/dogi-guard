import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Platform, 
  Modal, 
  View 
} from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/utils/dateHelpers';

// For native date picker
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerFieldProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  placeholder = 'form.selectDate',
  minimumDate,
  maximumDate,
  mode = 'date',
}) => {
  const { t, locale } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, the event contains the date selection
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const openPicker = () => {
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  const displayValue = value ? formatDate(value, locale) : t(placeholder);
  const hasValue = value !== null;

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={openPicker}>
        <View style={styles.content}>
          <Text style={[styles.text, !hasValue && styles.placeholder]}>
            {displayValue}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#667eea" />
        </View>
      </TouchableOpacity>

      {/* iOS Modal Picker */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={closePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={styles.modalButton}>{t('actions.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={[styles.modalButton, styles.doneButton]}>
                    {t('actions.done')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={value || new Date()}
                mode={mode}
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Direct Picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontSize: 16,
    color: '#2d3436',
    flex: 1,
  },
  placeholder: {
    color: '#95a5a6',
  },
  
  // iOS Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalButton: {
    fontSize: 16,
    color: '#667eea',
  },
  doneButton: {
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
  },
});