import { getClientFilingCases } from '@/lib/actions/cases';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';

export default async function FilingsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params;
  const cases = await getClientFilingCases(resolvedParams.clientId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-text-primary">Filing Cases</h2>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12 border border-border-subtle rounded-panel bg-surface-muted">
          <p className="text-sm text-text-secondary">No filing cases found for this client.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-border-subtle shadow-xs">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-surface-muted">
              <tr>
                <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider sm:pl-6">Assessment Year</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Category</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Next Action</th>
                <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-panel">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {cases.map((fc: any) => (
                <tr key={fc.id} className="hover:bg-surface-hover transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-text-primary sm:pl-6">
                    {fc.assessment_years?.label}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary">
                    <StatusBadge>{fc.case_status}</StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary">
                    {fc.return_category || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary">
                    {fc.next_action || '-'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-semibold sm:pr-6">
                    <Link href={`/filing-queue/${fc.id}`} className="text-brand-600 hover:text-brand-850">
                      View details<span className="sr-only">, {fc.assessment_years?.label}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

