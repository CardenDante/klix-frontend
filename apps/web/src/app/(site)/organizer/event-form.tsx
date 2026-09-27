'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import type { EventInput } from '@/lib/api/endpoints';
import { EVENT_CATEGORIES, type KlixEvent } from '@/lib/api/types';
import { CATEGORY_LABELS, fromNairobiInput, toNairobiInput } from '@/lib/format';

const schema = z
  .object({
    title: z.string().trim().min(3, 'Give your event a title'),
    category: z.enum(EVENT_CATEGORIES),
    location: z.string().trim().min(2, 'Where is it happening?'),
    start: z.string().min(1, 'Pick a start time'),
    end: z.string().min(1, 'Pick an end time'),
    banner_image_url: z.union([z.literal(''), z.url('Enter a full image URL')]),
    description: z.string().max(50_000),
  })
  .refine((v) => !v.start || !v.end || v.end > v.start, { path: ['end'], message: 'End must be after the start' });

type Values = z.infer<typeof schema>;

/** Plain paragraphs become HTML the API stores; existing HTML is shown as text for editing. */
const toHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
    .join('');

const fromHtml = (html: string | null) =>
  (html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .trim();

export function EventForm({
  event,
  submitLabel,
  onSubmit,
}: {
  event?: KlixEvent;
  submitLabel: string;
  onSubmit: (input: EventInput) => Promise<void>;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title ?? '',
      category: event?.category ?? 'music',
      location: event?.location ?? '',
      start: toNairobiInput(event?.start_datetime),
      end: toNairobiInput(event?.end_datetime),
      banner_image_url: event?.banner_image_url ?? '',
      description: fromHtml(event?.description ?? null),
    },
  });
  const errors = form.formState.errors;
  const banner = useWatch({ control: form.control, name: 'banner_image_url' });

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={form.handleSubmit((v) =>
        onSubmit({
          title: v.title,
          category: v.category,
          location: v.location,
          start_datetime: fromNairobiInput(v.start),
          end_datetime: fromNairobiInput(v.end),
          banner_image_url: v.banner_image_url || null,
          description: toHtml(v.description),
        }),
      )}
    >
      <Field label="Event title" htmlFor="title" error={errors.title?.message}>
        <Input id="title" {...form.register('title')} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="category">
          <Select id="category" {...form.register('category')}>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Venue / location" htmlFor="location" error={errors.location?.message}>
          <Input id="location" placeholder="e.g. KICC, Nairobi" {...form.register('location')} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Starts (Nairobi time)" htmlFor="start" error={errors.start?.message}>
          <Input id="start" type="datetime-local" {...form.register('start')} />
        </Field>
        <Field label="Ends (Nairobi time)" htmlFor="end" error={errors.end?.message}>
          <Input id="end" type="datetime-local" {...form.register('end')} />
        </Field>
      </div>
      <Field
        label="Banner image URL"
        htmlFor="banner_image_url"
        error={errors.banner_image_url?.message}
        hint="A wide image (16:9) looks best. Image uploads are coming soon."
      >
        <Input id="banner_image_url" type="url" placeholder="https://" {...form.register('banner_image_url')} />
      </Field>
      {banner && !errors.banner_image_url && (
        <img src={banner} alt="Banner preview" className="aspect-[16/9] w-full rounded-xl border border-line object-cover" />
      )}
      <Field label="Description" htmlFor="description" hint="Separate paragraphs with a blank line.">
        <Textarea id="description" rows={8} {...form.register('description')} />
      </Field>
      <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
