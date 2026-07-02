'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { JourneyPipeline } from "./JourneyPipeline";
import { CreateCaseStep } from "./steps/CreateCaseStep";
import { UploadITRVStep } from "./steps/UploadITRVStep";
import { ChargesStep } from "./steps/ChargesStep";
import { RefundTrackingStep } from "./steps/RefundTrackingStep";
import { InvoiceStep } from "./steps/InvoiceStep";
import { PaymentStep } from "./steps/PaymentStep";
import { PaymentFollowUpStep } from "./steps/PaymentFollowUpStep";
import { NextYearFollowUpStep } from "./steps/NextYearFollowUpStep";
import { getClientJourneyState } from "@/lib/actions/journey";

import { 
  User, 
  ArrowLeft, 
  CalendarDays, 
  Shield, 
  Loader2, 
  TrendingUp, 
  CheckCircle,
  HelpCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MaskedValue } from "@/components/ui/MaskedValue";
import { useAppContext } from "@/contexts/AppContext";

interface ClientJourneyPageProps {
  clientId: string;
  initialJourneyData: any;
  assessmentYears: { id: string; label: string; is_current: boolean }[];
  clientsOptions: any[];
  ayOptions: any[];
  invoiceSettings: any;
}

export function ClientJourneyPage({
  clientId,
  initialJourneyData,
  assessmentYears,
  clientsOptions,
  ayOptions,
  invoiceSettings,
}: ClientJourneyPageProps) {
  const router = useRouter();
  const { isPrivacyMode } = useAppContext();
  
  const [journeyData, setJourneyData] = useState(initialJourneyData);
  const [selectedAyId, setSelectedAyId] = useState(initialJourneyData.selectedAyId);
  const [selectedStepId, setSelectedStepId] = useState<any>(initialJourneyData.state.currentStepId || "case_created");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Re-fetch journey state whenever AY changes
  useEffect(() => {
    if (selectedAyId !== journeyData.selectedAyId) {
      handleRefresh(selectedAyId);
    }
  }, [selectedAyId]);

  // Auto-extraction trigger:
  // If we just uploaded an ITR-V (filing record exists) but case charges are null,
  // we automatically run extraction in the background!
  useEffect(() => {
    const caseRecord = journeyData.filingCase;
    const filings = journeyData.state.steps.find((s: any) => s.id === "filed")?.data;
    const chargesSet = journeyData.state.steps.find((s: any) => s.id === "charges")?.status === "done";
    
    // Find if there is a pending ITR-V PDF to extract
    if (caseRecord && filings && !chargesSet && !isExtracting) {
      // Find the latest document of type "ITR-V" for this client and AY
      // We can run an auto-extract by fetching client documents and matching
      fetchClientItrvAndExtract(caseRecord.id);
    }
  }, [journeyData]);

  async function fetchClientItrvAndExtract(caseId: string) {
    setIsExtracting(true);
    try {
      // Let's call the API to find client ITR-V documents
      const docsRes = await fetch(`/api/documents?clientId=${clientId}&assessmentYearId=${selectedAyId}`);
      if (docsRes.ok) {
        const docs = await docsRes.json();
        // Look for checklist_status/type = 'ITR-V'
        const itrvDoc = (docs.data || []).find((d: any) => d.document_type === "ITR-V" && !d.archived_at);
        if (itrvDoc) {
          console.log("[Auto Extract] Found ITR-V document, launching extractor...", itrvDoc.id);
          const extractRes = await fetch(`/api/documents/${itrvDoc.id}/extract`, { method: "POST" });
          if (extractRes.ok) {
            const extractData = await extractRes.json();
            if (extractData.success && extractData.data) {
              const { itrForm, refundAmount } = extractData.data;
              console.log("[Auto Extract] Extracted fields successfully:", { itrForm, refundAmount });
              // Charges will auto-fill from here, let's refresh to show Step 3 as current with these extracted defaults!
              await handleRefresh(selectedAyId);
              setSelectedStepId("charges");
            }
          }
        }
      }
    } catch (e) {
      console.error("[Auto Extract] Failed to extract:", e);
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleRefresh(ayId: string = selectedAyId) {
    setIsRefreshing(true);
    const res = await getClientJourneyState(clientId, ayId);
    setIsRefreshing(false);
    
    if (res.success && res.state) {
      setJourneyData(res);
      setSelectedStepId(res.state.currentStepId || "case_created");
    }
  }

  if (!journeyData.success) {
    return (
      <div className="p-8 text-center bg-[#0a0a0c] min-h-[80vh] flex flex-col items-center justify-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-text-primary">Filing Case Error</h3>
        <p className="text-sm text-text-muted mt-1 max-w-sm">{journeyData.error}</p>
        <Link href="/clients" className="mt-4 text-xs font-semibold text-brand-400 hover:underline">
          Back to Clients List
        </Link>
      </div>
    );
  }

  const { client, filingCase, state } = journeyData;
  const currentStep = state.steps.find((s: any) => s.id === selectedStepId);

  // Retrieve files/docs to show inside Step 2 if uploaded
  const itrvStepData = state.steps.find((s: any) => s.id === "filed")?.data;

  // Extract variables for each step component
  const hasFilingCase = !!filingCase;
  const isFiled = state.steps.find((s: any) => s.id === "filed")?.status === "done";
  const isChargesSaved = state.steps.find((s: any) => s.id === "charges")?.status === "done";
  const activeInvoice = state.steps.find((s: any) => s.id === "invoice")?.data;
  const activeRefund = state.steps.find((s: any) => s.id === "refund")?.data;
  const activeFollowup = state.steps.find((s: any) => s.id === "next_ay_followup")?.data;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#0a0a0c] text-text-primary pb-12 overflow-hidden">
      
      {/* Immersive mesh radial orbs */}
      <div className="absolute top-[5%] left-[10%] w-[35rem] h-[35rem] bg-brand-600/5 rounded-full blur-[110px] animate-pulse pointer-events-none" style={{ animationDuration: "10s" }} />
      <div className="absolute bottom-[5%] right-[10%] w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-[130px] animate-pulse pointer-events-none" style={{ animationDuration: "14s" }} />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 border-b border-border-subtle bg-surface-panel/30 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            href={`/clients/${clientId}`}
            className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-text-primary">{client.full_name}</h1>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-brand-950/40 text-brand-400 border border-brand-500/20 uppercase">
                PAN: <MaskedValue value={client.pan_uppercase} isPrivacyMode={isPrivacyMode} />
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">Mobile: <MaskedValue value={client.mobile || "N/A"} isPrivacyMode={isPrivacyMode} /></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Assessment Year Selector */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-text-muted" />
            <select
              value={selectedAyId}
              onChange={(e) => setSelectedAyId(e.target.value)}
              className="h-9 cursor-pointer rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-xs font-semibold text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            >
              {assessmentYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  AY {ay.label} {ay.is_current ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <Link
            href={`/clients/${clientId}`}
            className="h-9 px-3 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel hover:bg-surface-hover text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" /> Backend Profile
          </Link>
        </div>
      </div>

      {/* Main content grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visual timeline and Expanded step detail */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 8-Step pipeline map */}
          <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel/40 backdrop-blur-md p-4 shadow-sm relative overflow-hidden">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider px-2 mb-2">Filing Pipeline Status</h2>
            <JourneyPipeline
              steps={state.steps}
              currentStepId={selectedStepId}
              onStepClick={(id) => setSelectedStepId(id)}
            />
          </div>

          {/* Glowing scanner animation if auto-extracting */}
          {isExtracting && (
            <div className="rounded-[var(--radius-panel)] border border-blue-500/30 bg-blue-950/10 p-8 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              {/* Glowing animated line */}
              <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent top-0 animate-[bounce_3s_infinite]" />
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
              <h3 className="text-base font-bold text-blue-400">Scanning uploaded ITR-V PDF...</h3>
              <p className="text-xs text-text-muted mt-1 max-w-xs leading-normal">
                Gemini AI is parsing the return category, PAN, and refund claimed amount.
              </p>
            </div>
          )}

          {/* Step Detail Card */}
          {currentStep && !isExtracting && (
            <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel/40 backdrop-blur-md p-6 shadow-sm min-h-[250px] flex flex-col justify-between relative overflow-hidden group">
              
              {/* Highlight accent on active card top border */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                currentStep.status === "done" 
                  ? "bg-emerald-500" 
                  : currentStep.status === "current" 
                  ? "bg-blue-500" 
                  : "bg-neutral-800"
              }`} />

              <div className="space-y-6">
                {/* Step badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold font-mono tracking-widest uppercase px-2 py-0.5 rounded-full ${
                    currentStep.status === "done"
                      ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                      : currentStep.status === "current"
                      ? "bg-blue-950/40 text-blue-400 border border-blue-500/20"
                      : "bg-neutral-900 text-neutral-500 border border-neutral-800"
                  }`}>
                    Step: {currentStep.label}
                  </span>
                  
                  {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
                </div>

                {/* Render corresponding form/content */}
                {selectedStepId === "case_created" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">Filing Case Initialized</h3>
                      <p className="text-sm text-text-muted mt-0.5">
                         Filer case setup for Assessment Year {ayOptions.find(o => o.id === selectedAyId)?.label || "current"}.
                      </p>
                    </div>
                    {filingCase ? (
                      <div className="p-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel/20 text-sm space-y-2 max-w-sm">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Case ID</span>
                          <span className="font-mono text-text-secondary">{filingCase.id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Opened At</span>
                          <span className="text-text-secondary">{new Date(filingCase.created_at).toLocaleDateString()}</span>
                        </div>
                        {filingCase.return_category && (
                          <div className="flex justify-between">
                            <span className="text-text-muted">Selected ITR Category</span>
                            <span className="font-semibold text-brand-400">{filingCase.return_category}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <CreateCaseStep
                        clientId={clientId}
                        selectedAyId={selectedAyId}
                        assessmentYears={ayOptions}
                        onComplete={() => handleRefresh()}
                      />
                    )}
                  </div>
                )}

                {selectedStepId === "filed" && (
                  <UploadITRVStep
                    clientId={clientId}
                    selectedAyId={selectedAyId}
                    existingItrvDoc={itrvStepData ? { id: "", original_filename: itrvStepData.ackNumber } : null}
                    onComplete={() => handleRefresh()}
                  />
                )}

                {selectedStepId === "charges" && (
                  <ChargesStep
                    caseId={filingCase?.id || ""}
                    clientId={clientId}
                    rateCard={invoiceSettings?.rate_card || {}}
                    refundChargePercentage={invoiceSettings?.refund_charge_percentage || 10}
                    defaultItrForm={filingCase?.return_category || "ITR-1"}
                    initialRefundClaimed={filingCase?.refund_claimed_amount || 0}
                    initialItrCharges={filingCase?.itr_filing_charges || undefined}
                    initialRefundCharges={filingCase?.refund_claim_charges || undefined}
                    onComplete={() => handleRefresh()}
                  />
                )}

                {selectedStepId === "refund" && (
                  <RefundTrackingStep
                    caseId={filingCase?.id || ""}
                    clientId={clientId}
                    expectedAmount={filingCase?.refund_claimed_amount || 0}
                    initialStatus={activeRefund?.status || "Pending"}
                    initialReceivedAmount={activeRefund?.receivedAmount || undefined}
                    initialReceivedDate={activeRefund?.receivedDate || undefined}
                    onComplete={() => handleRefresh()}
                  />
                )}

                {selectedStepId === "invoice" && (
                  <InvoiceStep
                    clientId={clientId}
                    selectedAyId={selectedAyId}
                    clientsOptions={clientsOptions}
                    ayOptions={ayOptions}
                    invoiceSettings={invoiceSettings}
                    existingInvoice={activeInvoice ? {
                      id: activeInvoice.invoiceId,
                      invoice_number: activeInvoice.invoiceNumber,
                      status: activeInvoice.status,
                      total_amount: activeInvoice.totalAmount,
                      balance_amount: activeInvoice.balanceAmount,
                    } : null}
                    onComplete={() => setSelectedStepId("payment")}
                  />
                )}

                {selectedStepId === "payment" && (
                  <PaymentStep
                    clientId={clientId}
                    invoiceId={activeInvoice?.invoiceId || ""}
                    balanceAmount={activeInvoice?.balanceAmount || 0}
                    onComplete={() => handleRefresh()}
                  />
                )}

                {selectedStepId === "payment_followup" && (
                  <PaymentFollowUpStep
                    clientId={clientId}
                    caseId={filingCase?.id || ""}
                    clientMobile={client.mobile}
                    clientName={client.full_name}
                    balanceAmount={activeInvoice?.balanceAmount || 0}
                    invoiceNumber={activeInvoice?.invoiceNumber || ""}
                    onComplete={() => setSelectedStepId("payment")}
                  />
                )}

                {selectedStepId === "next_ay_followup" && (
                  <NextYearFollowUpStep
                    clientId={clientId}
                    nextAyLabel={state.steps.find((s: any) => s.id === "next_ay_followup")?.data?.nextAyLabel || null}
                    existingFollowup={activeFollowup ? {
                      id: "",
                      status: activeFollowup.status,
                      due_date: activeFollowup.due_date || null,
                    } : null}
                  />
                )}
              </div>

              {/* Step instructions */}
              <div className="mt-8 border-t border-border-subtle pt-4 text-xs text-text-muted flex justify-between items-center font-mono uppercase tracking-wider">
                <span>Selected: {currentStep.label}</span>
                <span className={
                  currentStep.status === "done" 
                    ? "text-emerald-400" 
                    : currentStep.status === "current" 
                    ? "text-blue-400 animate-pulse" 
                    : "text-text-muted"
                }>
                  Status: {currentStep.status}
                </span>
              </div>

            </div>
          )}

        </div>

        {/* Right Column (Sidebar): Vertical timeline tracker */}
        <div className="space-y-6">
          <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel/40 backdrop-blur-md p-5 shadow-sm">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Journey Checklist</h2>
            
            <div className="flow-root">
              <ul className="-mb-8">
                {state.steps.map((step: any, stepIdx: number) => {
                  const isSelected = step.id === selectedStepId;
                  const isDone = step.status === "done";
                  const isCurrent = step.status === "current";
                  const isSkipped = step.status === "skipped";

                  return (
                    <li key={step.id}>
                      <div className="relative pb-8">
                        {stepIdx !== state.steps.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-800" aria-hidden="true" />
                        )}
                        
                        <button
                          onClick={() => {
                            if (step.status !== "future") {
                              setSelectedStepId(step.id);
                            }
                          }}
                          disabled={step.status === "future"}
                          className={`relative flex items-start group focus:outline-none w-full text-left transition-all ${
                            step.status === "future" ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          <span className="flex h-9 items-center">
                            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                              isSelected
                                ? "border-blue-500 bg-blue-950/60 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                : isDone
                                ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                                : isSkipped
                                ? "border-neutral-800 bg-neutral-900/40 text-neutral-500"
                                : "border-neutral-800 bg-neutral-950 text-neutral-600 group-hover:border-neutral-700"
                            }`}>
                              {isDone ? (
                                <CheckCircle className="h-4 w-4 stroke-[2.5]" />
                              ) : (
                                <span className="text-xs font-bold font-mono">{stepIdx + 1}</span>
                              )}
                            </span>
                          </span>

                          <span className="ml-4 flex min-w-0 flex-col pt-0.5">
                            <span className={`text-xs font-bold transition-colors ${
                              isSelected 
                                ? "text-blue-400" 
                                : isDone 
                                ? "text-text-primary" 
                                : isSkipped 
                                ? "text-neutral-500 line-through" 
                                : "text-text-muted group-hover:text-text-primary"
                            }`}>
                              {step.label}
                            </span>
                            
                            {/* Short contextual descriptions */}
                            <span className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
                              {isDone && step.id === "filed" && `Filed on ${new Date(step.data.filingDate).toLocaleDateString()}`}
                              {isDone && step.id === "charges" && `Total charges: ₹${step.data.totalEstimated.toLocaleString()}`}
                              {isDone && step.id === "invoice" && `Invoice: ${step.data.invoiceNumber}`}
                              {isDone && step.id === "payment" && "Billed fees fully collected"}
                              {isCurrent && "Awaiting action..."}
                              {step.status === "future" && "Locked"}
                              {isSkipped && "Skipped/Satisfied"}
                            </span>
                          </span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
