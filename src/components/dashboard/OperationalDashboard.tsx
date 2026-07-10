'use client';

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock3,
  FileWarning,
  IndianRupee,
  ReceiptIndianRupee,
  TrendingUp,
  Target,
  ShieldAlert,
  Zap
} from "lucide-react";

import type { getOperationalDashboardData } from "@/lib/actions/dashboard";
import { MaskedValue } from "@/components/ui/MaskedValue";
import { MoneyValue } from "@/components/ui/MoneyValue";

type DashboardPageData = Awaited<ReturnType<typeof getOperationalDashboardData>>;

const ATTENTION_METRIC_IDS = [
  "attention_cases",
  "refunds_pending",
  "notices_due",
  "follow_ups_due",
] as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function OperationalDashboard({ data }: { data: DashboardPageData }) {

  if (!data.selectedAssessmentYear) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 text-center text-white">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md"
        >
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <h1 className="text-3xl font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>System Locked</h1>
          <p className="text-white/50 text-sm font-mono tracking-widest uppercase">Configure Assessment Year to boot dashboard.</p>
        </motion.div>
      </div>
    );
  }

  const metricMap = new Map(data.metricValues.map((metric) => [metric.id, metric]));
  const attentionMetrics = ATTENTION_METRIC_IDS
    .map((metricId) => metricMap.get(metricId))
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric));
  
  const billedMetric = metricMap.get("billed");
  const receivedMetric = metricMap.get("received");
  const outstandingMetric = metricMap.get("outstanding");
  
  const billedVal = billedMetric?.value ?? 0;
  const receivedVal = receivedMetric?.value ?? 0;
  const collectionEfficiency = billedVal > 0 ? Math.round((receivedVal / billedVal) * 100) : 0;

  // Calculate Primary Target (What's the absolute most urgent thing?)
  const totalUrgent = data.urgentCases.length + data.noticeAttention.length;
  const hasUrgent = totalUrgent > 0;
  
  // Animation Variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div className="relative min-h-screen bg-[#030303] text-white selection:bg-amber-500/30">
      
      {/* Cinematic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[0%] left-[50%] -translate-x-1/2 w-[60rem] h-[60rem] bg-amber-600/5 rounded-full blur-[150px] animate-[pulse_10s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-emerald-600/5 rounded-full blur-[150px] animate-[pulse_15s_ease-in-out_infinite_alternate]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <main className="relative z-10 w-full pt-12 pb-32">
        
        {/* LEVEL 1: HERO / PRIMARY MISSION */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 relative">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionVariants}
            className="text-center w-full max-w-4xl"
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                AY {data.selectedAssessmentYear.label}
              </span>
              <span className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                {data.selectedAssessmentYear.isOpen ? "Active Core" : "Legacy Mode"}
              </span>
            </div>

            {hasUrgent ? (
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mb-4 relative">
                  <div className="absolute inset-0 rounded-full border border-red-500/50 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <Target className="w-8 h-8 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                </div>
                <h1 className="text-5xl md:text-7xl font-light text-white leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  <span className="text-red-400 font-bold">{totalUrgent}</span> Critical Missions <br/> Await Your Command
                </h1>
                <p className="text-sm font-mono text-white/50 tracking-widest uppercase mt-6 max-w-lg mx-auto leading-relaxed">
                  Notice responses and blocked filings are jeopardizing the perimeter. Immediate action required.
                </p>
                <div className="pt-8 flex justify-center gap-4">
                  <Link href="/filing-queue?scope=attention">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-red-500 text-white rounded-full font-mono text-xs uppercase tracking-widest hover:bg-red-600 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                      Engage Cases ({data.urgentCases.length})
                    </motion.button>
                  </Link>
                  <Link href="/notices?attentionOnly=true&unresolvedOnly=true">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-transparent border border-red-500/30 text-red-400 rounded-full font-mono text-xs uppercase tracking-widest hover:bg-red-500/10 transition-colors">
                      Handle Notices ({data.noticeAttention.length})
                    </motion.button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <ShieldAlert className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-6xl md:text-8xl font-light text-white leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  System <span className="text-emerald-400">Nominal</span>
                </h1>
                <p className="text-sm font-mono text-white/50 tracking-widest uppercase mt-6 max-w-lg mx-auto leading-relaxed">
                  The perimeter is secure. No urgent cases or notices detected in the active assessment year.
                </p>
              </div>
            )}
            
            {/* Scroll indicator */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-50"
            >
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2">Descend</span>
              <div className="w-[1px] h-12 bg-gradient-to-b from-amber-500/50 to-transparent" />
            </motion.div>
          </motion.div>
        </section>

        {/* LEVEL 2: IMMERSIVE PIPELINE */}
        <section className="min-h-screen py-24 flex flex-col items-center justify-center px-6 relative border-t border-white/5">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-24 bg-gradient-to-b from-white/10 to-transparent" />
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
            className="w-full max-w-5xl"
          >
            <div className="text-center mb-16">
              <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-amber-500/80 mb-4">Level 2</h2>
              <h3 className="text-4xl md:text-5xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Filing Reactor Core</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {["New Client", "Filing Queue", "Filed"].map((status, idx) => {
                const group = data.workflowDistribution.find((g) => g.status === status);
                const count = group?.count ?? 0;
                const dest = group?.destination ?? `/filing-queue?status=${encodeURIComponent(status)}`;
                const isCompleted = status === "Filed";
                const isActive = count > 0;

                return (
                  <Link key={status} href={dest} className="block group">
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`relative overflow-hidden rounded-[32px] border p-8 flex flex-col items-center justify-center aspect-square transition-all duration-700
                        ${isCompleted 
                          ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-900/20 shadow-[0_0_40px_rgba(16,185,129,0.05)] hover:shadow-[0_0_60px_rgba(16,185,129,0.15)]' 
                          : isActive 
                            ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-900/20 shadow-[0_0_40px_rgba(245,158,11,0.05)] hover:shadow-[0_0_60px_rgba(245,158,11,0.15)]'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                        }`}
                    >
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <span className={`text-7xl font-light tabular-nums leading-none mb-4 ${isCompleted ? 'text-emerald-400' : isActive ? 'text-amber-400' : 'text-white/30'}`} style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                          {count}
                        </span>
                        <span className="text-sm font-mono tracking-widest uppercase text-white/80">
                          {status}
                        </span>
                        {isActive && !isCompleted && (
                          <span className="mt-4 inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-amber-500/80">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            Active Energy
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* LEVEL 3: THE FINANCIAL VAULT */}
        <section className="min-h-screen py-24 flex flex-col items-center justify-center px-6 relative border-t border-white/5">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
            className="w-full max-w-5xl text-center"
          >
            <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-amber-500/80 mb-4">Level 3</h2>
            <h3 className="text-4xl md:text-5xl font-light text-white mb-16" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Financial Vault</h3>

            {/* Giant Collection Efficiency */}
            <div className="relative inline-flex flex-col items-center justify-center mb-24 group">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-1000" />
              <span className="text-[150px] md:text-[200px] leading-none font-light tracking-tighter text-emerald-400" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {collectionEfficiency}<span className="text-emerald-500/50">%</span>
              </span>
              <span className="text-xs font-mono uppercase tracking-[0.4em] text-white/50 mt-4">
                Collection Efficiency Rating
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
              {[
                { label: "Billed", value: billedMetric?.value, dest: billedMetric?.destination ?? "/invoices?scope=billed", color: "text-white/60" },
                { label: "Received", value: receivedMetric?.value, dest: receivedMetric?.destination ?? "/invoices?scope=received", color: "text-emerald-400" },
                { label: "Outstanding", value: outstandingMetric?.value, dest: outstandingMetric?.destination ?? "/invoices?scope=outstanding", color: "text-amber-400" },
                { label: "Overdue", value: metricMap.get("overdue")?.value, dest: metricMap.get("overdue")?.destination ?? "/invoices?scope=overdue", color: "text-red-400" }
              ].map((item) => (
                <Link key={item.label} href={item.dest}>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/20 transition-colors"
                  >
                    <span className="text-[10px] font-mono tracking-widest uppercase text-white/40 mb-3">{item.label}</span>
                    <span className={`text-xl md:text-2xl font-mono ${item.color}`}>
                      ₹{(item.value || 0).toLocaleString()}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>

            {data.invoiceAttention.length > 0 && (
              <div className="mt-16 inline-block">
                <Link href="/invoices?scope=overdue">
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-full border border-red-500/30 text-red-400 bg-red-500/10 text-xs font-mono tracking-widest uppercase flex items-center gap-3 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    <Zap className="w-4 h-4" />
                    Breached: {data.invoiceAttention.length} Overdue Accounts
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>
        </section>

      </main>
    </div>
  );
}
