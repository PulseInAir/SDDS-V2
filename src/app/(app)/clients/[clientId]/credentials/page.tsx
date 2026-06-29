import { hasCredential } from '@/lib/actions/credentials'
import { CredentialsManager } from '@/components/clients/CredentialsManager'

export default async function CredentialsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params
  const hasExisting = await hasCredential(resolvedParams.clientId)

  return (
    <div className="flex flex-col w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Portal Credentials</h2>
        <p className="text-sm text-gray-500 mt-1">Manage encrypted credentials for the income tax portal.</p>
      </div>

      <CredentialsManager clientId={resolvedParams.clientId} hasExisting={hasExisting} />
    </div>
  )
}
