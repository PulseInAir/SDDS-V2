'use client';

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, HelpCircle, FileCheck, DollarSign, Calculator } from "lucide-react";
import { MaskedValue } from "@/components/ui/MaskedValue";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppContext } from "@/contexts/AppContext";

interface ChargesTableProps {
  chargesData: any[];
}

export function ChargesTable({ chargesData }: ChargesTableProps) {
  const { isPrivacyMode } = useAppContext();
  const [search, setSearch] = useState("");

  const filteredData = chargesData.filter((item: any) => {
    const clientName = item.clients?.full_name?.toLowerCase() || "";
    const pan = item.clients?.pan_uppercase?.toLowerCase() || "";
    const cleanSearch = search.toLowerCase();
    return clientName.includes(cleanSearch) || pan.includes(cleanSearch);
  });

  return (
    <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Calculator className="h-5 w-5 text-brand-400" /> Charges Register
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Overview of filing charges and expected invoices for all Filed ITR cases.
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter by Client or PAN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 text-xs text-text-primary shadow-xs outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
        />
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-input)] border border-border-subtle">
        <table className="min-w-full divide-y divide-border-subtle text-left text-xs">
          <thead className="bg-surface-muted text-text-secondary uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">AY</th>
              <th className="px-4 py-3">ITR Form</th>
              <th className="px-4 py-3 text-right">Filing Fee</th>
              <th className="px-4 py-3 text-right">Refund Claimed</th>
              <th className="px-4 py-3 text-right">Refund Service Fee</th>
              <th className="px-4 py-3 text-right">Total Charges</th>
              <th className="px-4 py-3">Invoice Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface-panel/20 text-text-secondary">
            {filteredData.length > 0 ? (
              filteredData.map((item: any) => {
                const filingFee = Number(item.itr_filing_charges) || 0;
                const refundClaimed = Number(item.refund_claimed_amount) || 0;
                const refundFee = Number(item.refund_claim_charges) || 0;
                const totalFee = filingFee + refundFee;

                // Match invoice
                const linkedInvoice = Array.isArray(item.invoices) 
                  ? item.invoices[0] 
                  : item.invoices || null;

                return (
                  <tr key={item.id} className="hover:bg-surface-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      <div>
                        <div className="font-semibold">{item.clients?.full_name}</div>
                        <div className="text-[10px] text-text-muted font-mono uppercase mt-0.5">
                          <MaskedValue value={item.clients?.pan_uppercase || ""} isPrivacyMode={isPrivacyMode} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">{item.assessment_years?.label || "-"}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-brand-400">{item.return_category || "ITR-V"}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{filingFee.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">
                      {refundClaimed > 0 ? `₹${refundClaimed.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {refundFee > 0 ? `₹${refundFee.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary font-mono">
                      ₹{totalFee.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {linkedInvoice ? (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          linkedInvoice.status === "Paid"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-950/40 text-amber-400 border border-amber-500/20"
                        }`}>
                          Invoice: {linkedInvoice.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-medium text-text-muted border border-border-subtle bg-surface-muted">
                          No Invoice
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/clients/${item.client_id}/journey?ayId=${item.assessment_year_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        Journey <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-muted italic">
                  No filed cases with recorded charges found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
