'use client'

import { useAppContext } from '@/contexts/AppContext'
import Link from 'next/link'
import { StatusBadge } from '../ui/StatusBadge'
import { MaskedValue } from '@/components/ui/MaskedValue'
import { Edit, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// Assuming Database types
type ClientRow = {
  id: string
  client_id_code: string
  full_name: string
  pan_uppercase: string
  mobile: string | null
  active: boolean
}

export function ClientList({ clients, page, totalPages }: { clients: ClientRow[], page: number, totalPages: number }) {
  const { isPrivacyMode } = useAppContext()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get('sortBy') || 'name_asc'

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString())
    let nextSort = ''

    if (field === 'client_id') {
      nextSort = currentSort === 'client_id_asc' ? 'client_id_desc' : 'client_id_asc'
    } else if (field === 'name') {
      nextSort = currentSort === 'name_asc' ? 'name_desc' : 'name_asc'
    } else if (field === 'status') {
      nextSort = currentSort === 'status_active_first' ? 'status_inactive_first' : 'status_active_first'
    }

    if (nextSort) {
      params.set('sortBy', nextSort)
      params.set('page', '1') // Reset page on sort change
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  const renderSortIcon = (field: string) => {
    if (field === 'client_id') {
      if (currentSort === 'client_id_asc') return <ArrowUp className="inline-block w-4 h-4 ml-1 text-brand-600" />
      if (currentSort === 'client_id_desc') return <ArrowDown className="inline-block w-4 h-4 ml-1 text-brand-600" />
    } else if (field === 'name') {
      if (currentSort === 'name_asc') return <ArrowUp className="inline-block w-4 h-4 ml-1 text-brand-600" />
      if (currentSort === 'name_desc') return <ArrowDown className="inline-block w-4 h-4 ml-1 text-brand-600" />
    } else if (field === 'status') {
      if (currentSort === 'status_active_first') return <ArrowUp className="inline-block w-4 h-4 ml-1 text-brand-600" />
      if (currentSort === 'status_inactive_first') return <ArrowDown className="inline-block w-4 h-4 ml-1 text-brand-600" />
    }
    return <ArrowUpDown className="inline-block w-3.5 h-3.5 ml-1 text-gray-400 group-hover:text-gray-600" />
  }

  const navigateToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50/50">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
        <p className="text-gray-500 max-w-sm mb-6">
          Get started by adding a new client to the repository.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="group px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                onClick={() => handleSort('client_id')}
              >
                <div className="flex items-center">
                  Client ID
                  {renderSortIcon('client_id')}
                </div>
              </th>
              <th
                scope="col"
                className="group px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Client Name
                  {renderSortIcon('name')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PAN
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile
              </th>
              <th
                scope="col"
                className="group px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {renderSortIcon('status')}
                </div>
              </th>
              <th scope="col" className="relative px-4 py-3 sm:px-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
             {clients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-semibold text-brand-900">
                  {client.client_id_code}
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{client.full_name}</div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                  <MaskedValue value={client.pan_uppercase} isPrivacyMode={isPrivacyMode} />
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                  <MaskedValue value={client.mobile} isPrivacyMode={isPrivacyMode} />
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  <StatusBadge 
                    variant={client.active ? 'success' : 'neutral'} 
                  >
                    {client.active ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/clients/${client.id}`} className="inline-flex items-center text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-md transition-colors font-medium">
                    <Edit className="w-4 h-4 mr-1.5" />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t sm:px-6 mt-4">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigateToPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-l-md"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigateToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-r-md"
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
  )
}
