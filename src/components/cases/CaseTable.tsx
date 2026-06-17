'use client';

import { useAppContext } from '@/contexts/AppContext';
import Link from 'next/link';
import { StatusBadge } from '../ui/StatusBadge';
import { MaskedValue } from '@/components/ui/MaskedValue';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Represents the data structure returned by getFilingQueueCases
export type FilingQueueCaseRow = {
  id: string;
  case_status: string;
  next_action: string | null;
  due_date: string | null;
  blocker: string | null;
  updated_at: string;
  clients: {
    id: string;
    full_name: string;
    pan_uppercase: string;
    mobile: string | null;
  };
  assessment_years: {
    id: string;
    label: string;
  };
};

export function CaseTable({ cases, page, totalPages }: { cases: FilingQueueCaseRow[]; page: number; totalPages: number }) {
  const { isPrivacyMode } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigateToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!cases || cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-surface-panel/50">
        <h3 className="text-lg font-medium text-text-primary mb-2">No filing cases found</h3>
        <p className="text-text-muted max-w-sm mb-6">
          Adjust your filters or add a new filing case to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-border-subtle shadow-sm">
        <table className="min-w-full divide-y divide-border-subtle">
          <thead className="bg-surface-hover">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                AY
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">
                Due Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">
                Next Action
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-panel divide-y divide-border-subtle">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-surface-hover transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-text-primary">{c.clients.full_name}</div>
                  <div className="text-sm text-text-muted mt-0.5">
                    <MaskedValue value={c.clients.pan_uppercase} isPrivacyMode={isPrivacyMode} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {c.assessment_years.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge 
                    variant={
                      ['Completed', 'Filed'].includes(c.case_status) ? 'success' : 
                      ['Notice Received', 'Rectification Required'].includes(c.case_status) ? 'warning' :
                      ['On Hold', 'Cancelled'].includes(c.case_status) ? 'neutral' : 'info'
                    }
                  >
                    {c.case_status}
                  </StatusBadge>
                  {c.blocker && (
                    <div className="text-xs text-brand-error mt-1 max-w-[150px] truncate" title={c.blocker}>
                      Blocked: {c.blocker}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary hidden sm:table-cell">
                  {c.due_date ? new Date(c.due_date).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary hidden md:table-cell max-w-[200px] truncate" title={c.next_action || ''}>
                  {c.next_action || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link 
                    href={`/filing-queue/${c.id}`} 
                    className="inline-flex items-center text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-[var(--radius-button)] transition-colors opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                  >
                    View
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-surface-panel border-t border-border-subtle sm:px-6 mt-4 rounded-b-[var(--radius-panel)]">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-text-secondary">
                Page <span className="font-medium text-text-primary">{page}</span> of <span className="font-medium text-text-primary">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigateToPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-r-none border-r-0"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
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
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
