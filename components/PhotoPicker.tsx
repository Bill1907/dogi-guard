import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '@/hooks/useTranslation';

interface PhotoPickerProps {
  photo?: string;
  onPhotoSelect: (photoUri: string) => void;
  onPhotoRemove: () => void;
  error?: string;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  photo,
  onPhotoSelect,
  onPhotoRemove,
  error,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        t('photo.permissionRequired'),
        t('photo.permissionMessage'),
        [{ text: t('actions.ok') }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelect(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(
        t('errors.photoError'),
        t('errors.cameraError'),
        [{ text: t('actions.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelect(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert(
        t('errors.photoError'),
        t('errors.galleryError'),
        [{ text: t('actions.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const showImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t('actions.cancel'),
            t('photo.takePhoto'),
            t('photo.chooseFromGallery'),
            ...(photo ? [t('photo.removePhoto')] : []),
          ],
          cancelButtonIndex: 0,
          destructiveButtonIndex: photo ? 3 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickFromGallery();
          } else if (buttonIndex === 3 && photo) {
            onPhotoRemove();
          }
        }
      );
    } else {
      // Android: Show custom alert
      Alert.alert(
        t('photo.selectPhoto'),
        '',
        [
          { text: t('actions.cancel'), style: 'cancel' },
          { text: t('photo.takePhoto'), onPress: takePhoto },
          { text: t('photo.chooseFromGallery'), onPress: pickFromGallery },
          ...(photo ? [{ text: t('photo.removePhoto'), onPress: onPhotoRemove, style: 'destructive' as const }] : []),
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.photoContainer, error && styles.photoContainerError]}
        onPress={showImagePicker}
        disabled={loading}
      >
        {photo ? (
          <>
            <Image source={{ uri: photo }} style={styles.photo} />
            <View style={styles.photoOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons 
              name="camera" 
              size={32} 
              color={error ? "#e74c3c" : "#95a5a6"} 
            />
            <Text style={[styles.placeholderText, error && styles.placeholderTextError]}>
              {t('photo.addPhoto')}
            </Text>
          </View>
        )}
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <Ionicons name="sync" size={24} color="#667eea" />
          </View>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Text style={styles.hintText}>{t('photo.tapToChange')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  photoContainerError: {
    borderColor: '#e74c3c',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 58,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
    textAlign: 'center',
  },
  placeholderTextError: {
    color: '#e74c3c',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 58,
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 8,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 8,
    textAlign: 'center',
  },
});