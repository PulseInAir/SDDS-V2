import { getClients } from '@/lib/actions/clients'
import { ClientList } from '@/components/clients/ClientList'
import { ClientSearch } from '@/components/clients/ClientSearch'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
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

  const data = await getClients({ search, page })

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage permanent client records and identities.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ClientSearch initialSearch={search} />
          
          <Link href="/clients/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm">
        <ClientList clients={data.clients || []} page={data.page} totalPages={data.totalPages} />
      </div>
    </div>
  )
}
