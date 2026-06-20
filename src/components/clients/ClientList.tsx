'use client'

import { useAppContext } from '@/contexts/AppContext'
import Link from 'next/link'
import { StatusBadge } from '../ui/StatusBadge'
import { MaskedValue } from '@/components/ui/MaskedValue'
import { Edit, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// Assuming Database types
type ClientRow = {
  id: string
  full_name: string
  pan_uppercase: string
  mobile: string | null
  active: boolean
  // Add more as needed
}

export function ClientList({ clients, page, totalPages }: { clients: ClientRow[], page: number, totalPages: number }) {
  const { isPrivacyMode } = useAppContext()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PAN
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="relative px-6 py-3">
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{client.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <MaskedValue value={client.pan_uppercase} isPrivacyMode={isPrivacyMode} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <MaskedValue value={client.mobile} isPrivacyMode={isPrivacyMode} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge 
                    variant={client.active ? 'success' : 'neutral'} 
                  >
                    {client.active ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/clients/${client.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
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
