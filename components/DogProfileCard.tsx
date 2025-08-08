import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { Dog } from '@/types/Dog';
import { calculateAge } from '@/utils/dateHelpers';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.85;
const CARD_HEIGHT = '85%';

interface DogProfileCardProps {
  dog: Dog;
}

export const DogProfileCard: React.FC<DogProfileCardProps> = ({ dog }) => {
  const { t } = useTranslation();
  const age = calculateAge(dog.birth);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Gradient Background Effect */}
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
        
        {/* Profile Image */}
        <View style={styles.imageContainer}>
          {dog.photo ? (
            <Image source={{ uri: dog.photo }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="paw" size={50} color="#fff" />
            </View>
          )}
        </View>

        {/* Dog Name */}
        <Text style={styles.dogName}>{dog.name}</Text>
        
        {/* Age and Weight */}
        <View style={styles.infoRow}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoLabel}>{t('dogProfile.yearsOld', { age })}</Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoLabel}>{t('dogProfile.weight', { weight: dog.weight })}</Text>
          </View>
        </View>

        {/* Current Medications */}
        <View style={styles.medicationsSection}>
          <Text style={styles.sectionTitle}>{t('dogProfile.currentMedications')}</Text>
          {dog.currentMedications && dog.currentMedications.length > 0 ? (
            <View style={styles.medicationsList}>
              {dog.currentMedications.map((med, index) => (
                <View key={index} style={styles.medicationPill}>
                  <Text style={styles.medicationText}>{med}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noMedications}>{t('dogProfile.noMedications')}</Text>
          )}
        </View>

        {/* Heartworm Info */}
        <View style={styles.heartwormSection}>
          <Ionicons name="heart" size={20} color="#FF6B6B" />
          <Text style={styles.heartwormText}>{dog.heartworkMedicationName}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#667eea',
    opacity: 0.1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#764ba2',
    opacity: 0.05,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  imageContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  infoBadge: {
    backgroundColor: '#f0f3ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  infoLabel: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  medicationsSection: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  medicationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  medicationPill: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  medicationText: {
    fontSize: 14,
    color: '#2980b9',
  },
  noMedications: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  heartwormSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  heartwormText: {
    fontSize: 16,
    color: '#2d3436',
    fontWeight: '600',
  },
});