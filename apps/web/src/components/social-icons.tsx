import { SOCIAL_LINKS } from '@/lib/site';
import { cn } from '@/lib/utils';

// lucide-react no longer ships brand logos, so these are inline.
const ICONS = {
  facebook: (
    <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.33-.04-1.57-.14-2.88-.14C11.9 2 10 3.66 10 6.7v2.8H7v4h3V22h4z" />
  ),
  x: (
    <path d="M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.33l4.38 5.79zm-1.08 16.18h1.7L7.4 4.73H5.58z" />
  ),
  instagram: (
    <path d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.8.22 2.43.46.66.26 1.22.6 1.77 1.16.5.5.9 1.1 1.16 1.77.25.64.42 1.37.47 2.43.05 1.07.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.8-.47 2.43a4.9 4.9 0 0 1-1.16 1.77c-.5.5-1.1.9-1.77 1.16-.64.25-1.36.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.8-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.16 4.9 4.9 0 0 1-1.16-1.77c-.25-.64-.42-1.36-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.8.47-2.43.26-.67.6-1.23 1.16-1.77.5-.5 1.1-.9 1.77-1.16.64-.25 1.36-.42 2.43-.47C8.94 2.01 9.28 2 12 2m0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10m6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6" />
  ),
};

const LABELS = { facebook: 'Facebook', x: 'X (Twitter)', instagram: 'Instagram' };

export function SocialIcons({ className, itemClassName }: { className?: string; itemClassName?: string }) {
  return (
    <div className={cn('flex gap-4', className)}>
      {(Object.keys(SOCIAL_LINKS) as (keyof typeof SOCIAL_LINKS)[]).map((key) => (
        <a
          key={key}
          href={SOCIAL_LINKS[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Klix on ${LABELS[key]}`}
          className={cn(
            'flex size-10 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-primary hover:text-white',
            itemClassName,
          )}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
            {ICONS[key]}
          </svg>
        </a>
      ))}
    </div>
  );
}
