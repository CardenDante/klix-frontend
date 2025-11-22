import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get full image URL from backend
 * Handles both absolute URLs and relative paths
 */
export function getImageUrl(path: string | undefined): string {
  if (!path) return '';

  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If relative path, prepend backend URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
