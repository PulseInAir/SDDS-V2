import React from 'react'
import { notFound } from 'next/navigation'
import { getClientById } from '@/lib/actions/clients'
import { ClientProfileHeader } from '@/components/clients/ClientProfileHeader'
import { Tabs } from '@/components/ui/Tabs'

export async function generateMetadata({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params
  const client = await getClientById(resolvedParams.clientId)
  return {
    title: client ? `${client.full_name} - SDDS` : 'Client Not Found',
  }
}

export default async function ClientProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}) {
  const resolvedParams = await params
  const client = await getClientById(resolvedParams.clientId)

  if (!client) {
    notFound()
  }

  const tabs = [
    { name: 'Overview', href: `/clients/${client.id}` },
    { name: 'Assessment Years', href: `/clients/${client.id}/assessment-years` },
    { name: 'Documents', href: `/clients/${client.id}/documents` },
    { name: 'Filings', href: `/clients/${client.id}/filings` },
    { name: 'Invoices & Payments', href: `/clients/${client.id}/invoices` },
    { name: 'Refunds', href: `/clients/${client.id}/refunds` },
    { name: 'Intimations / Notices', href: `/clients/${client.id}/notices` },
    { name: 'Communication & Activity', href: `/clients/${client.id}/communications` },
    { name: 'Credentials', href: `/clients/${client.id}/credentials` },
  ]

  return (
    <div className="flex flex-col h-full w-full py-6">
      <ClientProfileHeader client={client} />
      
      <div className="mt-4 mb-6">
        <Tabs tabs={tabs} />
      </div>

      <div className="flex-1 bg-surface-panel border border-border-subtle rounded-panel shadow-xs p-4 sm:p-6">
        {children}
      </div>
    </div>
  )
}
