// lib/api/uploads.ts
import apiClient from '../api-client';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  content_type: string;
}

export const uploadsApi = {
  /**
   * Upload a file (image, document, etc.)
   * @param file - The file to upload
   * @param uploadType - Type of upload (e.g., 'event_banner', 'organizer_logo', 'profile_picture')
   * @param entityId - Optional entity ID to associate with the upload
   */
  uploadFile: async (
    file: File,
    uploadType: string,
    entityId?: string
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_type', uploadType);
    
    if (entityId) {
      formData.append('entity_id', entityId);
    }

    const response = await apiClient.post('/api/v1/uploads/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Delete an uploaded file
   * @param filename - The filename to delete
   */
  deleteFile: async (filename: string): Promise<void> => {
    await apiClient.delete(`/api/v1/uploads/${filename}`);
  },

  /**
   * Get upload URL for a filename
   * @param filename - The filename
   */
  getUploadUrl: (filename: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${baseUrl}/uploads/${filename}`;
  },
};

export default uploadsApi;