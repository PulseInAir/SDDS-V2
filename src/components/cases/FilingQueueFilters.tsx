'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { TextField } from '../ui/TextField';
import { CASE_STATUSES } from '@/lib/constants/workflows';
import { ChevronDown } from 'lucide-react';

interface FilingQueueFiltersProps {
  initialSearch: string;
  initialStatus: string;
  initialAy: string;
}

export function FilingQueueFilters({ initialSearch, initialStatus, initialAy }: FilingQueueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set('page', '1'); // Reset to first page
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm === initialSearch) return;

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) {
          params.set('search', searchTerm);
          params.set('page', '1');
        } else {
          params.delete('search');
        }
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, pathname, router, searchParams, initialSearch]);

  const years = ["2024-25", "2025-26", "2026-27"];

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <div className="w-full sm:w-64 relative">
        <TextField
          type="search"
          placeholder="Search client or PAN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={isPending ? 'opacity-70' : ''}
          aria-label="Search cases"
        />
      </div>

      <div className="flex gap-3">
        <div className="relative">
          <select
            value={initialAy}
            onChange={(e) => handleFilterChange('ay', e.target.value)}
            className="h-9 cursor-pointer appearance-none rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel py-1.5 pl-3 pr-8 text-sm font-medium text-text-primary shadow-sm outline-none transition-colors hover:bg-surface-hover focus:border-brand-600 focus:ring-1 focus:ring-brand-600 w-full"
            aria-label="Filter by Assessment Year"
          >
            <option value="">All Assessment Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                AY {year}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-text-muted">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        <div className="relative">
          <select
            value={initialStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="h-9 cursor-pointer appearance-none rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel py-1.5 pl-3 pr-8 text-sm font-medium text-text-primary shadow-sm outline-none transition-colors hover:bg-surface-hover focus:border-brand-600 focus:ring-1 focus:ring-brand-600 w-full"
            aria-label="Filter by Status"
          >
            <option value="">All Statuses</option>
            {CASE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-text-muted">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
