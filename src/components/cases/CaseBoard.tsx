'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MoveRight,
} from 'lucide-react';
import { transitionFilingCase } from '@/lib/actions/cases';
import { CASE_STATUSES, VALID_TRANSITIONS } from '@/lib/constants/workflows';
import type { CaseStatus } from '@/lib/constants/workflows';
import { useAppContext } from '@/contexts/AppContext';
import { MaskedValue } from '@/components/ui/MaskedValue';
import { Button } from '@/components/ui/Button';
import type { FilingQueueCaseRow } from './CaseTable';

interface CaseBoardProps {
  cases: FilingQueueCaseRow[];
  page: number;
  totalPages: number;
  statusFilter: string;
}

const REASON_REQUIRED_STATUSES: CaseStatus[] = [
  'On Hold',
  'Cancelled',
  'Rectification Required',
];

function isCaseStatus(value: string): value is CaseStatus {
  return CASE_STATUSES.includes(value as CaseStatus);
}

function formatDate(value: string | null) {
  if (!value) return 'No due date';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function CaseMoveControl({ filingCase }: { filingCase: FilingQueueCaseRow }) {
  const router = useRouter();
  const currentStatus = isCaseStatus(filingCase.case_status)
    ? filingCase.case_status
    : null;
  const allowedNext = currentStatus ? VALID_TRANSITIONS[currentStatus] : [];
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (allowedNext.length === 0) return null;

  const needsReason =
    selectedStatus !== '' && REASON_REQUIRED_STATUSES.includes(selectedStatus);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStatus || (needsReason && !reason.trim())) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await transitionFilingCase(filingCase.id, {
        toStatus: selectedStatus,
        reason: reason.trim() || undefined,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSelectedStatus('');
      setReason('');
      router.refresh();
    } catch {
      setError('Unable to update the case status.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-2 border-t border-border-subtle pt-3"
    >
      <label htmlFor={`move-${filingCase.id}`} className="sr-only">
        Move {filingCase.clients.full_name} to another status
      </label>
      <div className="flex gap-2">
        <select
          id={`move-${filingCase.id}`}
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value as CaseStatus | '');
            setError(null);
          }}
          disabled={isSubmitting}
          className="min-w-0 flex-1 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-2.5 py-2 text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
        >
          <option value="">Move to…</option>
          {allowedNext.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          size="sm"
          disabled={
            !selectedStatus ||
            isSubmitting ||
            (needsReason && !reason.trim())
          }
          aria-label={`Move ${filingCase.clients.full_name}`}
        >
          <MoveRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {selectedStatus && (
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={needsReason ? 'Reason required' : 'Optional note'}
          required={needsReason}
          disabled={isSubmitting}
          rows={2}
          maxLength={1000}
          className="w-full resize-none rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-2.5 py-2 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
        />
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

export function CaseBoard({
  cases,
  page,
  totalPages,
  statusFilter,
}: CaseBoardProps) {
  const { isPrivacyMode } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const visibleStatuses =
    statusFilter && isCaseStatus(statusFilter)
      ? [statusFilter]
      : [...CASE_STATUSES];

  function navigateToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel/50 p-12 text-center">
        <h3 className="mb-2 text-lg font-medium text-text-primary">
          No filing cases found
        </h3>
        <p className="max-w-sm text-text-muted">
          Adjust your filters or add a filing case to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="overflow-x-auto pb-3" aria-label="Filing Queue board">
        <div className="flex min-w-max items-start gap-4">
          {visibleStatuses.map((status) => {
            const statusCases = cases.filter(
              (filingCase) => filingCase.case_status === status,
            );
            const columnId = `column-${status
              .replaceAll(' ', '-')
              .toLowerCase()}`;

            return (
              <section
                key={status}
                aria-labelledby={columnId}
                className="w-72 shrink-0 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-hover/70 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <h2
                    id={columnId}
                    className="text-sm font-semibold text-text-primary"
                  >
                    {status}
                  </h2>
                  <span className="rounded-full bg-surface-panel px-2 py-0.5 text-xs font-medium text-text-secondary shadow-sm">
                    {statusCases.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {statusCases.length === 0 ? (
                    <div className="rounded-[var(--radius-panel)] border border-dashed border-border-subtle bg-surface-panel/60 px-3 py-8 text-center text-xs text-text-muted">
                      No cases on this page
                    </div>
                  ) : (
                    statusCases.map((filingCase) => (
                      <article
                        key={filingCase.id}
                        className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-text-primary">
                              {filingCase.clients.full_name}
                            </h3>
                            <p className="mt-1 text-xs text-text-muted">
                              <MaskedValue
                                value={filingCase.clients.pan_uppercase}
                                isPrivacyMode={isPrivacyMode}
                              />
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700">
                            AY {filingCase.assessment_years.label}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-text-secondary">
                          <div className="flex items-center gap-2">
                            <CalendarDays
                              className="h-4 w-4 shrink-0 text-text-muted"
                              aria-hidden="true"
                            />
                            <span>{formatDate(filingCase.due_date)}</span>
                          </div>

                          <p
                            className="line-clamp-2 min-h-8"
                            title={filingCase.next_action || ''}
                          >
                            {filingCase.next_action || 'No next action recorded'}
                          </p>

                          {filingCase.blocker && (
                            <div className="flex items-start gap-2 rounded-[var(--radius-input)] bg-red-50 px-2.5 py-2 text-red-700">
                              <AlertTriangle
                                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="line-clamp-2">
                                {filingCase.blocker}
                              </span>
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/filing-queue/${filingCase.id}`}
                          className="mt-4 inline-flex items-center text-xs font-medium text-brand-700 hover:text-brand-800"
                        >
                          Open case
                          <ArrowRight
                            className="ml-1.5 h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </Link>

                        <CaseMoveControl filingCase={filingCase} />
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel px-4 py-3">
          <p className="text-sm text-text-secondary">
            Page <span className="font-medium text-text-primary">{page}</span>{' '}
            of{' '}
            <span className="font-medium text-text-primary">{totalPages}</span>
          </p>
          <nav
            className="inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Board pagination"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-r-none border-r-0"
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-l-none"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}
