'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { adminApi } from '@/lib/api/endpoints';

const AREAS = ['', 'organizer', 'promoter', 'user', 'event', 'withdrawal', 'settlement', 'mpesa_credential', 'loyalty'];

const when = new Intl.DateTimeFormat('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' });

export default function AuditLogPage() {
  const [area, setArea] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['audit', area, page], queryFn: () => adminApi.auditLogs({ action: area || undefined, page }) });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Audit log</h1>
        <Select value={area} onChange={(e) => { setArea(e.target.value); setPage(1); }} className="w-52" aria-label="Filter by area">
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a ? a.replace('_', ' ') : 'Everything'}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-6">
        {query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorNote>{query.error.message}</ErrorNote>
        ) : (
          <>
            <Card className="divide-y divide-line">
              {query.data.data.length === 0 && <p className="p-6 text-center text-sm text-muted">No entries.</p>}
              {query.data.data.map((log) => (
                <div key={log.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p>
                      <span className="font-mono font-semibold">{log.action}</span>
                      <span className="text-muted"> by {log.actor?.email ?? 'system'}</span>
                    </p>
                    <span className="text-xs text-muted">{when.format(new Date(log.created_at))}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {log.target_type} {log.target_id?.slice(0, 8)}
                    {Object.keys(log.metadata).length > 0 && ` · ${JSON.stringify(log.metadata)}`}
                    {log.ip && ` · ${log.ip}`}
                  </p>
                </div>
              ))}
            </Card>
            <div className="mt-4 flex justify-between">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Newer
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= query.data.total_pages} onClick={() => setPage((p) => p + 1)}>
                Older
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
