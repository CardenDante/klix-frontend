'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/image-upload';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Badge, Card, Spinner } from '@/components/ui/misc';
import { organizerApi } from '@/lib/api/endpoints';
import type { Organizer } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

export default function OrganizerSettingsPage() {
  const profile = useQuery({ queryKey: ['organizer-me'], queryFn: organizerApi.me });
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      {profile.data ? <ProfileCard key={profile.data.id} organizer={profile.data} /> : <Spinner />}
      <MpesaCard />
    </div>
  );
}

function ProfileCard({ organizer }: { organizer: Organizer }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(organizer.business_name);
  const [website, setWebsite] = useState(organizer.website ?? '');
  const [description, setDescription] = useState(organizer.description ?? '');
  const [logo, setLogo] = useState(organizer.logo_url);

  const save = useMutation({
    mutationFn: () => organizerApi.updateProfile({ business_name: name, website, description, logo_url: logo }),
    onSuccess: () => {
      toast.success('Profile saved');
      void queryClient.invalidateQueries({ queryKey: ['organizer-me'] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="p-6">
      <h2 className="font-sans text-lg font-bold">Public profile</h2>
      <p className="text-sm text-muted">Shown on your event pages.</p>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-[140px_1fr]"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <ImageUpload value={logo} onChange={setLogo} uploadType="organizer_logo" aspect="aspect-square" label="Logo" />
        <div className="space-y-4">
          <Field label="Business name" htmlFor="name">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Website" htmlFor="website">
            <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </Field>
          <Field label="About" htmlFor="about">
            <Textarea id="about" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Button type="submit" loading={save.isPending}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}

function MpesaCard() {
  const queryClient = useQueryClient();
  const current = useQuery({ queryKey: ['organizer-mpesa'], queryFn: () => organizerApi.mpesa().then((r) => r.data) });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    credential_type: 'paybill' as 'paybill' | 'till_number',
    environment: 'production' as 'sandbox' | 'production',
    shortcode: '',
    store_number: '',
    consumer_key: '',
    consumer_secret: '',
    passkey: '',
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['organizer-mpesa'] });

  const save = useMutation({
    mutationFn: () => organizerApi.saveMpesa({ ...form, store_number: form.store_number || undefined }),
    onSuccess: (r) => {
      toast.success(r.message ?? 'Saved');
      setEditing(false);
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const verify = useMutation({
    mutationFn: organizerApi.verifyMpesa,
    onSuccess: (r) => {
      toast.success(r.message ?? 'Verified');
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: organizerApi.deleteMpesa,
    onSuccess: () => {
      toast.success('Removed — payments go to Klix again');
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const c = current.data;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-sans text-lg font-bold">Receive payments directly</h2>
          <p className="mt-1 text-sm text-muted">
            Connect your own M-Pesa paybill or till (Daraja API) and buyers pay you straight away. Otherwise Klix collects and pays
            you out after each event.
          </p>
        </div>
        <ShieldCheck className="size-6 shrink-0 text-brand-500" />
      </div>

      {current.isPending ? (
        <Spinner />
      ) : c && !editing ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line p-4">
          <div>
            <p className="font-semibold">
              {c.credential_type === 'paybill' ? 'Paybill' : 'Till'} {c.shortcode_masked}{' '}
              {c.is_active ? <Badge tone="success">Receiving payments</Badge> : <Badge tone="warning">Not verified</Badge>}
            </p>
            <p className="text-xs text-muted">
              {c.environment === 'sandbox' ? 'Sandbox' : 'Production'}
              {c.verified_at && ` · verified ${formatDate(c.verified_at)}`}
            </p>
          </div>
          <div className="flex gap-2">
            {!c.is_active && (
              <Button size="sm" onClick={() => verify.mutate()} loading={verify.isPending}>
                <CheckCircle2 className="size-4" /> Verify
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Replace
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove.mutate()} loading={remove.isPending}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field label="Account type" htmlFor="type">
            <Select id="type" value={form.credential_type} onChange={set('credential_type')}>
              <option value="paybill">Paybill</option>
              <option value="till_number">Till (Buy Goods)</option>
            </Select>
          </Field>
          <Field label="Environment" htmlFor="env">
            <Select id="env" value={form.environment} onChange={set('environment')}>
              <option value="production">Production</option>
              <option value="sandbox">Sandbox (testing)</option>
            </Select>
          </Field>
          <Field label={form.credential_type === 'paybill' ? 'Paybill number' : 'Till number'} htmlFor="shortcode">
            <Input id="shortcode" inputMode="numeric" value={form.shortcode} onChange={set('shortcode')} />
          </Field>
          {form.credential_type === 'till_number' && (
            <Field label="Store number" htmlFor="store" hint="The head-office number your till belongs to">
              <Input id="store" inputMode="numeric" value={form.store_number} onChange={set('store_number')} />
            </Field>
          )}
          <Field label="Consumer key" htmlFor="ck">
            <Input id="ck" autoComplete="off" value={form.consumer_key} onChange={set('consumer_key')} />
          </Field>
          <Field label="Consumer secret" htmlFor="cs">
            <Input id="cs" type="password" autoComplete="off" value={form.consumer_secret} onChange={set('consumer_secret')} />
          </Field>
          <Field label="Lipa na M-Pesa passkey" htmlFor="pk" className="sm:col-span-2">
            <Input id="pk" type="password" autoComplete="off" value={form.passkey} onChange={set('passkey')} />
          </Field>
          <p className="text-xs text-muted sm:col-span-2">
            Secrets are encrypted before they&apos;re stored and are never shown again.
          </p>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" loading={save.isPending}>
              Save credentials
            </Button>
            {c && (
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}
