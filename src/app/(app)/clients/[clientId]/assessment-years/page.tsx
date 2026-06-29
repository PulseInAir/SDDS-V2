import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getClientById } from '@/lib/actions/clients';
import { getClientAssessmentYearsWithCases } from '@/lib/actions/cases';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CreateCaseForm } from '@/components/cases/CreateCaseForm';

export default async function ClientAssessmentYearsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const [client, { years, cases }] = await Promise.all([
    getClientById(clientId),
    getClientAssessmentYearsWithCases(clientId),
  ]);

  if (!client) {
    notFound();
  }

  const caseByAy = new Map(cases.map((c) => [c.assessment_year_id, c]));

  // AYs that are open and have no case yet — available for case creation
  const openYearsWithoutCase = years.filter(
    (ay) => ay.is_open && !caseByAy.has(ay.id),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Assessment Years
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            One filing case per assessment year. Use the Filing Queue to work the case.
          </p>
        </div>
      </div>
 
      {/* Create new case */}
      {openYearsWithoutCase.length > 0 && (
        <div className="rounded-panel border border-brand-200 bg-brand-50/50 p-4 shadow-xs">
          <CreateCaseForm clientId={clientId} openYears={openYearsWithoutCase} />
        </div>
      )}
 
      {/* AY grid */}
      {years.length === 0 ? (
        <div className="text-center py-12 border border-border-subtle rounded-panel bg-surface-muted">
          <p className="text-sm text-text-secondary">
            No assessment years configured yet.{' '}
            <Link href="/settings" className="text-brand-600 hover:underline">
              Add one in Settings.
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-border-subtle shadow-xs">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-surface-muted">
              <tr>
                <th
                  scope="col"
                  className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider sm:pl-6"
                >
                  Assessment Year
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                >
                  AY State
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                >
                  Case Status
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                >
                  Next Action
                </th>
                <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-panel">
              {years.map((ay) => {
                const filingCase = caseByAy.get(ay.id);
                return (
                  <tr key={ay.id} className="hover:bg-surface-hover transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-text-primary sm:pl-6">
                      {ay.label}
                      {ay.is_current && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-850">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary">
                      {ay.is_open ? (
                        <StatusBadge variant="success">Open</StatusBadge>
                      ) : (
                        <StatusBadge variant="neutral">Closed</StatusBadge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary">
                      {filingCase ? (
                        <StatusBadge>{filingCase.case_status}</StatusBadge>
                      ) : (
                        <span className="text-text-muted italic text-xs">
                          No case
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-text-secondary max-w-xs truncate">
                      {filingCase?.next_action ?? '—'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-semibold sm:pr-6">
                      {filingCase ? (
                        <Link
                          href={`/filing-queue/${filingCase.id}`}
                          className="text-brand-600 hover:text-brand-850"
                        >
                          Open case
                          <span className="sr-only">, {ay.label}</span>
                        </Link>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
