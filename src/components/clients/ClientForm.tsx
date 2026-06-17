'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClientAction, updateClientAction } from '@/lib/actions/clients'
import { clientFormSchema, ClientFormData } from '@/lib/validations/clients'
import { TextField } from '../ui/TextField'
import { Button } from '../ui/Button'
import { useRouter } from 'next/navigation'

export function ClientForm({ client, isEdit = false }: { client?: ClientFormData & { id?: string }, isEdit?: boolean }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      full_name: client?.full_name || '',
      pan_uppercase: client?.pan_uppercase || '',
      date_of_birth: client?.date_of_birth || '',
      mobile: client?.mobile || '',
      email: client?.email || '',
      address: client?.address || '',
      family_group: client?.family_group || '',
      active: client?.active ?? true,
      follow_up_excluded: client?.follow_up_excluded ?? false,
      exclusion_reason: client?.exclusion_reason || '',
    }
  })

  const followUpExcluded = watch('follow_up_excluded')

  const onSubmit = async (data: ClientFormData) => {
    setServerError(null)
    
    // In zod we defined pan_uppercase as transform(val => val.toUpperCase()),
    // but react-hook-form doesn't apply the transform to the input value automatically on change,
    // so it will be transformed on submit during validation. The data here is valid and transformed.

    let result
    if (isEdit && client?.id) {
      result = await updateClientAction(client.id, data)
    } else {
      result = await createClientAction(data)
    }

    if (result.error) {
      setServerError(result.error)
    } else if (result.success) {
      router.push(`/clients/${result.client.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg border border-gray-200">
      {serverError && (
        <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TextField
          label="Full Name"
          {...register('full_name')}
          error={errors.full_name?.message}
          placeholder="Legal name as per PAN"
        />

        <TextField
          label="PAN"
          {...register('pan_uppercase')}
          error={errors.pan_uppercase?.message}
          placeholder="ABCDE1234F"
          className="uppercase"
        />

        <TextField
          label="Date of Birth"
          type="date"
          {...register('date_of_birth')}
          error={errors.date_of_birth?.message}
        />

        <TextField
          label="Mobile"
          type="tel"
          {...register('mobile')}
          error={errors.mobile?.message}
          placeholder="10-digit mobile number"
        />

        <TextField
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="client@example.com"
        />

        <TextField
          label="Family Group"
          {...register('family_group')}
          error={errors.family_group?.message}
          placeholder="e.g. Sharma Family"
        />

        <div className="sm:col-span-2">
          <TextField
            label="Address"
            {...register('address')}
            error={errors.address?.message}
            placeholder="Full residential or business address"
          />
        </div>

        <div className="sm:col-span-2 flex flex-col gap-4 py-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">Operational Settings</h3>
          
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('active')}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="block text-sm font-medium text-gray-900">Active Client</span>
              <span className="block text-sm text-gray-500">Uncheck to mark the client as inactive and exclude from current workflows.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 mt-2">
            <input
              type="checkbox"
              {...register('follow_up_excluded')}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="block text-sm font-medium text-gray-900">Exclude from Follow-ups</span>
              <span className="block text-sm text-gray-500">Temporarily or permanently exclude this client from automated or manual follow-ups.</span>
            </div>
          </label>

          {followUpExcluded && (
            <div className="pl-7 mt-2">
              <TextField
                label="Exclusion Reason"
                {...register('exclusion_reason')}
                error={errors.exclusion_reason?.message}
                placeholder="Reason for exclusion..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </form>
  )
}
