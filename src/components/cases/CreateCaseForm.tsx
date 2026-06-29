'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { createFilingCaseAction } from '@/lib/actions/cases';

interface Props {
  clientId: string;
  openYears: Array<{ id: string; label: string }>;
}

export function CreateCaseForm({ clientId, openYears }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedAyId, setSelectedAyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedAyId) {
      setError('Please select an assessment year.');
      return;
    }
    startTransition(async () => {
      const result = await createFilingCaseAction(clientId, selectedAyId);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
        setSelectedAyId('');
        if (result.caseId) {
          router.push(`/filing-queue/${result.caseId}`);
        }
      }
    });
  }

  if (openYears.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 min-w-0">
        <label htmlFor="create-case-ay" className="block text-sm font-medium text-text-secondary mb-1">
          Open a new case for
        </label>
        <select
          id="create-case-ay"
          value={selectedAyId}
          onChange={(e) => setSelectedAyId(e.target.value)}
          className="block w-full rounded-input border border-border-subtle bg-surface-panel px-3 py-2 text-sm text-text-primary shadow-xs outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
        >
          <option value="">Select assessment year…</option>
          {openYears.map((ay) => (
            <option key={ay.id} value={ay.id}>
              {ay.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending || !selectedAyId}
        className="inline-flex items-center justify-center rounded-input bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-10"
      >
        {isPending ? 'Creating…' : 'Create Case'}
      </button>
      {error && (
        <p className="mt-1 text-sm text-red-600 absolute">{error}</p>
      )}
      {success && (
        <p className="mt-1 text-sm text-green-600 absolute">{success}</p>
      )}
    </form>
  );
}
