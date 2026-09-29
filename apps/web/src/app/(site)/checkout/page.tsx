'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, MapPin, ShieldCheck, ShoppingBag, Tag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Card, EmptyState, ErrorNote } from '@/components/ui/misc';
import { SafeImg } from '@/components/ui/safe-img';
import { ApiError } from '@/lib/api/client';
import { checkoutApi, loyaltyApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { cartTotals, useCart } from '@/lib/cart';
import { useHydrated } from '@/hooks/use-hydrated';
import { formatDate, formatKES, formatTime, isKenyanPhone, normalizePhone } from '@/lib/format';

const schema = z.object({
  attendee_name: z.string().trim().min(2, 'Enter the name for the tickets'),
  attendee_email: z.email('Enter a valid email — your tickets are sent here'),
  attendee_phone: z.string().refine(isKenyanPhone, 'Enter a Safaricom number, e.g. 0712 345 678'),
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { event, lines, promoCode, discountPercentage, setPromo, clear } = useCart();
  const user = useAuth((s) => s.user);
  const mounted = useHydrated();
  const [promoInput, setPromoInput] = useState('');
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCredits, setUseCredits] = useState(false);
  const loyalty = useQuery({ queryKey: ['loyalty-balance'], queryFn: loyaltyApi.balance, enabled: !!user });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { attendee_name: '', attendee_email: '', attendee_phone: '' },
  });

  // Prefill from the signed-in account without clobbering what was typed.
  useEffect(() => {
    if (!user) return;
    const { getValues, setValue } = form;
    if (!getValues('attendee_name') && user.full_name) setValue('attendee_name', user.full_name);
    if (!getValues('attendee_email')) setValue('attendee_email', user.email);
    if (!getValues('attendee_phone') && user.phone_number) setValue('attendee_phone', `0${user.phone_number.slice(3)}`);
  }, [user, form]);

  const totals = cartTotals(lines, discountPercentage);
  const maxCredits = Math.floor((totals.total * (loyalty.data?.max_redeem_percentage ?? 50)) / 100);
  const usableCredits = Math.min(loyalty.data?.available_credits ?? 0, maxCredits);
  const creditsApplied = useCredits ? usableCredits : 0;
  const payable = Math.max(0, totals.total - creditsApplied);

  if (!mounted) return null;

  if (!event || lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="size-5" />}
          title="Your cart is empty"
          action={<ButtonLink href="/events">Find events</ButtonLink>}
        >
          Pick tickets on an event page to check out.
        </EmptyState>
      </div>
    );
  }

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setCheckingPromo(true);
    try {
      const result = await checkoutApi.validatePromo(code, event.id);
      if (result.valid) {
        setPromo(code.toUpperCase(), Number(result.data.discount_percentage ?? 0));
        toast.success('Promo code applied');
      } else {
        toast.error(result.data.message ?? 'That code is not valid');
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCheckingPromo(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const phone = normalizePhone(values.attendee_phone);
    try {
      const { data: order } = await checkoutApi.purchase({
        items: lines.map((l) => ({ ticket_type_id: l.ticketTypeId, quantity: l.quantity })),
        attendee_name: values.attendee_name,
        attendee_email: values.attendee_email,
        attendee_phone: phone,
        promoter_code: promoCode || undefined,
        use_loyalty_credits: creditsApplied > 0,
      });

      if (order.status === 'pending') {
        // If the prompt can't be sent now, the order page offers a retry.
        await checkoutApi.initiateMpesa(order.id, phone).catch((e: Error) => toast.error(e.message));
      }
      clear();
      router.push(`/orders/${order.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href={`/events/${event.slug}`} className="text-sm font-medium text-muted hover:text-ink">
        ← Back to event
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <Card className="space-y-5 p-6">
            <h2 className="font-sans text-lg font-bold">Your details</h2>
            {!user && (
              <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                Checking out as a guest.{' '}
                <Link href="/login?next=/checkout" className="font-semibold underline">
                  Sign in
                </Link>{' '}
                to keep your tickets in your account.
              </p>
            )}
            <Field label="Full name" htmlFor="attendee_name" error={form.formState.errors.attendee_name?.message}>
              <Input id="attendee_name" autoComplete="name" {...form.register('attendee_name')} />
            </Field>
            <Field
              label="Email"
              htmlFor="attendee_email"
              error={form.formState.errors.attendee_email?.message}
              hint="We'll email your tickets here."
            >
              <Input id="attendee_email" type="email" autoComplete="email" {...form.register('attendee_email')} />
            </Field>
          </Card>

          <Card className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-lg font-bold">Pay with M-Pesa</h2>
              <img src="/M-PESA.png" alt="M-Pesa" className="h-6 w-auto" />
            </div>
            <Field
              label="M-Pesa phone number"
              htmlFor="attendee_phone"
              error={form.formState.errors.attendee_phone?.message}
              hint="You'll get a prompt on this phone to enter your M-Pesa PIN."
            >
              <Input
                id="attendee_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0712 345 678"
                {...form.register('attendee_phone')}
              />
            </Field>
            {usableCredits > 0 && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3">
                <input
                  type="checkbox"
                  className="size-4 accent-brand-500"
                  checked={useCredits}
                  onChange={(e) => setUseCredits(e.target.checked)}
                />
                <span className="flex-1 text-sm">
                  Use <strong>{usableCredits.toLocaleString()}</strong> loyalty credits
                  <span className="block text-xs text-muted">Save {formatKES(usableCredits)} on this order</span>
                </span>
              </label>
            )}
            {error && <ErrorNote>{error}</ErrorNote>}
            <Button type="submit" block size="lg" loading={form.formState.isSubmitting}>
              {payable === 0 ? 'Get free tickets' : `Pay ${formatKES(payable)}`}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <ShieldCheck className="size-3.5" aria-hidden /> Tickets are held for 10 minutes while you pay.
            </p>
          </Card>
        </form>

        {/* On phones the summary comes first, so buyers see what they pay for (and can add a code) before the Pay button. */}
        <aside className="order-first lg:order-none lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            {event.banner_image_url && (
              <SafeImg src={event.banner_image_url} alt="" className="hidden aspect-[16/7] w-full object-cover lg:block" />
            )}
            <div className="space-y-4 p-5">
              <div>
                <h2 className="font-sans text-lg font-bold leading-snug">{event.title}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <CalendarDays className="size-3.5" aria-hidden /> {formatDate(event.start_datetime)} ·{' '}
                  {formatTime(event.start_datetime)}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="size-3.5" aria-hidden /> {event.location}
                </p>
              </div>
              <ul className="space-y-2 border-t border-line pt-4 text-sm">
                {lines.map((line) => (
                  <li key={line.ticketTypeId} className="flex justify-between gap-2">
                    <span>
                      {line.quantity} × {line.name}
                    </span>
                    <span className="font-medium">{formatKES(Number(line.price) * line.quantity)}</span>
                  </li>
                ))}
                {totals.discount > 0 && (
                  <li className="flex justify-between text-success">
                    <span>Promo {promoCode}</span>
                    <span>−{formatKES(totals.discount)}</span>
                  </li>
                )}
              </ul>
              {creditsApplied > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Loyalty credits</span>
                  <span>−{formatKES(creditsApplied)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold">{formatKES(payable)}</span>
              </div>
              {!promoCode && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                    <Input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Promo code"
                      aria-label="Promo code"
                      className="h-10 pl-9 uppercase placeholder:normal-case"
                    />
                  </div>
                  <Button type="button" variant="secondary" size="sm" className="h-10" onClick={applyPromo} loading={checkingPromo}>
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
