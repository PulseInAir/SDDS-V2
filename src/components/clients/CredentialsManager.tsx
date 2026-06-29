'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { revealCredential, updateCredential } from '@/lib/actions/credentials'

interface CredentialsManagerProps {
  clientId: string
  hasExisting: boolean
}

export function CredentialsManager({ clientId, hasExisting }: CredentialsManagerProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [isEditing, setIsEditing] = useState(!hasExisting)
  const [credentials, setCredentials] = useState<Record<string, string>>({ portal_password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReveal = async () => {
    try {
      setError(null)
      setIsSubmitting(true)
      const data = await revealCredential(clientId)
      // Asserting data type based on how we save it
      setCredentials((data as Record<string, string>) || { portal_password: '' })
      setIsRevealed(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reveal credentials')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      setIsSubmitting(true)
      await updateCredential(clientId, credentials)
      setIsEditing(false)
      setIsRevealed(false)
      // If we just saved, we now have existing credentials
      if (!hasExisting) {
        // A hard refresh or router.refresh() might be needed to update server state, 
        // but we'll just handle local state for now.
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-4 max-w-sm">
        <TextField
          label="Income Tax Portal Password"
          type="text"
          value={credentials.portal_password || ''}
          onChange={(e) => setCredentials({ ...credentials, portal_password: e.target.value })}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Credentials'}
          </Button>
          {hasExisting && (
            <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setError(null) }} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4 max-w-sm">
      <div className="flex items-center justify-between p-4 bg-surface-muted border border-border-subtle rounded-panel shadow-xs">
        <div>
          <p className="text-sm font-semibold text-text-primary">Income Tax Portal</p>
          <p className="text-sm text-text-secondary font-mono tracking-wider mt-1">
            {isRevealed ? credentials.portal_password : '••••••••'}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {!isRevealed && (
            <Button type="button" variant="secondary" size="sm" onClick={handleReveal} disabled={isSubmitting}>
              {isSubmitting ? 'Revealing...' : 'Reveal'}
            </Button>
          )}
          {isRevealed && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsRevealed(false)}>
              Hide
            </Button>
          )}
        </div>
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}
 
      <div>
        <Button type="button" variant="secondary" onClick={() => { setIsEditing(true); setCredentials({ portal_password: '' }); setIsRevealed(false) }}>
          Update Password
        </Button>
      </div>
    </div>
  )
}
