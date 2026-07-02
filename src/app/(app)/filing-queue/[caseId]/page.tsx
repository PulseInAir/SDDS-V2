import { getFilingCase } from '@/lib/actions/cases';
import { notFound } from 'next/navigation';
import { CaseDetailsPanel } from '@/components/cases/CaseDetailsPanel';
import { CaseTransitionMenu } from '@/components/cases/CaseTransitionMenu';
import Link from 'next/link';

export default async function FilingCaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = await params;
  const filingCase = await getFilingCase(resolvedParams.caseId);

  if (!filingCase) {
    notFound();
  }

  return (
    <div className="w-full space-y-8 py-4 sm:py-6">
      {/* Header */}
      <div>
        <nav className="sm:hidden" aria-label="Back">
          <Link href={`/clients/${filingCase.client_id}/filings`} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            ← Back to Filings
          </Link>
        </nav>
        <nav className="hidden sm:flex" aria-label="Breadcrumb">
          <ol role="list" className="flex flex-wrap items-center gap-2">
            <li>
              <div className="flex">
                <Link href="/filing-queue" className="text-sm font-medium text-gray-500 hover:text-gray-700">Filing Queue</Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-gray-400 mx-4">/</span>
                <Link href={`/clients/${filingCase.client_id}/filings`} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                  {filingCase.clients?.full_name}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-gray-400 mx-4">/</span>
                <span className="text-sm font-medium text-gray-900" aria-current="page">
                  {filingCase.assessment_years?.label} Case
                </span>
              </div>
            </li>
          </ol>
        </nav>
        <div className="mt-4 md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-normal text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {filingCase.clients?.full_name} - {filingCase.assessment_years?.label}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <CaseDetailsPanel filingCase={filingCase} />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <CaseTransitionMenu caseId={filingCase.id} currentStatus={filingCase.case_status} />
        </div>
      </div>
    </div>
  );
}
