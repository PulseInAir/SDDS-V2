import { getClients } from '@/lib/actions/clients'
import { ClientList } from '@/components/clients/ClientList'
import { ClientSearch } from '@/components/clients/ClientSearch'
import { Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
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

  const getFilterUrl = (targetStatus: string) => {
    const searchPart = search ? `&search=${encodeURIComponent(search)}` : ''
    const sortPart = sortBy ? `&sortBy=${sortBy}` : ''
    return `/clients?status=${targetStatus}${searchPart}${sortPart}`
  }

  const isAllActive = status === 'all'
  const isActiveActive = status === 'active'
  const isInactiveActive = status === 'inactive'
  const isExcludedActive = status === 'excluded'

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage permanent client records and identities.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <ClientSearch initialSearch={search} />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link
          href={getFilterUrl('all')}
          className={`p-4 rounded-xl border shadow-sm flex items-center space-x-4 transition-all duration-200 hover:border-brand-500 hover:shadow-md cursor-pointer ${
            isAllActive ? 'bg-brand-50/10 border-brand-500 ring-1 ring-brand-500' : 'bg-white border-gray-200/80'
          }`}
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Clients</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.total}</p>
          </div>
        </Link>

        <Link
          href={getFilterUrl('active')}
          className={`p-4 rounded-xl border shadow-sm flex items-center space-x-4 transition-all duration-200 hover:border-brand-500 hover:shadow-md cursor-pointer ${
            isActiveActive ? 'bg-brand-50/10 border-brand-500 ring-1 ring-brand-500' : 'bg-white border-gray-200/80'
          }`}
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Clients</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.active}</p>
          </div>
        </Link>

        <Link
          href={getFilterUrl('inactive')}
          className={`p-4 rounded-xl border shadow-sm flex items-center space-x-4 transition-all duration-200 hover:border-brand-500 hover:shadow-md cursor-pointer ${
            isInactiveActive ? 'bg-brand-50/10 border-brand-500 ring-1 ring-brand-500' : 'bg-white border-gray-200/80'
          }`}
        >
          <div className="p-3 bg-gray-50 text-gray-600 rounded-lg">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inactive Clients</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.inactive}</p>
          </div>
        </Link>

        <Link
          href={getFilterUrl('excluded')}
          className={`p-4 rounded-xl border shadow-sm flex items-center space-x-4 transition-all duration-200 hover:border-brand-500 hover:shadow-md cursor-pointer ${
            isExcludedActive ? 'bg-brand-50/10 border-brand-500 ring-1 ring-brand-500' : 'bg-white border-gray-200/80'
          }`}
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Excluded Clients</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.excluded}</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm">
        <ClientList clients={data.clients || []} page={data.page} totalPages={data.totalPages} />
      </div>
    </div>
  )
}
