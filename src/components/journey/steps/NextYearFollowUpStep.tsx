'use client';

import React from "react";
import { CheckCircle, Calendar, ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";

interface NextYearFollowUpStepProps {
  clientId: string;
  nextAyLabel: string | null;
  existingFollowup?: {
    id: string;
    status: string;
    due_date: string | null;
  } | null;
}

export function NextYearFollowUpStep({ clientId, nextAyLabel, existingFollowup }: NextYearFollowUpStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Next Year Pipeline</h3>
        <p className="text-sm text-text-muted mt-0.5">
          Automated transition of this client into the next year&apos;s operational workflow.
        </p>
      </div>

      {existingFollowup ? (
        <div className="p-4 rounded-[var(--radius-panel)] border border-emerald-500/30 bg-emerald-950/20 max-w-md relative overflow-hidden group">
          
          {/* Spotlight aura */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Follow-up Scheduled</p>
              <p className="text-sm text-text-primary font-semibold mt-0.5">Assessment Year: {nextAyLabel || "Next Year"}</p>
              {existingFollowup.due_date && (
                <p className="text-xs text-text-muted mt-0.5">
                  Scheduled for: {new Date(existingFollowup.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="mt-4 border-t border-emerald-500/10 pt-3 flex items-center justify-between">
            <span className="text-[10px] text-text-muted font-mono uppercase">Status: {existingFollowup.status}</span>
            <Link 
              href="/follow-up" 
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              Manage Follow-ups <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel/40 max-w-md text-center py-6">
          <div className="w-12 h-12 rounded-full bg-neutral-900/60 border border-neutral-800 flex items-center justify-center text-text-muted mx-auto mb-3">
            <UserCheck className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-text-primary">Filing Case Settlement Required</h4>
          <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
            Once payment is fully recorded, the system will automatically schedule the annual client follow-up for the next assessment year.
          </p>
        </div>
      )}
    </div>
  );
}
