'use client';

import React, { useState, useEffect, useRef } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";

import { 
  ArrowLeft, 
  CalendarDays, 
  Shield, 
  Loader2, 
  AlertCircle
} from "lucide-react";
import Link from "next/link";
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

  // Initialize smooth scrolling with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Re-fetch journey state whenever AY changes
  useEffect(() => {
    if (selectedAyId !== journeyData.selectedAyId) {
      handleRefresh(selectedAyId);
    }
  }, [selectedAyId]);

  // Auto-extraction trigger
  useEffect(() => {
    const caseRecord = journeyData.filingCase;
    const filings = journeyData.state.steps.find((s: any) => s.id === "filed")?.data;
    const chargesSet = journeyData.state.steps.find((s: any) => s.id === "charges")?.status === "done";
    
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
      // Automatically advance to the current step if user was on a step that is now done
      if (selectedStepId === "case_created" || selectedStepId === res.state.currentStepId) {
         setSelectedStepId(res.state.currentStepId || "case_created");
      }
    }
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
  const currentStep = state.steps.find((s: any) => s.id === selectedStepId);

  // Retrieve files/docs to show inside Step 2 if uploaded
  const itrvStepData = state.steps.find((s: any) => s.id === "filed")?.data;

  // Extract variables for each step component
  const activeInvoice = state.steps.find((s: any) => s.id === "invoice")?.data;
  const activeRefund = state.steps.find((s: any) => s.id === "refund")?.data;
  const activeFollowup = state.steps.find((s: any) => s.id === "next_ay_followup")?.data;

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
        className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#030303]/60 backdrop-blur-xl px-8 py-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-6">
          <Link 
            href={`/clients/${clientId}`}
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
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </motion.div>

      {/* Side HUD */}
      <JourneyPipeline
        steps={state.steps}
        currentStepId={selectedStepId}
        onStepClick={(id) => setSelectedStepId(id)}
      />

      {/* Main Cinematic Viewport */}
      <main className="relative z-10 w-full min-h-screen pt-32 pb-24 px-8 flex flex-col items-center justify-center">
        
        {isExtracting ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl aspect-video rounded-3xl border border-amber-500/20 bg-[#0a0700]/80 backdrop-blur-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.05)]"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
            <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <h3 className="text-2xl font-light text-amber-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Extracting ITR-V Intelligence</h3>
            <p className="text-sm text-amber-500/60 mt-3 max-w-sm text-center uppercase tracking-widest font-mono">
              Parsing AI structures • Matching variables
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {currentStep && (
              <motion.div
                key={selectedStepId}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full max-w-4xl"
              >
                <div className="mb-8 text-center flex flex-col items-center">
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-amber-500/80 mb-4"
                  >
                    Level {state.steps.findIndex((s: any) => s.id === selectedStepId) + 1}
                  </motion.span>
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl md:text-6xl font-light text-white mb-2" 
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {currentStep.label}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-white/40 tracking-wider uppercase font-mono mt-2 flex items-center gap-2"
                  >
                    Status: 
                    <span className={
                      currentStep.status === "done" 
                        ? "text-emerald-400" 
                        : currentStep.status === "current" 
                        ? "text-amber-400 animate-pulse" 
                        : "text-white/40"
                    }>
                      {currentStep.status}
                    </span>
                    {isRefreshing && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
                  </motion.p>
                </div>

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
                    {/* Render corresponding form/content */}
                    {selectedStepId === "case_created" && (
                      <div className="space-y-8 flex flex-col items-center text-center">
                        <div>
                          <p className="text-base text-white/60 font-light leading-relaxed max-w-lg mx-auto">
                             Initialize the operational core for Assessment Year {ayOptions.find(o => o.id === selectedAyId)?.label || "current"}. This establishes the secure perimeter for all client data.
                          </p>
                        </div>
                        {filingCase ? (
                          <div className="p-8 rounded-2xl border border-white/10 bg-black/40 text-sm space-y-4 w-full max-w-md backdrop-blur-sm">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                              <span className="text-white/40 font-mono tracking-widest uppercase text-[10px]">Case ID</span>
                              <span className="font-mono text-white/80">{filingCase.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                              <span className="text-white/40 font-mono tracking-widest uppercase text-[10px]">Opened At</span>
                              <span className="text-white/80">{new Date(filingCase.created_at).toLocaleDateString()}</span>
                            </div>
                            {filingCase.return_category && (
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 font-mono tracking-widest uppercase text-[10px]">Category</span>
                                <span className="font-semibold text-amber-400">{filingCase.return_category}</span>
                              </div>
                            )}
                            
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                const nextIdx = state.steps.findIndex((s:any) => s.id === "case_created") + 1;
                                if(state.steps[nextIdx]) setSelectedStepId(state.steps[nextIdx].id);
                              }}
                              className="w-full mt-6 py-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-medium tracking-widest uppercase text-[11px] hover:bg-amber-500 hover:text-black transition-all"
                            >
                              Proceed to Upload
                            </motion.button>
                          </div>
                        ) : (
                          <div className="w-full max-w-md mx-auto">
                            <CreateCaseStep
                              clientId={clientId}
                              selectedAyId={selectedAyId}
                              assessmentYears={ayOptions}
                              onComplete={() => handleRefresh()}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {selectedStepId === "filed" && (
                      <div className="w-full max-w-xl mx-auto">
                        <UploadITRVStep
                          clientId={clientId}
                          selectedAyId={selectedAyId}
                          existingItrvDoc={itrvStepData ? { id: "", original_filename: itrvStepData.ackNumber } : null}
                          onComplete={() => {
                            handleRefresh();
                          }}
                        />
                      </div>
                    )}

                    {selectedStepId === "charges" && (
                      <div className="w-full">
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
                      </div>
                    )}

                    {selectedStepId === "refund" && (
                      <div className="w-full max-w-2xl mx-auto">
                        <RefundTrackingStep
                          caseId={filingCase?.id || ""}
                          clientId={clientId}
                          expectedAmount={filingCase?.refund_claimed_amount || 0}
                          initialStatus={activeRefund?.status || "Pending"}
                          initialReceivedAmount={activeRefund?.receivedAmount || undefined}
                          initialReceivedDate={activeRefund?.receivedDate || undefined}
                          onComplete={() => handleRefresh()}
                        />
                      </div>
                    )}

                    {selectedStepId === "invoice" && (
                      <div className="w-full max-w-3xl mx-auto">
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
                          onComplete={() => handleRefresh()}
                        />
                      </div>
                    )}

                    {selectedStepId === "payment" && (
                      <div className="w-full max-w-xl mx-auto">
                        <PaymentStep
                          clientId={clientId}
                          invoiceId={activeInvoice?.invoiceId || ""}
                          balanceAmount={activeInvoice?.balanceAmount || 0}
                          onComplete={() => handleRefresh()}
                        />
                      </div>
                    )}

                    {selectedStepId === "payment_followup" && (
                      <div className="w-full max-w-2xl mx-auto">
                        <PaymentFollowUpStep
                          clientId={clientId}
                          caseId={filingCase?.id || ""}
                          clientMobile={client.mobile}
                          clientName={client.full_name}
                          balanceAmount={activeInvoice?.balanceAmount || 0}
                          invoiceNumber={activeInvoice?.invoiceNumber || ""}
                          onComplete={() => handleRefresh()}
                        />
                      </div>
                    )}

                    {selectedStepId === "next_ay_followup" && (
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
