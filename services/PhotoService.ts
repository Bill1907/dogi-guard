import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, isSupabaseConfigured, createAuthenticatedSupabaseClient } from '@/utils/supabase';

/**
 * PhotoService Error Types
 */
export class PhotoUploadError extends Error {
  constructor(message: string, public code: string, public originalError?: any) {
    super(message);
    this.name = 'PhotoUploadError';
  }
}

export class PhotoStorageError extends Error {
  constructor(message: string, public code: string, public originalError?: any) {
    super(message);
    this.name = 'PhotoStorageError';
  }
}

/**
 * PhotoService - Handles cloud photo storage for dog profiles using Supabase Storage
 * 
 * Features:
 * - Supabase Storage integration with authentication
 * - Image optimization and compression with proper error handling
 * - Automatic cleanup of orphaned files
 * - Migration from local storage
 * - Fallback to local storage when offline
 * - Detailed error reporting and logging
 * 
 * Supabase Setup Required:
 * 
 * 1. Create Storage Bucket (via SQL or Dashboard):
 *    ```sql
 *    INSERT INTO storage.buckets (id, name, public)
 *    VALUES ('dog-photos', 'dog-photos', true);
 *    ```
 * 
 * 2. Set up RLS Policies for the bucket:
 *    ```sql
 *    -- Allow authenticated users to upload photos to their own folder
 *    CREATE POLICY "Users can upload their own photos" ON storage.objects
 *    FOR INSERT WITH CHECK (
 *      bucket_id = 'dog-photos' AND
 *      (storage.foldername(name))[1] = auth.uid()::text
 *    );
 *    
 *    -- Allow authenticated users to view their own photos
 *    CREATE POLICY "Users can view their own photos" ON storage.objects
 *    FOR SELECT USING (
 *      bucket_id = 'dog-photos' AND
 *      (storage.foldername(name))[1] = auth.uid()::text
 *    );
 *    
 *    -- Allow authenticated users to delete their own photos
 *    CREATE POLICY "Users can delete their own photos" ON storage.objects
 *    FOR DELETE USING (
 *      bucket_id = 'dog-photos' AND
 *      (storage.foldername(name))[1] = auth.uid()::text
 *    );
 *    ```
 * 
 * 3. Enable RLS on storage.objects:
 *    ```sql
 *    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 *    ```
 * 
 * Note: This service uses Clerk user IDs, so ensure your JWT template 
 * maps Clerk user IDs to Supabase auth.uid() for RLS to work properly.
 */
export class PhotoService {
  // Storage bucket name for dog photos
  private static readonly STORAGE_BUCKET = 'dog-photos';
  
  // Local fallback directory
  private static readonly LOCAL_PHOTO_DIR = `${FileSystem.documentDirectory}dogPhotos/`;
  
  // Maximum image dimensions for optimization
  private static readonly MAX_IMAGE_WIDTH = 1024;
  private static readonly MAX_IMAGE_HEIGHT = 1024;
  private static readonly JPEG_QUALITY = 0.8;

  /**
   * Get authenticated Supabase client using utils/supabase.ts
   * Used for getting public URLs and delete operations
   */
  private static async getSupabaseClient(session?: any): Promise<SupabaseClient<Database> | null> {
    if (!isSupabaseConfigured()) {
      console.warn('PhotoService.getSupabaseClient: Supabase not configured, falling back to local storage');
      return null;
    }

    if (!session) {
      console.warn('PhotoService.getSupabaseClient: No session provided, cannot authenticate with Supabase');
      return null;
    }

    // Enhanced session validation and token extraction
    console.log('PhotoService.getSupabaseClient: Session type:', typeof session, 'keys:', Object.keys(session || {}));

    const getToken = async (): Promise<string | null> => {
      try {
        // Method 1: Direct access_token (Supabase native sessions)
        if (session.access_token && typeof session.access_token === 'string') {
          console.log('PhotoService.getSupabaseClient: Using direct access_token');
          return session.access_token;
        }

        // Method 2: Function-based token getter (Clerk compatibility)
        if (typeof session.getToken === 'function') {
          console.log('PhotoService.getSupabaseClient: Using session.getToken() function');
          const token = await session.getToken();
          if (token && typeof token === 'string') {
            return token;
          }
          console.warn('PhotoService.getSupabaseClient: getToken() returned invalid token:', typeof token);
        }

        // Method 3: Nested token structure
        if (session.session?.access_token) {
          console.log('PhotoService.getSupabaseClient: Using nested session.access_token');
          return session.session.access_token;
        }

        // Method 4: User object with token
        if (session.user?.access_token) {
          console.log('PhotoService.getSupabaseClient: Using user.access_token');
          return session.user.access_token;
        }

        console.error('PhotoService.getSupabaseClient: No valid token found in session structure');
        return null;
      } catch (error) {
        console.error('PhotoService.getSupabaseClient: Failed to extract auth token:', {
          error: error instanceof Error ? error.message : error,
          sessionKeys: Object.keys(session || {}),
          sessionType: typeof session
        });
        return null;
      }
    };

    try {
      const client = await createAuthenticatedSupabaseClient(getToken);
      if (client) {
        console.log('PhotoService.getSupabaseClient: Successfully created authenticated Supabase client');
      } else {
        console.error('PhotoService.getSupabaseClient: Failed to create authenticated Supabase client');
      }
      return client;
    } catch (error) {
      console.error('PhotoService.getSupabaseClient: Error creating Supabase client:', error);
      return null;
    }
  }

  /**
   * Get signed upload URL from Edge Function using Supabase client
   */
  private static async getSignedUploadUrl(fileName: string, session?: any): Promise<{signedUrl: string, path: string}> {
    if (!isSupabaseConfigured()) {
      throw new PhotoUploadError('Supabase not configured', 'CONFIG_ERROR');
    }

    if (!session) {
      throw new PhotoUploadError('No session provided', 'AUTH_ERROR');
    }

    try {
      // Get authentication token
      let token: string | null = null;
      
      // Check if it's a Supabase session with access_token
      if (session.access_token) {
        token = session.access_token;
      } 
      // Fallback for compatibility wrapper
      else if (typeof session.getToken === 'function') {
        token = await session.getToken();
      }
      
      if (!token) {
        throw new PhotoUploadError('No authentication token available', 'AUTH_ERROR');
      }

      // Use Supabase client to call Edge Function
      const client = await this.getSupabaseClient(session);
      if (!client) {
        throw new PhotoUploadError('Failed to create Supabase client', 'CLIENT_ERROR');
      }

      console.log('Calling Edge Function for signed URL:', fileName);

      // Call Edge Function using Supabase client's functions API
      const { data, error } = await client.functions.invoke('generate-signed-upload-url', {
        body: { 
          fileName,
          bucket: this.STORAGE_BUCKET
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new PhotoUploadError(
          `Edge Function failed: ${error.message}`,
          'EDGE_FUNCTION_ERROR',
          error
        );
      }

      if (!data?.signedUrl || !data?.path) {
        throw new PhotoUploadError(
          'Invalid response from Edge Function',
          'INVALID_RESPONSE'
        );
      }

      console.log('Successfully obtained signed URL for:', data.path);
      return data;

    } catch (error) {
      if (error instanceof PhotoUploadError) {
        throw error;
      }
      throw new PhotoUploadError(
        'Failed to get signed upload URL',
        'SIGNED_URL_ERROR',
        error
      );
    }
  }

  /**
   * Initialize local directory for fallback storage
   * Note: Supabase Storage bucket should be created via Dashboard or Edge Function
   */
  static async initializeStorage(): Promise<void> {
    try {
      // Always initialize local directory for fallback
      await this.initializeLocalDirectory();
      
      // Note: We no longer create buckets from client side
      // The 'dog-photos' bucket should be created via Supabase Dashboard
      // All uploads now use signed URLs from Edge Function
      console.log('Local storage initialized. Using signed URLs for cloud storage.');
      
    } catch (error) {
      console.error('Error initializing local storage:', error);
      throw error;
    }
  }

  /**
   * Initialize local photo directory for fallback
   */
  private static async initializeLocalDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.LOCAL_PHOTO_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.LOCAL_PHOTO_DIR, { intermediates: true });
        console.log('Local photo directory created:', this.LOCAL_PHOTO_DIR);
      }
    } catch (error) {
      console.error('Error initializing local photo directory:', error);
      throw error;
    }
  }

  /**
   * Optimize image for storage
   */
  private static async optimizeImage(uri: string): Promise<string> {
    try {
      const result = await manipulateAsync(
        uri,
        [
          {
            resize: {
              width: this.MAX_IMAGE_WIDTH,
              height: this.MAX_IMAGE_HEIGHT,
            },
          },
        ],
        {
          compress: this.JPEG_QUALITY,
          format: SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      return uri;
    }
  }

  /**
   * Save photo using signed URL (primary method) with local fallback
   */
  static async savePhoto(tempUri: string, session?: any): Promise<string> {
    try {
      // Optimize image first
      const optimizedUri = await this.optimizeImage(tempUri);
      
      const userId = session?.user?.id;
      
      // Try signed URL upload first (primary method)
      if (isSupabaseConfigured() && userId && session) {
        try {
          await this.initializeStorage();
          
          // Generate unique filename with proper extension
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const fileExtension = this.getFileExtension(optimizedUri);
          const fileName = `${userId}/dog_photo_${timestamp}_${randomSuffix}${fileExtension}`;
          
          // Get MIME type for proper content-type
          const mimeType = this.getMimeType(optimizedUri);
          
          // Prepare image data
          const response = await fetch(optimizedUri);
          if (!response.ok) {
            throw new PhotoUploadError(
              `Failed to fetch image file`,
              'FETCH_ERROR',
              { status: response.status, statusText: response.statusText }
            );
          }
          
          const arrayBuffer = await response.arrayBuffer();
          
          // Validate file size
          if (arrayBuffer.byteLength === 0) {
            throw new PhotoUploadError('Image file is empty', 'EMPTY_FILE');
          }
          
          if (arrayBuffer.byteLength > 5 * 1024 * 1024) { // 5MB limit
            throw new PhotoUploadError(
              `File too large: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB (max 5MB)`,
              'FILE_TOO_LARGE'
            );
          }
          
          // Get signed URL from Edge Function (no fallback - signed URL only)
          const signedUrlData = await this.getSignedUploadUrl(fileName, session);
          
          // Upload using signed URL (bypasses RLS policies)
          const uploadResponse = await fetch(signedUrlData.signedUrl, {
            method: 'PUT',
            body: arrayBuffer,
            headers: {
              'Content-Type': mimeType,
              'Cache-Control': 'max-age=3600'
            }
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new PhotoUploadError(
              `Signed URL upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`,
              'UPLOAD_ERROR'
            );
          }
          
          // Get public URL using Supabase's official getPublicUrl method
          const supabase = await this.getSupabaseClient(session);
          if (!supabase) {
            throw new PhotoUploadError('Failed to create Supabase client for URL generation', 'CLIENT_ERROR');
          }
          
          const { data: urlData } = supabase.storage
            .from(this.STORAGE_BUCKET)
            .getPublicUrl(signedUrlData.path);
          
          const publicUrl = urlData.publicUrl;

          console.log('Photo uploaded successfully via signed URL:', {
            fileName,
            mimeType,
            size: `${(arrayBuffer.byteLength / 1024).toFixed(1)}KB`,
            url: publicUrl,
            userId
          });

          return publicUrl;
          
        } catch (uploadError) {
          console.error('Signed URL upload failed:', {
            error: uploadError instanceof Error ? uploadError.message : uploadError,
            code: uploadError instanceof PhotoUploadError ? uploadError.code : 'UNKNOWN',
            userId,
            uri: optimizedUri
          });
          
          // Don't fall back to local storage for quota errors
          if (uploadError instanceof PhotoUploadError) {
            if (['QUOTA_EXCEEDED', 'FILE_TOO_LARGE'].includes(uploadError.code)) {
              throw uploadError;
            }
          }
          
          // Fall through to local storage for other errors
          console.warn('Falling back to local storage due to signed URL upload error');
        }
      } else {
        console.warn('Supabase not available or user not authenticated - using local storage');
      }
      
      // Fallback to local storage
      return await this.savePhotoLocally(optimizedUri);
      
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  /**
   * Save photo to local storage (fallback)
   */
  private static async savePhotoLocally(uri: string): Promise<string> {
    await this.initializeLocalDirectory();
    
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `dog_photo_${timestamp}_${randomSuffix}.jpg`;
    const permanentUri = `${this.LOCAL_PHOTO_DIR}${fileName}`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: permanentUri
    });
    
    console.log('Photo saved locally:', permanentUri);
    return permanentUri;
  }

  /**
   * Delete photo from storage
   * Note: Still uses direct Supabase client for delete operations
   * Can be migrated to Edge Function if needed for consistency
   */
  static async deletePhoto(photoUri: string, session?: any): Promise<boolean> {
    try {
      // Check if it's a Supabase Storage URL
      if (photoUri.includes('supabase')) {
        const supabase = await this.getSupabaseClient(session);
        if (supabase) {
          try {
            // Extract file path from URL
            const url = new URL(photoUri);
            const pathParts = url.pathname.split('/');
            const fileName = pathParts.slice(-2).join('/'); // userId/filename
            
            const { error } = await supabase.storage
              .from(this.STORAGE_BUCKET)
              .remove([fileName]);
            
            if (!error) {
              console.log('Photo deleted from Supabase Storage:', fileName);
              return true;
            }
            console.error('Error deleting from Supabase Storage:', error);
          } catch (storageError) {
            console.error('Error deleting from Supabase Storage:', storageError);
          }
        }
        return false;
      }
      
      // Handle local storage deletion
      if (photoUri.startsWith(this.LOCAL_PHOTO_DIR)) {
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(photoUri, { idempotent: true });
          console.log('Photo deleted locally:', photoUri);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }

  /**
   * Check if photo exists - optimized with retry logic and proper error handling
   */
  static async photoExists(photoUri: string, session?: any, retryCount: number = 3): Promise<boolean> {
    try {
      if (!photoUri) {
        console.log('PhotoService.photoExists: Empty photoUri provided');
        return false;
      }
      
      // Check Supabase Storage URL
      if (photoUri.includes('supabase')) {
        const supabase = await this.getSupabaseClient(session);
        if (!supabase) {
          console.warn('PhotoService.photoExists: Failed to get Supabase client');
          return false;
        }

        // Enhanced URL parsing with better error handling
        let fileName: string;
        try {
          fileName = this.extractFilePathFromUrl(photoUri);
          if (!fileName) {
            console.error('PhotoService.photoExists: Failed to extract file path from URL:', photoUri);
            return false;
          }
        } catch (urlError) {
          console.error('PhotoService.photoExists: Invalid URL format:', photoUri, urlError);
          return false;
        }

        // Use efficient download with minimal range to check existence
        for (let attempt = 1; attempt <= retryCount; attempt++) {
          try {
            console.log(`PhotoService.photoExists: Checking file existence (attempt ${attempt}/${retryCount}):`, fileName);
            
            // Use download with small range to check existence efficiently
            const { error } = await supabase.storage
              .from(this.STORAGE_BUCKET)
              .download(fileName, {
                transform: {
                  width: 1,
                  height: 1,
                  resize: 'contain'
                }
              });

            if (!error) {
              console.log('PhotoService.photoExists: File exists:', fileName);
              return true;
            }

            // Handle specific error cases
            if (error.message?.includes('Object not found') || 
                error.message?.includes('Not found') ||
                error.message?.includes('does not exist')) {
              console.log('PhotoService.photoExists: File does not exist:', fileName);
              return false;
            }

            // For other errors, retry if we have attempts left
            if (attempt < retryCount) {
              const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
              console.warn(`PhotoService.photoExists: Retrying in ${delay}ms due to error:`, error.message);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }

            console.error('PhotoService.photoExists: Final attempt failed:', error);
            return false;

          } catch (downloadError) {
            console.error(`PhotoService.photoExists: Download attempt ${attempt} failed:`, downloadError);
            
            if (attempt < retryCount) {
              const delay = Math.pow(2, attempt - 1) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return false;
          }
        }
        
        return false;
      }
      
      // Check local storage
      try {
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        const exists = fileInfo.exists;
        console.log('PhotoService.photoExists: Local file check:', photoUri, 'exists:', exists);
        return exists;
      } catch (localError) {
        console.error('PhotoService.photoExists: Local file check error:', localError);
        return false;
      }
    } catch (error) {
      console.error('PhotoService.photoExists: Unexpected error:', error);
      return false;
    }
  }

  /**
   * Extract file path from Supabase Storage URL with improved parsing
   */
  private static extractFilePathFromUrl(photoUri: string): string | null {
    try {
      const url = new URL(photoUri);
      
      // Handle different Supabase URL formats
      // Format 1: /storage/v1/object/public/bucket-name/path/to/file
      // Format 2: /storage/v1/object/sign/bucket-name/path/to/file
      const pathParts = url.pathname.split('/');
      
      // Find bucket name index
      const bucketIndex = pathParts.findIndex(part => part === this.STORAGE_BUCKET);
      if (bucketIndex === -1) {
        console.error('PhotoService.extractFilePathFromUrl: Bucket not found in URL:', photoUri);
        return null;
      }
      
      // Extract path after bucket name
      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      if (!filePath) {
        console.error('PhotoService.extractFilePathFromUrl: No file path found after bucket:', photoUri);
        return null;
      }
      
      return filePath;
    } catch (error) {
      console.error('PhotoService.extractFilePathFromUrl: URL parsing error:', error);
      return null;
    }
  }

  /**
   * Migrate photo from local to cloud storage
   */
  static async migratePhoto(oldUri: string, session?: any): Promise<string | null> {
    try {
      // Skip if already in cloud storage
      if (oldUri.includes('supabase')) {
        console.log('Photo already in cloud storage:', oldUri);
        return oldUri;
      }
      
      // Check if local file exists
      if (oldUri.startsWith(this.LOCAL_PHOTO_DIR)) {
        const fileInfo = await FileSystem.getInfoAsync(oldUri);
        if (!fileInfo.exists) {
          console.log('Local photo no longer exists:', oldUri);
          return null;
        }
        
        // Upload to cloud storage
        const cloudUri = await this.savePhoto(oldUri, session);
        
        // Delete local copy after successful upload
        if (cloudUri.includes('supabase')) {
          await FileSystem.deleteAsync(oldUri, { idempotent: true });
          console.log('Migrated photo from local to cloud:', cloudUri);
        }
        
        return cloudUri;
      }
      
      return oldUri;
    } catch (error) {
      console.error('Error migrating photo:', error);
      return null;
    }
  }

  /**
   * Get file extension from URI
   */
  private static getFileExtension(uri: string): string {
    const match = uri.match(/\.\w+$/);
    return match ? match[0] : '.jpg';
  }

  /**
   * Get MIME type from file extension
   */
  private static getMimeType(uri: string): string {
    const extension = this.getFileExtension(uri).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    return mimeTypes[extension] || 'image/jpeg';
  }

  /**
   * Get all photos for current user
   */
  static async getAllPhotos(session?: any): Promise<string[]> {
    const photos: string[] = [];
    
    try {
      // Get photos from Supabase Storage
      const supabase = await this.getSupabaseClient(session);
      const userId = session?.user?.id;
      
      if (supabase && userId) {
        const { data, error } = await supabase.storage
          .from(this.STORAGE_BUCKET)
          .list(userId);
        
        if (!error && data) {
          for (const file of data) {
            const { data: urlData } = supabase.storage
              .from(this.STORAGE_BUCKET)
              .getPublicUrl(`${userId}/${file.name}`);
            photos.push(urlData.publicUrl);
          }
        }
      }
      
      // Get local photos
      await this.initializeLocalDirectory();
      const localFiles = await FileSystem.readDirectoryAsync(this.LOCAL_PHOTO_DIR);
      const localPhotos = localFiles.map(file => `${this.LOCAL_PHOTO_DIR}${file}`);
      photos.push(...localPhotos);
      
      return photos;
    } catch (error) {
      console.error('Error getting all photos:', error);
      return [];
    }
  }

  /**
   * Clean up orphaned photos
   */
  static async cleanupOrphanedPhotos(activePhotoUris: string[], session?: any): Promise<number> {
    try {
      const allPhotos = await this.getAllPhotos(session);
      const activeSet = new Set(activePhotoUris);
      let deletedCount = 0;
      
      for (const photoUri of allPhotos) {
        if (!activeSet.has(photoUri)) {
          const deleted = await this.deletePhoto(photoUri, session);
          if (deleted) deletedCount++;
        }
      }
      
      console.log(`Cleaned up ${deletedCount} orphaned photos`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up orphaned photos:', error);
      return 0;
    }
  }

  /**
   * Get storage information
   */
  static async getStorageInfo(session?: any): Promise<{
    photoCount: number;
    cloudPhotos: number;
    localPhotos: number;
    totalSizeBytes: number;
    totalSizeMB: number;
  }> {
    try {
      let cloudPhotos = 0;
      let localPhotos = 0;
      let totalSize = 0;
      
      // Count Supabase Storage photos
      const supabase = await this.getSupabaseClient(session);
      const userId = session?.user?.id;
      
      if (supabase && userId) {
        const { data } = await supabase.storage
          .from(this.STORAGE_BUCKET)
          .list(userId);
        
        if (data) {
          cloudPhotos = data.length;
          // Note: Supabase doesn't provide file sizes in list, would need individual calls
        }
      }
      
      // Count local photos
      await this.initializeLocalDirectory();
      const localFiles = await FileSystem.readDirectoryAsync(this.LOCAL_PHOTO_DIR);
      localPhotos = localFiles.length;
      
      // Calculate local file sizes
      for (const file of localFiles) {
        const fileInfo = await FileSystem.getInfoAsync(`${this.LOCAL_PHOTO_DIR}${file}`);
        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size;
        }
      }
      
      return {
        photoCount: cloudPhotos + localPhotos,
        cloudPhotos,
        localPhotos,
        totalSizeBytes: totalSize,
        totalSizeMB: Number((totalSize / (1024 * 1024)).toFixed(2))
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        photoCount: 0,
        cloudPhotos: 0,
        localPhotos: 0,
        totalSizeBytes: 0,
        totalSizeMB: 0
      };
    }
  }
}

// Export singleton instance
export default PhotoService;