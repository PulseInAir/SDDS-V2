import { ClientForm } from '@/components/clients/ClientForm'
import { getClientById } from '@/lib/actions/clients'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params
  const client = await getClientById(resolvedParams.clientId)
  return {
    title: client ? `${client.full_name} - SDDS` : 'Client Not Found',
  }
}

export default async function ClientEditPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params
  const client = await getClientById(resolvedParams.clientId)

  if (!client) {
    notFound()
  }

  // Map to ClientFormData
  const formData = {
    id: client.id,
    full_name: client.full_name,
    pan_uppercase: client.pan_uppercase,
    date_of_birth: client.date_of_birth || '',
    mobile: client.mobile || '',
    email: client.email || '',
    address: client.address || '',
    family_group: client.family_group || '',
    active: client.active,
    follow_up_excluded: client.follow_up_excluded,
    exclusion_reason: client.exclusion_reason || '',
  }

  return (
    <div className="flex flex-col h-full max-w-4xl space-y-6">
      <div>
        <Link href="/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{client.full_name}</h1>
        <p className="text-sm text-gray-500 mt-1">Manage client details and operational settings.</p>
      </div>

      <ClientForm client={formData} isEdit={true} />
    </div>
  )
}
