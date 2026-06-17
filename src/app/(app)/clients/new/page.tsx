import { ClientForm } from '@/components/clients/ClientForm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'New Client - SDDS',
}

export default function NewClientPage() {
  return (
    <div className="flex flex-col h-full max-w-4xl space-y-6">
      <div>
        <Link href="/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Client</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new permanent client record in the workspace.</p>
      </div>

      <ClientForm />
    </div>
  )
}
