import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export class LocationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      // First check if permission is already granted
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      if (existingStatus === 'granted') {
        return true;
      }

      // Request permission with timeout
      const permissionPromise = Location.requestForegroundPermissionsAsync();
      const timeoutPromise = new Promise<{ status: any }>((_, reject) => {
        setTimeout(() => reject(new Error('Permission request timeout')), 10000);
      });

      const { status } = await Promise.race([permissionPromise, timeoutPromise]);
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Location permission denied, using default location');
        return null;
      }

      // Add timeout to prevent infinite waiting
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced for faster response
        timeInterval: 10000, // 10 seconds timeout
        distanceInterval: 0,
      });

      // Implement timeout manually
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Location timeout')), 15000); // 15 seconds
      });

      const location = await Promise.race([locationPromise, timeoutPromise]);

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        altitude: location.coords.altitude ?? undefined,
        altitudeAccuracy: location.coords.altitudeAccuracy ?? undefined,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  static async watchLocation(
    callback: (location: UserLocation) => void,
    options?: {
      accuracy?: Location.Accuracy;
      distanceInterval?: number;
      timeInterval?: number;
    }
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      return await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          distanceInterval: options?.distanceInterval || 10,
          timeInterval: options?.timeInterval || 10000,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined,
            altitude: location.coords.altitude ?? undefined,
            altitudeAccuracy: location.coords.altitudeAccuracy ?? undefined,
            heading: location.coords.heading ?? undefined,
            speed: location.coords.speed ?? undefined,
          });
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }

  static async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (!address) return null;

      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.streetNumber) parts.push(address.streetNumber);
      if (address.district) parts.push(address.district);
      if (address.city) parts.push(address.city);
      if (address.region) parts.push(address.region);
      if (address.country) parts.push(address.country);

      return parts.join(', ');
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return null;
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private static toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}