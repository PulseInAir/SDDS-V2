import { StatusBadge } from '@/components/ui/StatusBadge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CaseDetailsPanel({ filingCase }: { filingCase: any }) {
  if (!filingCase) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Assessment Year</h3>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{filingCase.assessment_years?.label || 'N/A'}</p>
        </div>
        <div className="p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Current Status</h3>
          <div className="mt-1">
            <StatusBadge>{filingCase.case_status}</StatusBadge>
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Return Category</h3>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{filingCase.return_category || 'Not specified'}</p>
        </div>
        <div className="p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Expected Completion</h3>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {filingCase.expected_completion_date 
              ? new Date(filingCase.expected_completion_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Not set'}
          </p>
        </div>
      </div>

      {filingCase.blocker_note && (
        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">Blocked: {filingCase.blocker_code || 'Attention Required'}</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{filingCase.blocker_note}</p>
        </div>
      )}

      {filingCase.hold_reason && filingCase.case_status === 'On Hold' && (
        <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">On Hold</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{filingCase.hold_reason}</p>
          {filingCase.next_review_date && (
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
              Review Date: {new Date(filingCase.next_review_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* History Timeline */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Status History</h3>
        {filingCase.case_status_history && filingCase.case_status_history.length > 0 ? (
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filingCase.case_status_history.map((event: any, eventIdx: number) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {eventIdx !== filingCase.case_status_history.length - 1 ? (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center ring-8 ring-white dark:ring-gray-950">
                          <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Changed to <span className="font-medium text-gray-900 dark:text-gray-100">{event.to_status}</span>
                          </p>
                          {event.reason && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 italic">&quot;{event.reason}&quot;</p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
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
          <p className="text-sm text-gray-500 dark:text-gray-400">No transition history available.</p>
        )}
      </div>
    </div>
  );
}
