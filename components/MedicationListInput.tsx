import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { COMMON_DOG_MEDICATIONS } from '@/utils/validation';

interface MedicationListInputProps {
  value: string[];
  onChange: (medications: string[]) => void;
  placeholder?: string;
}

export const MedicationListInput: React.FC<MedicationListInputProps> = ({
  value,
  onChange,
  placeholder = 'form.addMedication',
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = COMMON_DOG_MEDICATIONS.filter(med =>
    med.toLowerCase().includes(inputValue.toLowerCase()) &&
    !value.includes(med)
  );

  const addMedication = (medication: string) => {
    if (medication.trim() && !value.includes(medication.trim())) {
      onChange([...value, medication.trim()]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeMedication = (index: number) => {
    const newMedications = [...value];
    newMedications.splice(index, 1);
    onChange(newMedications);
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setShowSuggestions(text.length > 0);
  };

  const handleInputSubmit = () => {
    addMedication(inputValue);
  };

  const selectSuggestion = (medication: string) => {
    addMedication(medication);
  };

  return (
    <View style={styles.container}>
      {/* Current medications list */}
      {value.length > 0 && (
        <View style={styles.medicationsList}>
          {value.map((medication, index) => (
            <View key={index} style={styles.medicationPill}>
              <Text style={styles.medicationText}>{medication}</Text>
              <TouchableOpacity
                onPress={() => removeMedication(index)}
                style={styles.removeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input for adding new medication */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder={t(placeholder)}
          placeholderTextColor="#95a5a6"
          returnKeyType="done"
          onSubmitEditing={handleInputSubmit}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={handleInputSubmit}
          style={[styles.addButton, !inputValue.trim() && styles.addButtonDisabled]}
          disabled={!inputValue.trim()}
        >
          <Ionicons 
            name="add-circle" 
            size={24} 
            color={inputValue.trim() ? "#667eea" : "#bdc3c7"} 
          />
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(item)}
              >
                <Text style={styles.suggestionText}>{item}</Text>
                <Ionicons name="add" size={16} color="#667eea" />
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Empty state message */}
      {value.length === 0 && (
        <Text style={styles.emptyMessage}>{t('form.noMedicationsAdded')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container for the entire component
  },
  medicationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  medicationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  medicationText: {
    fontSize: 14,
    color: '#2980b9',
    marginRight: 6,
  },
  removeButton: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3436',
    minHeight: 48,
  },
  addButton: {
    padding: 12,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsList: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2d3436',
    flex: 1,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
});