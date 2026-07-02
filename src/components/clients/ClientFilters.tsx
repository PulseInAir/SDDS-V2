'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { ChevronDown } from 'lucide-react'

interface ClientFiltersProps {
  initialStatus: string
  initialSortBy: string
}

export function ClientFilters({ initialStatus, initialSortBy }: ClientFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.set('page', '1') // Reset to page 1
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className={`flex gap-3 items-center ${isPending ? 'opacity-70' : ''}`}>
      <div className="relative">
        <select
          value={initialStatus}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="h-9 cursor-pointer appearance-none rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel py-1.5 pl-3 pr-8 text-sm font-medium text-text-primary shadow-sm outline-none transition-colors hover:bg-surface-hover focus:border-brand-600 focus:ring-1 focus:ring-brand-600 min-w-[130px]"
          aria-label="Filter by Status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="excluded">Follow-up Excluded</option>
          <option value="new_client">New Client</option>
          <option value="filing_queue">Filing Queue</option>
          <option value="filed">Filed</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-text-muted">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <div className="relative">
        <select
          value={initialSortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="h-9 cursor-pointer appearance-none rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel py-1.5 pl-3 pr-8 text-sm font-medium text-text-primary shadow-sm outline-none transition-colors hover:bg-surface-hover focus:border-brand-600 focus:ring-1 focus:ring-brand-600 min-w-[150px]"
          aria-label="Sort by"
        >
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="client_id_asc">Client ID (Low-High)</option>
          <option value="client_id_desc">Client ID (High-Low)</option>
          <option value="created_desc">Created (Newest)</option>
          <option value="created_asc">Created (Oldest)</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-text-muted">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
