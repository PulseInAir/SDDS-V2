import React from 'react'
import { notFound } from 'next/navigation'
import { getClientById } from '@/lib/actions/clients'

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

  return (
    <div className="flex flex-col h-full w-full">
      {children}
    </div>
  )
}
