import { getClients } from '@/lib/actions/clients'
import { ClientList } from '@/components/clients/ClientList'
import { ClientSearch } from '@/components/clients/ClientSearch'
import { ClientFilters } from '@/components/clients/ClientFilters'
import { Button } from '@/components/ui/Button'
import { Plus, Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Clients - SDDS',
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const status = typeof params.status === 'string' ? params.status : 'all'
  const sortBy = typeof params.sortBy === 'string' ? params.sortBy : 'name_asc'

  const data = await getClients({ search, page, status, sortBy })
  const metrics = data.metrics

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage permanent client records and identities.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <ClientSearch initialSearch={search} />
          <ClientFilters initialStatus={status} initialSortBy={sortBy} />
          
          <Link href="/clients/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Clients</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.active}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-gray-50 text-gray-600 rounded-lg">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inactive</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.inactive}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Excluded</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.excluded}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm">
        <ClientList clients={data.clients || []} page={data.page} totalPages={data.totalPages} />
      </div>
    </div>
  )
}
