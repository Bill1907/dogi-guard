import { UserLocation } from './LocationService';

export interface PlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

export interface PlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
}

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: PlaceGeometry;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  photos?: PlacePhoto[];
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  business_status?: string;
}

export interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
  next_page_token?: string;
  error_message?: string;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  coordinate: { latitude: number; longitude: number };
  type: "veterinary" | "pharmacy";
  distance?: number;
  phone?: string;
  hours?: string;
  rating?: number;
  photo_reference?: string;
}

export interface PlacesSearchOptions {
  radius?: number;
  type: 'veterinary' | 'pharmacy';
  locale?: string;
}

export enum PlacesErrorType {
  API_KEY_MISSING = 'API_KEY_MISSING',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class PlacesError extends Error {
  constructor(
    public type: PlacesErrorType,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PlacesError';
  }
}

export class PlacesService {
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  private static readonly DEFAULT_RADIUS = 5000; // 5km in meters

  private static getApiKey(): string | null {
    return process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || null;
  }

  static isApiKeyConfigured(): boolean {
    return !!this.getApiKey();
  }

  private static mapAppLocaleToGoogleLanguage(locale?: string): string {
    if (!locale) return 'en'; // Default to English
    
    switch (locale) {
      case 'ko':
        return 'ko';
      case 'en':
        return 'en';
      default:
        return 'en'; // Default fallback
    }
  }

  private static mapGooglePlaceType(searchType: 'veterinary' | 'pharmacy'): string {
    switch (searchType) {
      case 'veterinary':
        return 'veterinary_care';
      case 'pharmacy':
        return 'pharmacy';
      default:
        return 'establishment';
    }
  }

  private static mapGooglePlaceToPlace(
    googlePlace: GooglePlace,
    searchType: 'veterinary' | 'pharmacy'
  ): Place {
    return {
      id: googlePlace.place_id,
      name: googlePlace.name,
      address: googlePlace.formatted_address || googlePlace.vicinity || '',
      coordinate: {
        latitude: googlePlace.geometry.location.lat,
        longitude: googlePlace.geometry.location.lng,
      },
      type: searchType,
      rating: googlePlace.rating,
      photo_reference: googlePlace.photos?.[0]?.photo_reference,
    };
  }

  static async searchNearbyPlaces(
    location: UserLocation,
    options: PlacesSearchOptions
  ): Promise<Place[]> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.warn('Google Places API key not configured. Using mock data.');
      return this.getMockPlaces(location, options.type);
    }

    try {
      const placeType = this.mapGooglePlaceType(options.type);
      const radius = options.radius || this.DEFAULT_RADIUS;
      const language = this.mapAppLocaleToGoogleLanguage(options.locale);

      const params = new URLSearchParams({
        location: `${location.latitude},${location.longitude}`,
        radius: radius.toString(),
        type: placeType,
        key: apiKey,
        language: language,
      });

      const response = await fetch(`${this.BASE_URL}?${params}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new PlacesError(
            PlacesErrorType.QUOTA_EXCEEDED,
            'API quota exceeded or permission denied',
            response
          );
        } else if (response.status >= 500) {
          throw new PlacesError(
            PlacesErrorType.NETWORK_ERROR,
            'Google Places API server error',
            response
          );
        } else {
          throw new PlacesError(
            PlacesErrorType.UNKNOWN_ERROR,
            `HTTP error! status: ${response.status}`,
            response
          );
        }
      }

      const data: GooglePlacesResponse = await response.json();

      if (data.status !== 'OK') {
        switch (data.status) {
          case 'REQUEST_DENIED':
            throw new PlacesError(
              PlacesErrorType.PERMISSION_DENIED,
              data.error_message || 'Request denied by Google Places API'
            );
          case 'OVER_QUERY_LIMIT':
            throw new PlacesError(
              PlacesErrorType.QUOTA_EXCEEDED,
              'API quota exceeded'
            );
          case 'INVALID_REQUEST':
            throw new PlacesError(
              PlacesErrorType.INVALID_REQUEST,
              data.error_message || 'Invalid request parameters'
            );
          case 'ZERO_RESULTS':
            // Not an error, just return empty results
            return [];
          default:
            throw new PlacesError(
              PlacesErrorType.UNKNOWN_ERROR,
              `Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`
            );
        }
      }

      return data.results
        .filter(place => place.business_status !== 'CLOSED_PERMANENTLY')
        .map(place => this.mapGooglePlaceToPlace(place, options.type))
        .slice(0, 20); // Limit to 20 results

    } catch (error) {
      if (error instanceof PlacesError) {
        throw error; // Re-throw PlacesError as is
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new PlacesError(
          PlacesErrorType.NETWORK_ERROR,
          'Network connection failed. Please check your internet connection.',
          error
        );
      }

      // Unknown error
      throw new PlacesError(
        PlacesErrorType.UNKNOWN_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred',
        error
      );
    }
  }

  private static getMockPlaces(location: UserLocation, type: 'veterinary' | 'pharmacy'): Place[] {
    const mockPlaces: Place[] = [
      {
        id: "mock_1",
        name: type === 'veterinary' ? "서울 동물병원" : "펫 약국",
        address: "서울특별시 강남구 테헤란로 123",
        coordinate: {
          latitude: location.latitude + 0.005,
          longitude: location.longitude + 0.005,
        },
        type: type,
        distance: 0.8,
        phone: type === 'veterinary' ? "02-123-4567" : "02-555-1234",
        hours: type === 'veterinary' ? "09:00 - 21:00" : "10:00 - 20:00",
        rating: 4.2,
      },
      {
        id: "mock_2",
        name: type === 'veterinary' ? "행복한 동물병원" : "건강 펫샵",
        address: "서울특별시 강남구 역삼동 456",
        coordinate: {
          latitude: location.latitude - 0.003,
          longitude: location.longitude + 0.002,
        },
        type: type,
        distance: 0.5,
        phone: type === 'veterinary' ? "02-987-6543" : "02-888-9999",
        hours: type === 'veterinary' ? "24시간 운영" : "09:00 - 22:00",
        rating: 4.5,
      },
    ];

    return mockPlaces;
  }

  static async getPlacePhoto(photoReference: string, maxWidth = 400): Promise<string | null> {
    const apiKey = this.getApiKey();
    
    if (!apiKey || !photoReference) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        photo_reference: photoReference,
        maxwidth: maxWidth.toString(),
        key: apiKey,
      });

      return `https://maps.googleapis.com/maps/api/place/photo?${params}`;
    } catch (error) {
      console.error('Error generating photo URL:', error);
      return null;
    }
  }

  static async getPlaceDetails(placeId: string): Promise<any> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.warn('Google Places API key not found.');
      return null;
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,opening_hours,rating,photos,website',
        key: apiKey,
        language: 'en', // Default to English for place details
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data.result;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }
}