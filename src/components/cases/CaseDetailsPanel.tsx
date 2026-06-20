'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { updateFilingCaseDetails } from '@/lib/actions/cases';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CaseDetailsPanel({ filingCase }: { filingCase: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [returnCategory, setReturnCategory] = useState(filingCase?.return_category || '');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    filingCase?.expected_completion_date ? filingCase.expected_completion_date.split('T')[0] : ''
  );
  const [dueDate, setDueDate] = useState(
    filingCase?.due_date ? filingCase.due_date.split('T')[0] : ''
  );
  const [nextAction, setNextAction] = useState(filingCase?.next_action || '');
  const [blockerCode, setBlockerCode] = useState(filingCase?.blocker_code || '');
  const [blockerNote, setBlockerNote] = useState(filingCase?.blocker_note || '');
  const [followUpExcluded, setFollowUpExcluded] = useState(!!filingCase?.follow_up_excluded);

  if (!filingCase) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await updateFilingCaseDetails(filingCase.id, {
      return_category: returnCategory || null,
      expected_completion_date: expectedCompletionDate || null,
      due_date: dueDate || null,
      next_action: nextAction || null,
      blocker_code: blockerCode || null,
      blocker_note: blockerNote || null,
      follow_up_excluded: followUpExcluded,
    });

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setIsEditing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Case Details</h3>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm">
            Edit Details
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Return Category
              </label>
              <select
                value={returnCategory}
                onChange={(e) => setReturnCategory(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Not specified</option>
                <option value="ITR-1">ITR-1</option>
                <option value="ITR-2">ITR-2</option>
                <option value="ITR-3">ITR-3</option>
                <option value="ITR-4">ITR-4</option>
                <option value="ITR-5">ITR-5</option>
                <option value="ITR-6">ITR-6</option>
                <option value="ITR-7">ITR-7</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Expected Completion
              </label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Next Action
              </label>
              <input
                type="text"
                placeholder="e.g. Request form 16"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Blocker Code
              </label>
              <input
                type="text"
                placeholder="e.g. MISSING_DOCS"
                value={blockerCode}
                onChange={(e) => setBlockerCode(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Blocker Note
              </label>
              <input
                type="text"
                placeholder="Describe what is blocking the case"
                value={blockerNote}
                onChange={(e) => setBlockerNote(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="follow-up-excluded"
              type="checkbox"
              checked={followUpExcluded}
              onChange={(e) => setFollowUpExcluded(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="follow-up-excluded" className="ml-2 block text-sm text-gray-900">
              Exclude from follow-up queue
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Assessment Year</h3>
            <p className="text-sm font-medium text-gray-900">{filingCase.assessment_years?.label || 'N/A'}</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Current Status</h3>
            <div className="mt-1">
              <StatusBadge>{filingCase.case_status}</StatusBadge>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Return Category</h3>
            <p className="text-sm font-medium text-gray-900">{filingCase.return_category || 'Not specified'}</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Expected Completion</h3>
            <p className="text-sm font-medium text-gray-900">
              {filingCase.expected_completion_date 
                ? new Date(filingCase.expected_completion_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Not set'}
            </p>
          </div>
        </div>
      )}

      {!isEditing && filingCase.blocker_note && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-sm font-semibold text-red-800">Blocked: {filingCase.blocker_code || 'Attention Required'}</h3>
          <p className="text-sm text-red-700 mt-1">{filingCase.blocker_note}</p>
        </div>
      )}

      {!isEditing && filingCase.hold_reason && filingCase.case_status === 'On Hold' && (
        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <h3 className="text-sm font-semibold text-yellow-800">On Hold</h3>
          <p className="text-sm text-yellow-700 mt-1">{filingCase.hold_reason}</p>
          {filingCase.next_review_date && (
            <p className="text-xs text-yellow-600 mt-2">
              Review Date: {new Date(filingCase.next_review_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* History Timeline */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Status History</h3>
        {filingCase.case_status_history && filingCase.case_status_history.length > 0 ? (
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filingCase.case_status_history.map((event: any, eventIdx: number) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                     {eventIdx !== filingCase.case_status_history.length - 1 ? (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-500">
                            Changed to <span className="font-medium text-gray-900">{event.to_status}</span>
                          </p>
                          {event.reason && (
                            <p className="mt-1 text-sm text-gray-600 italic">&quot;{event.reason}&quot;</p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          {new Date(event.changed_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No transition history available.</p>
        )}
      </div>
    </div>
  );
}
