import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get full image URL from backend
 * Handles both absolute URLs and relative paths
 * CRITICAL: This MUST return backend URL (port 8000), never frontend URL (port 3000)
 */
export function getImageUrl(path: string | undefined): string {
  if (!path) return '';

  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // HARDCODED BACKEND URL - This is the simplest and most reliable approach
  // In production, this should come from environment variable
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Safety check: NEVER use port 3000 for images
  const safeBackendUrl = BACKEND_URL.replace(':3000', ':8000');

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Build full URL
  const fullUrl = `${safeBackendUrl}${normalizedPath}`;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🖼️ [getImageUrl] ${path} → ${fullUrl}`);
  }

  return fullUrl;
}
