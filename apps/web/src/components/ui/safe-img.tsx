'use client';

import { useState, type ImgHTMLAttributes, type ReactNode } from 'react';

/** An <img> that shows `fallback` (or nothing) instead of a broken-image icon when it fails to load. */
export function SafeImg({ fallback = null, alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement> & { fallback?: ReactNode }) {
  const [failedSrc, setFailedSrc] = useState<unknown>(null);
  if (!props.src || failedSrc === props.src) return <>{fallback}</>;
  return <img alt={alt} {...props} onError={() => setFailedSrc(props.src)} />;
}
