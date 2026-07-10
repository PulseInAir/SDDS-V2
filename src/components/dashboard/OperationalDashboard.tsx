'use client';

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileWarning,
  IndianRupee,
  TrendingUp,
  Target,
  ShieldAlert,
  Zap,
  Users,
  ReceiptIndianRupee,
  BellRing,
  RefreshCcw,
  CalendarCheck,
  Activity,
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

function formatRelativeTime(value: string) {
  const now = new Date();
  const date = new Date(value);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateTime(value);
}

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export function OperationalDashboard({ data }: { data: DashboardPageData }) {

  if (!data.selectedAssessmentYear) {
    return (
      <div className="flex items-center justify-center p-8 text-center text-white min-h-[60vh]">
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

  const totalUrgent = data.urgentCases.length + data.noticeAttention.length;
  const hasUrgent = totalUrgent > 0;

  return (
    <div className="relative text-white selection:bg-amber-500/30 pb-16">

      {/* Ambient Background — absolute, not fixed */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[0%] left-[50%] -translate-x-1/2 w-[60rem] h-[60rem] bg-amber-600/5 rounded-full blur-[150px] animate-[pulse_10s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-emerald-600/5 rounded-full blur-[150px] animate-[pulse_15s_ease-in-out_infinite_alternate]" />
      </div>

      {/* ───── LEVEL 1: HERO / PRIMARY MISSION ───── */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-8 pb-16">
        <motion.div
          initial="hidden"
          animate="visible"
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
                <span className="text-red-400 font-bold">{totalUrgent}</span> Critical Missions <br /> Await Your Command
              </h1>
              <p className="text-sm font-mono text-white/50 tracking-widest uppercase mt-6 max-w-lg mx-auto leading-relaxed">
                Notice responses and blocked filings are jeopardizing the perimeter. Immediate action required.
              </p>
              <div className="pt-8 flex justify-center gap-4 flex-wrap">
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
        </motion.div>
      </section>

      {/* ───── LEVEL 2: KEY METRICS OVERVIEW ───── */}
      <section className="relative z-10 px-6 pb-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="w-full max-w-6xl mx-auto"
        >
          <motion.div variants={sectionVariants} className="text-center mb-10">
            <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-amber-500/80 mb-3">Operational Overview</h2>
            <h3 className="text-3xl md:text-4xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Command Center Metrics</h3>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { id: "active_clients", icon: Users, color: "text-blue-400", borderColor: "border-blue-500/20", bgColor: "bg-blue-500/5" },
              { id: "new_yet_to_start", icon: Clock3, color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
              { id: "filed", icon: CheckCircle2, color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
              { id: "attention_cases", icon: AlertTriangle, color: "text-red-400", borderColor: "border-red-500/20", bgColor: "bg-red-500/5" },
              { id: "follow_ups_due", icon: CalendarCheck, color: "text-purple-400", borderColor: "border-purple-500/20", bgColor: "bg-purple-500/5" },
            ].map((item) => {
              const metric = metricMap.get(item.id as any);
              if (!metric) return null;
              const Icon = item.icon;
              return (
                <motion.div key={item.id} variants={cardVariants}>
                  <Link href={metric.destination} className="block">
                    <div className={`relative overflow-hidden rounded-2xl border ${item.borderColor} ${item.bgColor} p-5 hover:scale-[1.03] transition-transform duration-300 group`}>
                      <div className="flex items-start justify-between mb-4">
                        <Icon className={`w-5 h-5 ${item.color}`} />
                        <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                      </div>
                      <p className={`text-3xl font-light tabular-nums ${item.color}`} style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        {metric.value}
                      </p>
                      <p className="text-[10px] font-mono tracking-widest uppercase text-white/40 mt-2">{metric.label}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Attention Badges */}
          {attentionMetrics.some((m) => m.value > 0) && (
            <motion.div variants={cardVariants} className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {attentionMetrics.filter((m) => m.value > 0).map((metric) => (
                <Link key={metric.id} href={metric.destination}>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 text-xs font-mono tracking-wider uppercase text-red-400 hover:bg-red-500/15 transition-colors">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    {metric.label}: {metric.value}
                  </span>
                </Link>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ───── LEVEL 3: FILING REACTOR CORE ───── */}
      <section className="relative z-10 py-16 px-6 border-t border-white/5">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={sectionVariants}
          className="w-full max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-amber-500/80 mb-3">Filing Pipeline</h2>
            <h3 className="text-3xl md:text-4xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Filing Reactor Core</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["New Client", "Filing Queue", "Filed"].map((status) => {
              const group = data.workflowDistribution.find((g) => g.status === status);
              const count = group?.count ?? 0;
              const dest = group?.destination ?? `/filing-queue?status=${encodeURIComponent(status)}`;
              const isCompleted = status === "Filed";
              const isActive = count > 0;

              return (
                <Link key={status} href={dest} className="block group">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={`relative overflow-hidden rounded-[24px] border p-8 flex flex-col items-center justify-center min-h-[200px] transition-all duration-500
                      ${isCompleted
                        ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-900/20 shadow-[0_0_40px_rgba(16,185,129,0.05)]'
                        : isActive
                          ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-900/20 shadow-[0_0_40px_rgba(245,158,11,0.05)]'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                      }`}
                  >
                    <div className="relative z-10 flex flex-col items-center">
                      <span className={`text-6xl font-light tabular-nums leading-none mb-3 ${isCompleted ? 'text-emerald-400' : isActive ? 'text-amber-400' : 'text-white/30'}`} style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        {count}
                      </span>
                      <span className="text-sm font-mono tracking-widest uppercase text-white/80">
                        {status}
                      </span>
                      {isActive && !isCompleted && (
                        <span className="mt-3 inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-amber-500/80">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                          Active
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

      {/* ───── LEVEL 4: URGENT CASES ───── */}
      {data.urgentCases.length > 0 && (
        <section className="relative z-10 py-16 px-6 border-t border-white/5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="w-full max-w-5xl mx-auto"
          >
            <motion.div variants={sectionVariants} className="text-center mb-10">
              <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-red-400/80 mb-3">Priority Queue</h2>
              <h3 className="text-3xl md:text-4xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Urgent Cases <span className="text-red-400">({data.urgentCases.length})</span>
              </h3>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.urgentCases.map((c) => (
                <motion.div key={c.id} variants={cardVariants}>
                  <Link href={`/clients/${c.client_id}`} className="block group">
                    <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-5 hover:bg-red-500/[0.08] hover:border-red-500/30 transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{c.client_name}</p>
                          <p className="text-xs text-white/40 font-mono mt-0.5">{c.client_pan}</p>
                        </div>
                        <span className={`shrink-0 ml-3 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                          c.case_status === "New Client"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                        }`}>
                          {c.case_status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
                        {c.due_date && (
                          <span className="flex items-center gap-1.5">
                            <Clock3 className="w-3 h-3" />
                            Due: {formatDateTime(c.due_date)}
                          </span>
                        )}
                        {c.next_action && (
                          <span className="truncate">→ {c.next_action}</span>
                        )}
                      </div>
                      {c.blocker && (
                        <div className="mt-2 text-xs text-red-400/80 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.blocker}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ───── LEVEL 5: FINANCIAL VAULT ───── */}
      <section className="relative z-10 py-16 px-6 border-t border-white/5">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={sectionVariants}
          className="w-full max-w-5xl mx-auto text-center"
        >
          <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-amber-500/80 mb-3">Revenue Intel</h2>
          <h3 className="text-3xl md:text-4xl font-light text-white mb-12" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Financial Vault</h3>

          {/* Collection Efficiency */}
          <div className="relative inline-flex flex-col items-center justify-center mb-16 group">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-1000" />
            <span className="text-[100px] md:text-[140px] leading-none font-light tracking-tighter text-emerald-400" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {collectionEfficiency}<span className="text-emerald-500/50">%</span>
            </span>
            <span className="text-xs font-mono uppercase tracking-[0.4em] text-white/50 mt-4">
              Collection Efficiency
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {[
              { label: "Billed", value: billedMetric?.value, dest: billedMetric?.destination ?? "/invoices?scope=billed", color: "text-white/60", icon: ReceiptIndianRupee },
              { label: "Received", value: receivedMetric?.value, dest: receivedMetric?.destination ?? "/invoices?scope=received", color: "text-emerald-400", icon: IndianRupee },
              { label: "Outstanding", value: outstandingMetric?.value, dest: outstandingMetric?.destination ?? "/invoices?scope=outstanding", color: "text-amber-400", icon: TrendingUp },
              { label: "Overdue", value: metricMap.get("overdue")?.value, dest: metricMap.get("overdue")?.destination ?? "/invoices?scope=overdue", color: "text-red-400", icon: FileWarning },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.dest}>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    className="flex flex-col items-center p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300"
                  >
                    <Icon className={`w-4 h-4 ${item.color} mb-2 opacity-60`} />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-white/40 mb-2">{item.label}</span>
                    <span className={`text-xl md:text-2xl font-mono ${item.color}`}>
                      ₹{(item.value || 0).toLocaleString("en-IN")}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {data.invoiceAttention.length > 0 && (
            <div className="mt-10">
              <Link href="/invoices?scope=overdue">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-full border border-red-500/30 text-red-400 bg-red-500/10 text-xs font-mono tracking-widest uppercase flex items-center gap-3 mx-auto hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                  <Zap className="w-4 h-4" />
                  Breached: {data.invoiceAttention.length} Overdue Accounts
                </motion.button>
              </Link>
            </div>
          )}
        </motion.div>
      </section>

      {/* ───── LEVEL 6: OVERDUE INVOICES DETAIL ───── */}
      {data.invoiceAttention.length > 0 && (
        <section className="relative z-10 py-16 px-6 border-t border-white/5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="w-full max-w-5xl mx-auto"
          >
            <motion.div variants={sectionVariants} className="text-center mb-10">
              <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-red-400/80 mb-3">Financial Threat</h2>
              <h3 className="text-3xl md:text-4xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Overdue Invoices
              </h3>
            </motion.div>

            <div className="space-y-3">
              {data.invoiceAttention.map((inv) => (
                <motion.div key={inv.id} variants={cardVariants}>
                  <Link href={`/invoices/${inv.id}`} className="block group">
                    <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] p-4 hover:bg-red-500/[0.06] hover:border-red-500/25 transition-all duration-300 flex items-center gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <ReceiptIndianRupee className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">{inv.client_name}</p>
                          <span className="text-[10px] font-mono text-white/30">{inv.invoice_number}</span>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          {inv.due_date ? `Due: ${formatDateTime(inv.due_date)}` : "No due date"} • PAN: {inv.client_pan}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-mono text-red-400 tabular-nums">₹{inv.balance_amount.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] font-mono text-white/30 uppercase">Outstanding</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ───── LEVEL 7: REFUNDS & NOTICES ───── */}
      {(data.refundAttention.length > 0 || data.noticeAttention.length > 0 || data.followUpsDue.length > 0) && (
        <section className="relative z-10 py-16 px-6 border-t border-white/5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="w-full max-w-5xl mx-auto"
          >
            <motion.div variants={sectionVariants} className="text-center mb-10">
              <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-amber-500/80 mb-3">Situational Awareness</h2>
              <h3 className="text-3xl md:text-4xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Active Monitors</h3>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Refunds */}
              {data.refundAttention.length > 0 && (
                <motion.div variants={cardVariants} className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <RefreshCcw className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-mono tracking-widest uppercase text-amber-400">Pending Refunds</h4>
                    <span className="ml-auto text-lg font-mono text-amber-400">{data.refundAttention.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {data.refundAttention.map((ref) => (
                      <Link key={ref.id} href={`/clients/${ref.client_id}`} className="block">
                        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 hover:bg-white/[0.05] transition-colors">
                          <p className="text-sm font-medium text-white truncate">{ref.client_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-mono text-white/40 uppercase">{ref.status}</span>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                              ref.attention_level === "overdue" ? "bg-red-500/10 text-red-400" :
                              ref.attention_level === "due" ? "bg-amber-500/10 text-amber-400" :
                              "bg-white/5 text-white/40"
                            }`}>
                              {ref.attention_level}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Notices */}
              {data.noticeAttention.length > 0 && (
                <motion.div variants={cardVariants} className="rounded-2xl border border-red-500/15 bg-red-500/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BellRing className="w-4 h-4 text-red-400" />
                    <h4 className="text-xs font-mono tracking-widest uppercase text-red-400">Active Notices</h4>
                    <span className="ml-auto text-lg font-mono text-red-400">{data.noticeAttention.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {data.noticeAttention.map((notice) => (
                      <Link key={notice.id} href={`/clients/${notice.client_id}`} className="block">
                        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 hover:bg-white/[0.05] transition-colors">
                          <p className="text-sm font-medium text-white truncate">{notice.client_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-mono text-white/40 uppercase truncate">{notice.event_type}</span>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              notice.attention_level === "overdue" ? "bg-red-500/10 text-red-400" :
                              notice.attention_level === "due" ? "bg-amber-500/10 text-amber-400" :
                              "bg-white/5 text-white/40"
                            }`}>
                              {notice.response_due_date ? formatDateTime(notice.response_due_date) : notice.attention_level}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Follow-ups */}
              {data.followUpsDue.length > 0 && (
                <motion.div variants={cardVariants} className="rounded-2xl border border-purple-500/15 bg-purple-500/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarCheck className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-mono tracking-widest uppercase text-purple-400">Follow-ups Due</h4>
                    <span className="ml-auto text-lg font-mono text-purple-400">{data.followUpsDue.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {data.followUpsDue.map((fu) => (
                      <Link key={fu.id} href={fu.case_id ? `/clients/${fu.client_id}` : "/follow-up"} className="block">
                        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 hover:bg-white/[0.05] transition-colors">
                          <p className="text-sm font-medium text-white truncate">{fu.client_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-mono text-white/40 uppercase truncate">{fu.follow_up_type}</span>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              fu.attention_level === "overdue" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                            }`}>
                              {fu.due_date ? formatDateTime(fu.due_date) : fu.attention_level}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </section>
      )}

      {/* ───── LEVEL 8: RECENT ACTIVITY FEED ───── */}
      {data.recentActivity.length > 0 && (
        <section className="relative z-10 py-16 px-6 border-t border-white/5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="w-full max-w-4xl mx-auto"
          >
            <motion.div variants={sectionVariants} className="text-center mb-10">
              <h2 className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase text-amber-500/80 mb-3">Signal Log</h2>
              <h3 className="text-3xl md:text-4xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Recent Activity</h3>
            </motion.div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-[1px] bg-gradient-to-b from-amber-500/30 via-white/10 to-transparent" />

              <div className="space-y-1">
                {data.recentActivity.map((event) => (
                  <motion.div key={event.id} variants={cardVariants}>
                    <div className="flex items-start gap-4 p-3 pl-12 relative hover:bg-white/[0.02] rounded-xl transition-colors group">
                      {/* Timeline dot */}
                      <div className="absolute left-[14px] top-5 w-2.5 h-2.5 rounded-full bg-white/10 border border-white/20 group-hover:bg-amber-500/50 group-hover:border-amber-500/60 transition-colors" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80">{event.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-mono text-white/30 uppercase">{event.client_name}</span>
                          <span className="text-[10px] font-mono text-white/20">{formatRelativeTime(event.created_at)}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono tracking-wider uppercase text-white/20 shrink-0 mt-0.5">{event.entity_type}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}
