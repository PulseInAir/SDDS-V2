import { getFilingQueueCases } from '@/lib/actions/cases';
import { FilingQueueFilters } from '@/components/cases/FilingQueueFilters';
import { CaseTable, FilingQueueCaseRow } from '@/components/cases/CaseTable';

export const metadata = {
  title: 'Filing Queue - SDDS',
};

export default async function FilingQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : '';
  const ay = typeof params.ay === 'string' ? params.ay : '';
  const status = typeof params.status === 'string' ? params.status : '';
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;

  const data = await getFilingQueueCases({
    search,
    ay_label: ay,
    status,
    page,
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Filing Queue</h1>
          <p className="text-sm text-text-muted mt-1">Manage active filing cases and track workflow progress.</p>
        </div>
        
        <FilingQueueFilters initialSearch={search} initialStatus={status} initialAy={ay} />
      </div>

      <div className="flex-1">
        <CaseTable cases={data.cases as unknown as FilingQueueCaseRow[]} page={data.page} totalPages={data.totalPages} />
      </div>
    </div>
  );
}
