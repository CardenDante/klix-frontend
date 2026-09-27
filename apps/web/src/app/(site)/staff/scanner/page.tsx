'use client';

import { useQuery } from '@tanstack/react-query';
import { Camera, CameraOff, CheckCircle2, Keyboard, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { Card, EmptyState, Spinner } from '@/components/ui/misc';
import { organizerApi, staffApi, ticketsApi } from '@/lib/api/endpoints';
import type { DoorResult, EventBrief } from '@/lib/api/types';
import { hasRole, useAuth } from '@/lib/auth';
import { formatEventRange } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function ScannerPage() {
  return (
    <RequireAuth roles={['event_staff', 'organizer']}>
      <Suspense fallback={<Spinner />}>
        <Scanner />
      </Suspense>
    </RequireAuth>
  );
}

function useScannableEvents() {
  const user = useAuth((s) => s.user);
  const isOrganizer = hasRole(user, 'organizer');

  return useQuery({
    queryKey: ['scannable-events', user?.id],
    queryFn: async () => {
      const [assigned, own] = await Promise.all([
        staffApi.myAssignments().then((r) => r.assignments.flatMap((a) => (a.event ? [a.event] : []))),
        isOrganizer ? organizerApi.events().then((r) => r.data) : Promise.resolve([] as EventBrief[]),
      ]);
      const byId = new Map<string, EventBrief>();
      for (const e of [...assigned, ...own]) if (e.status === 'published') byId.set(e.id, e);
      const cutoff = Date.now() - 24 * 3600 * 1000;
      return [...byId.values()]
        .filter((e) => new Date(e.end_datetime).getTime() > cutoff)
        .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
    },
  });
}

function Scanner() {
  const preselected = useSearchParams().get('event');
  const events = useScannableEvents();
  const [eventId, setEventId] = useState<string | null>(preselected);
  const selected = eventId ?? events.data?.[0]?.id ?? null;

  if (events.isPending) return <Spinner />;
  if (!events.data?.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState icon={<Camera className="size-5" />} title="No events to scan">
          Once an organizer adds you as staff for a live event, it shows up here.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <label htmlFor="event" className="text-sm font-medium text-muted">
        Scanning for
      </label>
      <Select id="event" value={selected ?? ''} onChange={(e) => setEventId(e.target.value)} className="mt-1">
        {events.data.map((e) => (
          <option key={e.id} value={e.id}>
            {e.title} — {formatEventRange(e.start_datetime, e.end_datetime)}
          </option>
        ))}
      </Select>
      {selected && <Door key={selected} eventId={selected} />}
    </div>
  );
}

function Door({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const busy = useRef(false);
  const lastCode = useRef<{ code: string; at: number } | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<DoorResult | null>(null);
  const [admitted, setAdmitted] = useState(0);
  const [manual, setManual] = useState('');

  const handleCode = useCallback(
    async (code: string) => {
      const now = Date.now();
      // Cameras report the same code many times a second; ignore repeats briefly.
      if (busy.current || (lastCode.current?.code === code && now - lastCode.current.at < 4000)) return;
      busy.current = true;
      lastCode.current = { code, at: now };
      try {
        const res = await ticketsApi.checkIn(code, eventId, 'Scanner');
        setResult(res);
        if (res.valid) setAdmitted((n) => n + 1);
        navigator.vibrate?.(res.valid ? 80 : [60, 60, 60]);
      } catch (e) {
        setResult({ valid: false, message: (e as Error).message, ticket: null });
      } finally {
        busy.current = false;
      }
    },
    [eventId],
  );

  useEffect(() => {
    if (!cameraOn || !videoRef.current) return;
    let stopped = false;
    let scanner: { start(): Promise<void>; destroy(): void } | null = null;

    import('qr-scanner').then(({ default: QrScanner }) => {
      if (stopped || !videoRef.current) return;
      const instance = new QrScanner(videoRef.current, (r) => void handleCode(r.data), {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        maxScansPerSecond: 8,
        returnDetailedScanResult: true,
      });
      scanner = instance;
      instance.start().catch(() => setCameraError('Camera unavailable. Allow camera access or enter codes manually.'));
    });

    return () => {
      stopped = true;
      scanner?.destroy();
    };
  }, [cameraOn, handleCode]);

  // Clear the result card after a moment so the next guest is obvious.
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 3500);
    return () => clearTimeout(t);
  }, [result]);

  return (
    <div className="mt-4 space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-card bg-ink">
        {cameraOn && !cameraError ? (
          <video ref={videoRef} className="size-full object-cover" muted playsInline />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 px-8 text-center text-white/70">
            <CameraOff className="size-8" />
            <p className="text-sm">{cameraError ?? 'Camera is off'}</p>
          </div>
        )}
        {result && (
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white',
              result.valid ? 'bg-green-600/95' : 'bg-red-600/95',
            )}
            role="status"
            aria-live="assertive"
          >
            {result.valid ? <CheckCircle2 className="size-16" /> : <XCircle className="size-16" />}
            <p className="text-2xl font-bold">{result.valid ? 'Admit' : result.message}</p>
            {result.ticket && (
              <>
                <p className="text-lg">{result.ticket.attendee_name}</p>
                <p className="text-sm text-white/80">
                  {result.ticket.ticket_type?.name} · {result.ticket.ticket_number}
                </p>
                {result.reason === 'already_used' && result.ticket.checked_in_at && (
                  <p className="text-sm text-white/80">
                    Scanned at {new Date(result.ticket.checked_in_at).toLocaleTimeString('en-KE')}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Card className="px-4 py-2">
          <span className="text-sm text-muted">Admitted this session </span>
          <span className="font-bold tabular-nums">{admitted}</span>
        </Card>
        <Button variant="secondary" size="sm" onClick={() => { setCameraError(null); setCameraOn((on) => !on); }}>
          {cameraOn ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
          {cameraOn ? 'Camera off' : 'Camera on'}
        </Button>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!manual.trim()) return;
          lastCode.current = null;
          void handleCode(manual.trim());
          setManual('');
        }}
      >
        <div className="relative flex-1">
          <Keyboard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Paste ticket code" className="pl-9" aria-label="Ticket code" />
        </div>
        <Button type="submit" variant="dark">
          Check
        </Button>
      </form>
    </div>
  );
}
