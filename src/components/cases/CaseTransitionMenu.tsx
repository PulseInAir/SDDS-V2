'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VALID_TRANSITIONS, CaseStatus } from '@/lib/constants/workflows';
import { transitionFilingCase } from '@/lib/actions/cases';

interface Props {
  caseId: string;
  currentStatus: CaseStatus;
}

export function CaseTransitionMenu({ caseId, currentStatus }: Props) {
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | ''>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (allowedNext.length === 0) return null;

  async function handleTransition(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStatus) return;
    setLoading(true);
    setError(null);

    const res = await transitionFilingCase(caseId, {
      toStatus: selectedStatus,
      reason: reason || undefined,
    });

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setSelectedStatus('');
      setReason('');
    }
  }

  const needsReason = selectedStatus && ['On Hold', 'Cancelled', 'Rectification Required'].includes(selectedStatus);

  return (
    <form onSubmit={handleTransition} className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-sm font-medium text-gray-900">Update Case Status</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="flex flex-col gap-3">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as CaseStatus)}
          className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 px-3 py-2 border"
          disabled={loading}
        >
          <option value="" disabled>Select next status...</option>
          {allowedNext.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {selectedStatus && (
          <textarea
            placeholder={needsReason ? "Reason for transition (required)" : "Optional note"}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 px-3 py-2 border"
            rows={needsReason ? 2 : 1}
            required={needsReason as boolean}
            disabled={loading}
          />
        )}

        <Button type="submit" disabled={!selectedStatus || loading} className="w-full justify-center">
          {loading ? 'Updating...' : 'Update Status'}
        </Button>
      </div>
    </form>
  );
}
