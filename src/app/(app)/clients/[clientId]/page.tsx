import { ClientForm } from '@/components/clients/ClientForm'
import { getClientById } from '@/lib/actions/clients'
import { notFound } from 'next/navigation'

export default async function ClientOverviewPage({ params }: { params: Promise<{ clientId: string }> }) {
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
    <div className="flex flex-col w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Identity Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Manage core client identity and contact information.</p>
      </div>

      <ClientForm client={formData} isEdit={true} />
    </div>
  )
}
