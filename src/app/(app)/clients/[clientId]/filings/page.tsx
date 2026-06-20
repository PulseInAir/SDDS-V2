import { getClientFilingCases } from '@/lib/actions/cases';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';

export default async function FilingsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params;
  const cases = await getClientFilingCases(resolvedParams.clientId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Filing Cases</h2>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500">No filing cases found for this client.</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Assessment Year</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Next Action</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {cases.map((fc: any) => (
                <tr key={fc.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {fc.assessment_years?.label}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <StatusBadge>{fc.case_status}</StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {fc.return_category || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {fc.next_action || '-'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link href={`/filing-queue/${fc.id}`} className="text-blue-600 hover:text-blue-900">
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

