export default async function ClientAssessmentYearsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-medium text-gray-900">Assessment Years</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        This module will display all cases and statuses for the selected client across different assessment years. Client ID: {resolvedParams.clientId}
      </p>
    </div>
  )
}
