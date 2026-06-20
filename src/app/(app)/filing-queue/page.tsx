import Link from 'next/link';
import { getFilingQueueCases } from '@/lib/actions/cases';
import { FilingQueueFilters } from '@/components/cases/FilingQueueFilters';
import { CaseTable, FilingQueueCaseRow } from '@/components/cases/CaseTable';
import { CaseBoard } from '@/components/cases/CaseBoard';

export const metadata = {
  title: 'Filing Queue - SDDS',
};

type FilingQueueSearchParams = {
  [key: string]: string | string[] | undefined;
};

function buildViewHref(
  params: FilingQueueSearchParams,
  view: 'table' | 'board',
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') query.set(key, value);
  });

  if (view === 'table') {
    query.delete('view');
  } else {
    query.set('view', view);
  }

  const queryString = query.toString();
  return queryString ? `/filing-queue?${queryString}` : '/filing-queue';
}

export default async function FilingQueuePage({
  searchParams,
}: {
  searchParams: Promise<FilingQueueSearchParams>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : '';
  const ay = typeof params.ay === 'string' ? params.ay : '';
  const scope = typeof params.scope === 'string' ? params.scope : '';
  const requestedPage =
    typeof params.page === 'string' ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const view = params.view === 'board' ? 'board' : 'table';
  const statusParam = typeof params.status === 'string' ? params.status : '';
  const status = statusParam === 'all'
    ? ''
    : (statusParam || (view === 'table' ? 'Filing Queue' : ''));

  const data = await getFilingQueueCases({
    search,
    ay_label: ay,
    status,
    scope,
    page,
  });
  const cases = data.cases as unknown as FilingQueueCaseRow[];

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Filing Queue
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage active filing cases and track workflow progress.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
          <FilingQueueFilters
            initialSearch={search}
            initialStatus={status}
            initialAy={ay}
          />

          <nav
            aria-label="Filing Queue view"
            className="inline-flex w-fit rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel p-1 shadow-sm"
          >
            <Link
              href={buildViewHref(params, 'table')}
              aria-current={view === 'table' ? 'page' : undefined}
              className={`rounded-[var(--radius-input)] px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'table'
                  ? 'bg-brand-600 text-white'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              Table
            </Link>
            <Link
              href={buildViewHref(params, 'board')}
              aria-current={view === 'board' ? 'page' : undefined}
              className={`rounded-[var(--radius-input)] px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'board'
                  ? 'bg-brand-600 text-white'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              Board
            </Link>
          </nav>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {view === 'board' ? (
          <CaseBoard
            cases={cases}
            page={data.page}
            totalPages={data.totalPages}
            statusFilter={status}
          />
        ) : (
          <CaseTable
            cases={cases}
            page={data.page}
            totalPages={data.totalPages}
          />
        )}
      </div>
    </div>
  );
}
