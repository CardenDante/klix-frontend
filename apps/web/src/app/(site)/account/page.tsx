'use client';

import { useMutation } from '@tanstack/react-query';
import { MailWarning } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/image-upload';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Card } from '@/components/ui/misc';
import { authApi } from '@/lib/api/endpoints';
import { EVENT_CATEGORIES, type User } from '@/lib/api/types';
import { useAuth } from '@/lib/auth';
import { CATEGORY_LABELS, isKenyanPhone, normalizePhone } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function AccountPage() {
  const user = useAuth((s) => s.user)!;
  return (
    <div className="space-y-6">
      {!user.email_verified && <VerifyBanner />}
      <ProfileCard key={user.id} user={user} />
      <InterestsCard />
      <PasswordCard />
    </div>
  );
}

function VerifyBanner() {
  const send = useMutation({
    mutationFn: authApi.requestVerification,
    onSuccess: (r) => toast.success(r.message),
    onError: (e) => toast.error(e.message),
  });
  return (
    <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
      <MailWarning className="size-6 shrink-0 text-amber-700" />
      <p className="flex-1 text-sm text-amber-900">
        Confirm your email so tickets bought with it as a guest show up here, and so you can recover your account.
      </p>
      <Button size="sm" variant="secondary" loading={send.isPending} onClick={() => send.mutate()}>
        Send confirmation
      </Button>
    </Card>
  );
}

function ProfileCard({ user }: { user: User }) {
  const setUser = useAuth((s) => s.setUser);
  const [first, setFirst] = useState(user.first_name ?? '');
  const [last, setLast] = useState(user.last_name ?? '');
  const [phone, setPhone] = useState(user.phone_number ? `0${user.phone_number.slice(3)}` : '');
  const [photo, setPhoto] = useState(user.profile_image_url);

  const save = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        first_name: first.trim(),
        last_name: last.trim(),
        phone_number: phone ? normalizePhone(phone) : null,
        profile_image_url: photo,
      }),
    onSuccess: (u) => {
      setUser(u);
      toast.success('Profile saved');
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="p-6">
      <h2 className="font-sans text-lg font-bold">Profile</h2>
      <p className="text-sm text-muted">{user.email}</p>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-[120px_1fr]"
        onSubmit={(e) => {
          e.preventDefault();
          if (phone && !isKenyanPhone(phone)) return toast.error('Enter a valid Kenyan phone number');
          save.mutate();
        }}
      >
        <ImageUpload value={photo} onChange={setPhoto} uploadType="profile_image" aspect="aspect-square" label="Photo" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" htmlFor="first">
              <Input id="first" value={first} onChange={(e) => setFirst(e.target.value)} />
            </Field>
            <Field label="Last name" htmlFor="last">
              <Input id="last" value={last} onChange={(e) => setLast(e.target.value)} />
            </Field>
          </div>
          <Field label="Phone (for M-Pesa)" htmlFor="phone">
            <Input id="phone" type="tel" value={phone} placeholder="0712 345 678" onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Button type="submit" loading={save.isPending}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}

function InterestsCard() {
  const user = useAuth((s) => s.user)!;
  const setUser = useAuth((s) => s.setUser);
  const initial = user.preferences?.preferred_categories ?? [];
  const [selected, setSelected] = useState<string[]>(initial);

  const save = useMutation({
    mutationFn: () => authApi.updatePreferences({ preferred_categories: selected }),
    onSuccess: (r) => {
      setUser({ ...user, preferences: r.data } as User);
      toast.success('Interests saved — we\'ll tailor your picks');
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="p-6">
      <h2 className="font-sans text-lg font-bold">Interests</h2>
      <p className="text-sm text-muted">Pick what you like and we&apos;ll recommend events to match.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {EVENT_CATEGORIES.map((c) => {
          const on = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelected((s) => (on ? s.filter((x) => x !== c) : [...s, c]))}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium',
                on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line bg-white',
              )}
              aria-pressed={on}
            >
              {CATEGORY_LABELS[c]}
            </button>
          );
        })}
      </div>
      <Button className="mt-5" variant="secondary" loading={save.isPending} onClick={() => save.mutate()}>
        Save interests
      </Button>
    </Card>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const change = useMutation({
    mutationFn: () => authApi.changePassword(current, next),
    onSuccess: () => {
      toast.success('Password changed');
      setCurrent('');
      setNext('');
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="p-6">
      <h2 className="font-sans text-lg font-bold">Password</h2>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (next.length < 8) return toast.error('Use at least 8 characters');
          change.mutate();
        }}
      >
        <Field label="Current password" htmlFor="current" hint="Leave empty if you signed up with Google.">
          <Input id="current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" htmlFor="new">
          <Input id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <div>
          <Button type="submit" variant="secondary" loading={change.isPending}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}
