'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { MaskedValue } from '@/components/ui/MaskedValue'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAppContext } from '@/contexts/AppContext'
import { Tables } from '@/types/database.types'

type ClientRow = Tables<'clients'>

export function ClientProfileHeader({ client }: { client: ClientRow }) {
  const { isPrivacyMode } = useAppContext()

  return (
    <div className="mb-6">
      <Link href="/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Clients
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            {client.full_name}
            {!client.active && <StatusBadge variant="neutral">Inactive</StatusBadge>}
          </h1>
          
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">PAN:</span>
              <MaskedValue value={client.pan_uppercase} isPrivacyMode={isPrivacyMode} />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Mobile:</span>
              <MaskedValue value={client.mobile} isPrivacyMode={isPrivacyMode} />
            </div>

            {client.email && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-500">Email:</span>
                <span>{client.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
