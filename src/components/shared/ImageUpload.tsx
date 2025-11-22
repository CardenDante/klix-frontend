'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  uploadType: 'event_banner' | 'organizer_logo' | 'user_avatar';
  entityId: string;
  label?: string;
  aspectRatio?: string;
  recommendedSize?: string;
  maxSizeMB?: number;
}

export default function ImageUpload({ 
  value, 
  onChange,
  uploadType,
  entityId,
  label = 'Upload Image',
  aspectRatio = '16:9',
  recommendedSize = '1920x1080px',
  maxSizeMB = 5
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast.error(`Image must be less than ${maxSizeMB}MB. Your file is ${sizeMB.toFixed(2)}MB`);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_type', uploadType);
      formData.append('entity_id', entityId);

      console.log('📤 [UPLOAD] Starting upload:', { uploadType, entityId, fileName: file.name });

      const response = await apiClient.post('/api/v1/uploads/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.data.file_url;
      console.log('✅ [UPLOAD] Success:', imageUrl);

      onChange(imageUrl);
      setPreview(imageUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('❌ [UPLOAD] Failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload image');
      setPreview(''); // Clear preview on error
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Image removed');
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
        {label}
      </label>

      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-gray-50 transition"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-sm text-gray-600 font-body">Uploading image...</p>
              <p className="text-xs text-gray-500 font-body">This may take a few seconds</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 font-body">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 font-body mt-1">
                  PNG, JPG, or WebP (max {maxSizeMB}MB)
                </p>
                <p className="text-xs text-gray-500 font-body">
                  Recommended: {recommendedSize} ({aspectRatio} ratio)
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative group">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
              onError={(e) => {
                console.error('Image failed to load:', preview);
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={uploading}
              >
                <X className="w-4 h-4 mr-1" />
                Remove Image
              </Button>
            </div>
          </div>

          {!uploading && (
            <div className="flex items-center gap-2 text-sm text-green-600 font-body">
              <ImageIcon className="w-4 h-4" />
              <span>Image uploaded successfully</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Replace Image
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}

      {/* Help text */}
      <div className="mt-2 flex items-start gap-2 text-xs text-gray-500 font-body">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Images are uploaded in their original format and quality. Supported formats: JPEG, PNG, WebP.
        </p>
      </div>
    </div>
  );
}