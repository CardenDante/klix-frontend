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
export function getImageUrl(path: string | undefined | null, fallback?: string): string {
  if (!path) return fallback || '';

  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Get backend URL - MUST be port 8000, never 3000
  // Use environment variable if available, otherwise hardcode to localhost:8000
  let BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  // If not set or invalid, use default
  if (!BACKEND_URL || BACKEND_URL.includes(':3000')) {
    BACKEND_URL = 'http://localhost:8000';
    console.warn('⚠️ NEXT_PUBLIC_API_URL not set or invalid, using default: http://localhost:8000');
  }

  // Safety check: NEVER use port 3000 for images
  const safeBackendUrl = BACKEND_URL.replace(':3000', ':8000');

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Build full URL
  const fullUrl = `${safeBackendUrl}${normalizedPath}`;

  // Debug logging
  console.log(`🖼️ [getImageUrl] ${path} → ${fullUrl}`);

  return fullUrl;
}
