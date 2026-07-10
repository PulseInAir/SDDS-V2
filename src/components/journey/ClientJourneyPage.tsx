'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { JourneyPipeline } from "./JourneyPipeline";
import { JourneyStepHeader } from "./JourneyStepHeader";
import { ClientStatusStep } from "./steps/ClientStatusStep";
import { UploadITRVStep } from "./steps/UploadITRVStep";
import { ChargesStep } from "./steps/ChargesStep";
import { RefundTrackingStep } from "./steps/RefundTrackingStep";
import { InvoiceStep } from "./steps/InvoiceStep";
import { PaymentStep } from "./steps/PaymentStep";
import { PaymentFollowUpStep } from "./steps/PaymentFollowUpStep";
import { NextYearFollowUpStep } from "./steps/NextYearFollowUpStep";
import { ClientForm } from "@/components/clients/ClientForm";
import { CredentialsManager } from "@/components/clients/CredentialsManager";
import { getClientJourneyState } from "@/lib/actions/journey";
import { createFilingCaseAction } from "@/lib/actions/cases";
import { motion, AnimatePresence } from "framer-motion";


import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  User,
  KeyRound,
  CalendarDays,
  FolderOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { MaskedValue } from "@/components/ui/MaskedValue";
import { useAppContext } from "@/contexts/AppContext";

// ─── 5-Step Model ───────────────────────────────────────────────────────────
type GuidedStepId = "new_client" | "client_status" | "invoice" | "payment" | "next_ay";

interface GuidedStep {
  id: GuidedStepId;
  label: string;
  status: "done" | "current" | "future" | "skipped";
}

// Map the old 8-step journey state into the new 5-step model
function resolveGuidedSteps(state: any, filingCase: any): GuidedStep[] {
  const oldSteps = state.steps || [];
  const getOldStep = (id: string) => oldSteps.find((s: any) => s.id === id);

  const caseStep = getOldStep("case_created");
  const filedStep = getOldStep("filed");
  const chargesStep = getOldStep("charges");
  const refundStep = getOldStep("refund");
  const invoiceStep = getOldStep("invoice");
  const paymentStep = getOldStep("payment");
  const paymentFollowupStep = getOldStep("payment_followup");
  const nextAyStep = getOldStep("next_ay_followup");

  // Step 1: New Client — done when case exists
  const step1Done = caseStep?.status === "done";

  // Step 2: Client Status — done when status is "Filed"
  const step2Done = filingCase?.case_status === "Filed";

  // Step 3: Invoice — done when invoice is created
  const invoiceDone = invoiceStep?.status === "done";
  // Also check if charges + upload are done
  const chargesDone = chargesStep?.status === "done";

  // Step 4: Payment — done when payment is done
  const paymentDone = paymentStep?.status === "done";

  // Step 5: Next AY — done when follow-up is scheduled
  const nextAyDone = nextAyStep?.status === "done";

  const getStatus = (isDone: boolean, prevDone: boolean): "done" | "current" | "future" => {
    if (isDone) return "done";
    if (prevDone) return "current";
    return "future";
  };

  return [
    {
      id: "new_client",
      label: "New Client",
      status: getStatus(step1Done, true), // always accessible
    },
    {
      id: "client_status",
      label: "Client Status",
      status: getStatus(step2Done, step1Done),
    },
    {
      id: "invoice",
      label: "Invoice",
      status: getStatus(invoiceDone, step2Done),
    },
    {
      id: "payment",
      label: "Payment",
      status: getStatus(paymentDone, invoiceDone),
    },
    {
      id: "next_ay",
      label: "Next AY",
      status: getStatus(nextAyDone, paymentDone),
    },
  ];
}

function resolveCurrentGuidedStep(steps: GuidedStep[]): GuidedStepId {
  const current = steps.find(s => s.status === "current");
  if (current) return current.id;
  // If all done, show last
  if (steps.every(s => s.status === "done" || s.status === "skipped")) return "next_ay";
  return "new_client";
}

// ─── Component ──────────────────────────────────────────────────────────────

interface ClientJourneyPageProps {
  clientId: string;
  initialJourneyData: any;
  assessmentYears: { id: string; label: string; is_current: boolean }[];
  clientsOptions: any[];
  ayOptions: any[];
  invoiceSettings: any;
  clientFormData?: any;
  hasCredential?: boolean;
}

export function ClientJourneyPage({
  clientId,
  initialJourneyData,
  assessmentYears,
  clientsOptions,
  ayOptions,
  invoiceSettings,
  clientFormData,
  hasCredential = false,
}: ClientJourneyPageProps) {
  const router = useRouter();
  const { isPrivacyMode } = useAppContext();
  
  const [journeyData, setJourneyData] = useState(initialJourneyData);
  const [selectedAyId, setSelectedAyId] = useState(initialJourneyData.selectedAyId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Compute the 5-step model
  const guidedSteps = resolveGuidedSteps(journeyData.state || { steps: [] }, journeyData.filingCase);
  const [selectedStepId, setSelectedStepId] = useState<GuidedStepId>(
    resolveCurrentGuidedStep(guidedSteps)
  );

  // Section collapse states for Step 1
  const [showIdentity, setShowIdentity] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [isCreatingCase, setIsCreatingCase] = useState(false);

  const handleCreateCase = async () => {
    setIsCreatingCase(true);
    const res = await createFilingCaseAction(clientId, selectedAyId);
    setIsCreatingCase(false);
    if (res.success) {
      handleRefresh(selectedAyId).then(() => goToStep("client_status"));
    } else {
      alert(res.error || "Failed to create case.");
    }
  };



  // Re-fetch journey state whenever AY changes
  useEffect(() => {
    if (selectedAyId !== journeyData.selectedAyId) {
      handleRefresh(selectedAyId);
    }
  }, [selectedAyId]);

  // Auto-extraction trigger
  useEffect(() => {
    const caseRecord = journeyData.filingCase;
    const filings = journeyData.state?.steps?.find((s: any) => s.id === "filed")?.data;
    const chargesSet = journeyData.state?.steps?.find((s: any) => s.id === "charges")?.status === "done";
    
    if (caseRecord && filings && !chargesSet && !isExtracting) {
      fetchClientItrvAndExtract(caseRecord.id);
    }
  }, [journeyData]);

  async function fetchClientItrvAndExtract(caseId: string) {
    setIsExtracting(true);
    try {
      const docsRes = await fetch(`/api/documents?clientId=${clientId}&assessmentYearId=${selectedAyId}`);
      if (docsRes.ok) {
        const docs = await docsRes.json();
        const itrvDoc = (docs.data || []).find((d: any) => d.document_type === "ITR-V" && !d.archived_at);
        if (itrvDoc) {
          const extractRes = await fetch(`/api/documents/${itrvDoc.id}/extract`, { method: "POST" });
          if (extractRes.ok) {
            const extractData = await extractRes.json();
            if (extractData.success && extractData.data) {
              await handleRefresh(selectedAyId);
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
      // Update current step after refresh
      const newGuidedSteps = resolveGuidedSteps(res.state, res.filingCase);
      const newCurrent = resolveCurrentGuidedStep(newGuidedSteps);
      setSelectedStepId(newCurrent);
    }
  }

  // Navigate to next guided step
  function goToNextStep() {
    const idx = guidedSteps.findIndex(s => s.id === selectedStepId);
    if (idx < guidedSteps.length - 1) {
      setSelectedStepId(guidedSteps[idx + 1].id);
    }
  }

  function goToStep(stepId: GuidedStepId) {
    setSelectedStepId(stepId);
  }

  if (!journeyData.success) {
    return (
      <div className="p-8 text-center bg-[#050505] min-h-[80vh] flex flex-col items-center justify-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-white">Filing Case Error</h3>
        <p className="text-sm text-neutral-400 mt-1 max-w-sm">{journeyData.error}</p>
        <Link href="/clients" className="mt-4 text-xs font-semibold text-amber-500 hover:underline">
          Back to Clients List
        </Link>
      </div>
    );
  }

  const { client, filingCase, state } = journeyData;

  // Old step data accessors (still used by substep components)
  const itrvStepData = state.steps.find((s: any) => s.id === "filed")?.data;
  const activeInvoice = state.steps.find((s: any) => s.id === "invoice")?.data;
  const activeRefund = state.steps.find((s: any) => s.id === "refund")?.data;
  const activeFollowup = state.steps.find((s: any) => s.id === "next_ay_followup")?.data;

  const currentGuidedStep = guidedSteps.find(s => s.id === selectedStepId);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 40, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
    exit: { opacity: 0, y: -40, scale: 1.05, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#030303] text-white overflow-x-hidden selection:bg-amber-500/30">
      
      {/* Cinematic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[40rem] h-[40rem] bg-amber-600/5 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[10%] right-[10%] w-[50rem] h-[50rem] bg-orange-600/5 rounded-full blur-[150px] animate-[pulse_12s_ease-in-out_infinite_alternate]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Cinematic Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#030303]/60 backdrop-blur-xl"
      >
        {/* Top bar: client info + AY selector */}
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/clients"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 hover:border-amber-500/50 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-light tracking-wide text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {client.full_name}
                </h1>
                <span className="text-[10px] font-medium font-mono px-3 py-1 rounded-full bg-amber-950/30 text-amber-400 border border-amber-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                  PAN: <MaskedValue value={client.pan_uppercase} isPrivacyMode={isPrivacyMode} />
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedAyId}
              onChange={(e) => setSelectedAyId(e.target.value)}
              className="h-10 cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 text-xs font-medium text-white/80 shadow-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all hover:bg-white/10 appearance-none pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px' }}
            >
              {assessmentYears.map((ay) => (
                <option key={ay.id} value={ay.id} className="bg-neutral-900 text-white">
                  AY {ay.label} {ay.is_current ? "(Current)" : ""}
                </option>
              ))}
            </select>
            {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-amber-400" />}
          </div>
        </div>

        {/* Step header — replaces old tab bar */}
        <div className="pb-3">
          <JourneyStepHeader
            steps={guidedSteps}
            currentStepId={selectedStepId}
            onStepClick={(id) => setSelectedStepId(id as GuidedStepId)}
          />
        </div>
      </motion.div>

      {/* Side HUD */}
      <JourneyPipeline
        steps={guidedSteps}
        currentStepId={selectedStepId}
        onStepClick={(id) => setSelectedStepId(id as GuidedStepId)}
      />

      {/* Main Cinematic Viewport */}
      <main className="relative z-10 w-full min-h-screen pt-40 pb-24 px-8 flex flex-col items-center justify-start">
        
        {isExtracting ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl aspect-video rounded-3xl border border-amber-500/20 bg-[#0a0700]/80 backdrop-blur-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.05)]"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
            <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <h3 className="text-2xl font-light text-amber-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Extracting ITR-V Intelligence</h3>
            <p className="text-sm text-amber-500/60 mt-3 max-w-sm text-center uppercase tracking-widest font-mono">
              Parsing AI structures • Matching variables
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {currentGuidedStep && (
              <motion.div
                key={selectedStepId}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full max-w-4xl"
              >
                {/* Step title area — no step numbers */}
                <div className="mb-8 text-center flex flex-col items-center">
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl md:text-6xl font-light text-white mb-2" 
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {currentGuidedStep.label}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-white/40 tracking-wider uppercase font-mono mt-2 flex items-center gap-2"
                  >
                    Status: 
                    <span className={
                      currentGuidedStep.status === "done" 
                        ? "text-emerald-400" 
                        : currentGuidedStep.status === "current" 
                        ? "text-amber-400 animate-pulse" 
                        : "text-white/40"
                    }>
                      {currentGuidedStep.status}
                    </span>
                  </motion.p>
                </div>

                {/* Glassmorphic Content Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group hover:border-amber-500/20 transition-colors duration-700"
                >
                  {/* Glassmorphic lighting effect */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-amber-500/20 transition-colors duration-1000" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-1000" />

                  <div className="relative z-10 w-full">

                    {/* ════════════════════════════════════════════════════════════════
                        STEP 1 — NEW CLIENT
                        Subsumes: Identity Profile + Assessment Years + Credentials
                    ════════════════════════════════════════════════════════════════ */}
                    {selectedStepId === "new_client" && (
                      <div className="space-y-8">
                        <p className="text-base text-white/60 font-light leading-relaxed max-w-lg mx-auto text-center">
                          Activate this client for Assessment Year {ayOptions.find(o => o.id === selectedAyId)?.label || "current"}. Review identity, credentials, and create or open the filing case.
                        </p>

                        {/* Identity Profile Section */}
                        <div className="border border-white/5 rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setShowIdentity(!showIdentity)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <User className="h-4 w-4 text-amber-400" />
                              </div>
                              <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">Identity Profile</span>
                            </div>
                            {showIdentity ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                          </button>
                          {showIdentity && clientFormData && (
                            <div className="p-6 border-t border-white/5">
                              <ClientForm client={clientFormData} isEdit={true} />
                            </div>
                          )}
                          {showIdentity && !clientFormData && (
                            <div className="p-6 border-t border-white/5 text-center text-sm text-white/40">
                              <p>Client identity data is displayed on the profile page.</p>
                              <Link href={`/clients/${clientId}/profile`} className="text-amber-400 hover:underline mt-2 inline-block text-xs">
                                Open Identity Profile →
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* Credentials Section */}
                        <div className="border border-white/5 rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setShowCredentials(!showCredentials)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <KeyRound className="h-4 w-4 text-amber-400" />
                              </div>
                              <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">Portal Credentials</span>
                            </div>
                            {showCredentials ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                          </button>
                          {showCredentials && (
                            <div className="p-6 border-t border-white/5">
                              <CredentialsManager clientId={clientId} hasExisting={hasCredential} />
                            </div>
                          )}
                        </div>

                        {/* Assessment Year & Case Action */}
                        <div className="border border-white/5 rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                              <CalendarDays className="h-4 w-4 text-amber-400" />
                            </div>
                            <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">Assessment Year & Case</span>
                          </div>

                          <div className="flex items-center gap-4 mb-6">
                            <select
                              value={selectedAyId}
                              onChange={(e) => setSelectedAyId(e.target.value)}
                              className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/80 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                            >
                              {assessmentYears.map((ay) => (
                                <option key={ay.id} value={ay.id} className="bg-neutral-900 text-white">
                                  AY {ay.label} {ay.is_current ? "(Current)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          {filingCase ? (
                            <div className="space-y-4">
                              <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                                    <FolderOpen className="h-4 w-4 text-emerald-400" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Case Exists</p>
                                    <p className="text-sm text-white/60 mt-0.5">Case ID: {filingCase.id.slice(0, 8)}...</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-white/40 text-xs font-mono">Status</span>
                                    <p className="text-white/80 font-medium">{filingCase.case_status}</p>
                                  </div>
                                  <div>
                                    <span className="text-white/40 text-xs font-mono">Category</span>
                                    <p className="text-white/80 font-medium">{filingCase.return_category || "—"}</p>
                                  </div>
                                </div>
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => goToStep("client_status")}
                                className="w-full py-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-medium tracking-widest uppercase text-[11px] hover:bg-amber-500 hover:text-black transition-all"
                              >
                                Open Case →
                              </motion.button>
                            </div>
                          ) : (
                            <div className="w-full">
                              <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-white/5 bg-white/[0.02]">
                                <p className="text-white/60 text-sm mb-6 text-center max-w-sm">
                                  No case exists for Assessment Year {ayOptions.find(o => o.id === selectedAyId)?.label}. Create one to start the filing process.
                                </p>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleCreateCase}
                                  disabled={isCreatingCase}
                                  className="py-3 px-8 bg-amber-500 text-black font-semibold rounded-xl tracking-wide disabled:opacity-50 flex items-center gap-2"
                                >
                                  {isCreatingCase ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                  Create Case
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════════
                        STEP 2 — CLIENT STATUS
                        Subsumes: Filings
                        Shows: ITR No., Filing Date, Refund Amount only
                    ════════════════════════════════════════════════════════════════ */}
                    {selectedStepId === "client_status" && (
                      <div className="space-y-6">
                        <p className="text-base text-white/60 font-light leading-relaxed max-w-lg mx-auto text-center">
                          Record the filing status for this assessment year. Select the current status and filing details.
                        </p>

                        {/* Filing details display */}
                        {filingCase?.case_status === "Filed" && itrvStepData && (
                          <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] max-w-md mx-auto">
                            <span className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest mb-3 block">Filing Details</span>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40">ITR No.</span>
                                <span className="font-semibold text-white/80 font-mono">{filingCase.return_category || "—"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/40">Filing Date</span>
                                <span className="font-medium text-white/80">{itrvStepData.filingDate ? new Date(itrvStepData.filingDate).toLocaleDateString('en-GB') : "—"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/40">Refund Amount</span>
                                <span className="font-semibold text-emerald-400 font-mono">
                                  {filingCase.refund_claimed_amount ? `₹${Number(filingCase.refund_claimed_amount).toLocaleString()}` : "None"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Filing form if not yet filed */}
                        {filingCase?.case_status !== "Filed" ? (
                          <div className="w-full max-w-2xl mx-auto">
                            <ClientStatusStep
                              clientId={clientId}
                              selectedAyId={selectedAyId}
                              filingCase={filingCase}
                              onComplete={(status) => {
                                handleRefresh(selectedAyId).then(() => {
                                  if (status === "Filed") {
                                    goToStep("invoice");
                                  }
                                });
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => goToStep("invoice")}
                              className="py-4 px-8 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-medium tracking-widest uppercase text-[11px] hover:bg-amber-500 hover:text-black transition-all"
                            >
                              Proceed to Invoice →
                            </motion.button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════════
                        STEP 3 — INVOICE
                        Subsumes: Documents + Invoices & Payments + Refunds
                        Sub-window A: Upload ITR-V
                        Sub-window B: Charges + Invoice + Refund
                    ════════════════════════════════════════════════════════════════ */}
                    {selectedStepId === "invoice" && (
                      <div className="space-y-8">
                        <p className="text-base text-white/60 font-light leading-relaxed max-w-lg mx-auto text-center">
                          Upload the ITR-V acknowledgement, review charges, track refunds, and generate the invoice.
                        </p>

                        {/* Sub-window A: Upload ITR-V (if not yet uploaded) */}
                        {!itrvStepData && (
                          <div className="w-full max-w-xl mx-auto">
                            <UploadITRVStep
                              clientId={clientId}
                              selectedAyId={selectedAyId}
                              existingItrvDoc={null}
                              onComplete={() => handleRefresh()}
                            />
                          </div>
                        )}

                        {/* Sub-window B: After upload — Charges + Refund + Invoice */}
                        {itrvStepData && (
                          <div className="space-y-8">
                            {/* Re-upload option */}
                            <div className="flex justify-end">
                              <UploadITRVStep
                                clientId={clientId}
                                selectedAyId={selectedAyId}
                                existingItrvDoc={{ id: "", original_filename: itrvStepData.ackNumber }}
                                onComplete={() => handleRefresh()}
                              />
                            </div>

                            {/* Charges section */}
                            {state.steps.find((s: any) => s.id === "charges")?.status !== "done" && (
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

                            {/* Refund tracking (if applicable) */}
                            {state.steps.find((s: any) => s.id === "charges")?.status === "done" && 
                             state.steps.find((s: any) => s.id === "refund")?.status !== "skipped" && (
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

                            {/* Invoice generation */}
                            {state.steps.find((s: any) => s.id === "charges")?.status === "done" && (
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
                                onComplete={() => {
                                  handleRefresh().then(() => goToStep("payment"));
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════════
                        STEP 4 — PAYMENT
                        Subsumes: Communication & Activity
                        Stage-by-stage reveal
                    ════════════════════════════════════════════════════════════════ */}
                    {selectedStepId === "payment" && (
                      <div className="space-y-8">
                        <p className="text-base text-white/60 font-light leading-relaxed max-w-lg mx-auto text-center">
                          Manage payments and follow-up communications for this filing case.
                        </p>

                        {/* Payment form */}
                        {activeInvoice && activeInvoice.balanceAmount > 0 && (
                          <div className="w-full max-w-xl mx-auto">
                            <PaymentStep
                              clientId={clientId}
                              invoiceId={activeInvoice.invoiceId || ""}
                              balanceAmount={activeInvoice.balanceAmount || 0}
                              onComplete={() => {
                                handleRefresh().then(() => goToStep("next_ay"));
                              }}
                            />
                          </div>
                        )}

                        {/* Fully paid state */}
                        {activeInvoice && activeInvoice.balanceAmount <= 0 && (
                          <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-950/10 text-center max-w-md mx-auto">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h4 className="text-lg font-semibold text-emerald-400">Payment Complete</h4>
                            <p className="text-sm text-white/50 mt-2">All dues have been cleared for this filing case.</p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => goToStep("next_ay")}
                              className="mt-6 py-3 px-6 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-medium tracking-widest uppercase text-[11px] hover:bg-amber-500 hover:text-black transition-all"
                            >
                              Proceed to Next AY →
                            </motion.button>
                          </div>
                        )}

                        {/* Payment follow-up (if not paid) */}
                        {activeInvoice && activeInvoice.balanceAmount > 0 && (
                          <div className="w-full max-w-2xl mx-auto mt-8 border-t border-white/5 pt-8">
                            <PaymentFollowUpStep
                              clientId={clientId}
                              caseId={filingCase?.id || ""}
                              clientMobile={client.mobile}
                              clientName={client.full_name}
                              balanceAmount={activeInvoice.balanceAmount || 0}
                              invoiceNumber={activeInvoice.invoiceNumber || ""}
                              onComplete={() => handleRefresh()}
                            />
                          </div>
                        )}

                        {/* No invoice yet — tell user to go back to step 3 */}
                        {!activeInvoice && (
                          <div className="text-center py-8">
                            <p className="text-sm text-white/40">No invoice has been generated yet.</p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => goToStep("invoice")}
                              className="mt-4 py-3 px-6 bg-white/5 border border-white/10 rounded-xl text-white/60 font-medium tracking-widest uppercase text-[11px] hover:bg-white/10 transition-all"
                            >
                              ← Go to Invoice Step
                            </motion.button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════════
                        STEP 5 — NEXT AY PREPARATION
                        Countdown timer + Call client + Create new case loop
                    ════════════════════════════════════════════════════════════════ */}
                    {selectedStepId === "next_ay" && (
                      <div className="space-y-8">
                        <p className="text-base text-white/60 font-light leading-relaxed max-w-lg mx-auto text-center">
                          Prepare for the next assessment year. Review the current filing and schedule the next cycle.
                        </p>

                        {/* Previous filing details summary */}
                        {filingCase && (
                          <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] max-w-md mx-auto">
                            <span className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest mb-3 block">Current Filing Summary</span>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40">ITR Form</span>
                                <span className="font-semibold text-white/80 font-mono">{filingCase.return_category || "—"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/40">Case Status</span>
                                <span className="font-medium text-white/80">{filingCase.case_status}</span>
                              </div>
                              {filingCase.itr_filing_charges && (
                                <div className="flex justify-between items-center">
                                  <span className="text-white/40">Filing Charges</span>
                                  <span className="font-semibold text-white/80 font-mono">₹{Number(filingCase.itr_filing_charges).toLocaleString()}</span>
                                </div>
                              )}
                              {filingCase.refund_claimed_amount > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-white/40">Refund Claimed</span>
                                  <span className="font-semibold text-emerald-400 font-mono">₹{Number(filingCase.refund_claimed_amount).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Countdown timer to next filing season (June) */}
                        <div className="p-5 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] max-w-md mx-auto text-center">
                          <span className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest mb-3 block">Next Filing Season</span>
                          <NextFilingCountdown />
                        </div>

                        {/* Next year follow-up */}
                        <div className="w-full max-w-xl mx-auto">
                          <NextYearFollowUpStep
                            clientId={clientId}
                            nextAyLabel={state.steps.find((s: any) => s.id === "next_ay_followup")?.data?.nextAyLabel || null}
                            existingFollowup={activeFollowup ? {
                              id: "",
                              status: activeFollowup.status,
                              due_date: activeFollowup.due_date || null,
                            } : null}
                          />
                        </div>

                        {/* Create New Case button — loops back to Step 1 */}
                        <div className="flex justify-center pt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => goToStep("new_client")}
                            className="py-4 px-8 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-medium tracking-widest uppercase text-[11px] hover:bg-amber-500 hover:text-black transition-all"
                          >
                            Create New Case for Next AY →
                          </motion.button>
                        </div>
                      </div>
                    )}

                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

    </div>
  );
}

// ─── Countdown Component ────────────────────────────────────────────────────
function NextFilingCountdown() {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0 });

  React.useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date();
      let nextJune = new Date(now.getFullYear(), 5, 1); // June 1st
      if (now >= nextJune) {
        nextJune = new Date(now.getFullYear() + 1, 5, 1);
      }
      const diff = nextJune.getTime() - now.getTime();
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
      };
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-6 py-3">
      <div className="text-center">
        <div className="text-3xl font-light text-amber-400 font-mono" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {timeLeft.days}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-mono mt-1">Days</div>
      </div>
      <div className="text-white/10 text-lg">:</div>
      <div className="text-center">
        <div className="text-3xl font-light text-amber-400 font-mono" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {timeLeft.hours}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-mono mt-1">Hours</div>
      </div>
      <div className="text-white/10 text-lg">:</div>
      <div className="text-center">
        <div className="text-3xl font-light text-amber-400 font-mono" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {timeLeft.minutes}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-mono mt-1">Minutes</div>
      </div>
    </div>
  );
}
