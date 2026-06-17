import { InvoiceCreateForm } from "@/components/invoices/InvoiceCreateForm";
import { InvoicePageContent } from "@/components/invoices/InvoicePageContent";
import { getInvoicesModuleData } from "@/lib/actions/invoices";

export const metadata = {
  title: "Invoices - SDDS",
};

type InvoicesSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<InvoicesSearchParams>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;

  const data = await getInvoicesModuleData({
    search: typeof params.search === "string" ? params.search : "",
    clientId: typeof params.clientId === "string" ? params.clientId : "",
    assessmentYearId: typeof params.assessmentYearId === "string" ? params.assessmentYearId : "",
    status: typeof params.status === "string" ? params.status : "",
    overdueOnly: params.overdueOnly === "true",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return (
    <div className="space-y-6">
      <InvoiceCreateForm clients={data.clients} assessmentYears={data.assessmentYears} />
      <InvoicePageContent data={data} basePath="/invoices" showClientFilter={true} />
    </div>
  );
}
