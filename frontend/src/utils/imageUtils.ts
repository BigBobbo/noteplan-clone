import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface ImageUploadResult {
  success: boolean;
  filename?: string;
  relativePath?: string;
  size?: number;
  warning?: string;
  error?: string;
}

/**
 * Upload image to backend
 * @param file - File object from clipboard or drop event
 * @returns Upload result with filename and path
 */
export async function uploadImage(file: File): Promise<ImageUploadResult> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File is not an image'
      };
    }

    // Check size and warn
    let warning: string | undefined;
    if (file.size > MAX_SIZE_BYTES) {
      warning = `Image is large (${(file.size / 1024 / 1024).toFixed(2)}MB). Consider resizing.`;
      console.warn(warning);
    }

    // Create form data
    const formData = new FormData();
    formData.append('image', file);

    // Upload to backend
    console.log(`Uploading image: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);

    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      console.log(`Image uploaded successfully: ${response.data.relativePath}`);
      return {
        success: true,
        filename: response.data.filename,
        relativePath: response.data.relativePath,
        size: response.data.size,
        warning: response.data.warning || warning
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Upload failed'
      };
    }

  } catch (error: any) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Upload failed'
    };
  }
}

/**
 * Extract image from clipboard event
 * @param event - Clipboard event
 * @returns File object or null
 */
export function getImageFromClipboard(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        console.log('Image found in clipboard:', file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`);
        return file;
      }
    }
  }

  return null;
}

/**
 * Extract image from drop event
 * @param event - Drag event
 * @returns File object or null
 */
export function getImageFromDrop(event: DragEvent): File | null {
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return null;

  // Find first image file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.startsWith('image/')) {
      console.log('Image found in drop:', file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`);
      return file;
    }
  }

  return null;
}

/**
 * Show warning message to user
 * @param message - Warning message
 */
export function showImageWarning(message: string): void {
  // TODO: Integrate with notification system if available
  console.warn('Image Warning:', message);
  alert(`Warning: ${message}`);
}

/**
 * Show error message to user
 * @param message - Error message
 */
export function showImageError(message: string): void {
  // TODO: Integrate with notification system if available
  console.error('Image Error:', message);
  alert(`Error: ${message}`);
}

/**
 * Convert blob to File object
 * @param blob - Blob object
 * @param filename - Desired filename
 * @returns File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Compress image if needed
 * @param file - Original image file
 * @param maxWidth - Maximum width in pixels
 * @param quality - JPEG quality (0-1)
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Check if compression needed
        if (img.width <= maxWidth) {
          resolve(file); // No compression needed
          return;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;

        // Draw and compress
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedFile = blobToFile(blob, file.name);
            console.log(
              `Image compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`
            );
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get image statistics
 * @returns Image storage statistics
 */
export async function getImageStats(): Promise<any> {
  try {
    const response = await axios.get(`${API_BASE_URL}/upload/stats`);
    return response.data;
  } catch (error) {
    console.error('Failed to get image stats:', error);
    return null;
  }
}

/**
 * Clean up orphaned images
 * @param notes - Array of note objects with content
 * @returns Cleanup result
 */
export async function cleanupOrphanedImages(notes: Array<{ content: string }>): Promise<any> {
  try {
    const response = await axios.post(`${API_BASE_URL}/upload/cleanup`, { notes });
    return response.data;
  } catch (error) {
    console.error('Failed to cleanup images:', error);
    return null;
  }
}
