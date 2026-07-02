'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { recordCommunicationAction } from "@/lib/actions/follow-ups";
import { MessageSquare, PhoneCall, History, Loader2 } from "lucide-react";

interface PaymentFollowUpStepProps {
  clientId: string;
  caseId: string;
  clientMobile: string | null;
  clientName: string;
  balanceAmount: number;
  invoiceNumber: string;
  onComplete: () => void;
}

export function PaymentFollowUpStep({
  clientId,
  caseId,
  clientMobile,
  clientName,
  balanceAmount,
  invoiceNumber,
  onComplete,
}: PaymentFollowUpStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const reminderText = `Hi ${clientName}, this is a gentle reminder regarding invoice ${invoiceNumber} for your ITR filing. An outstanding balance of ₹${balanceAmount} is pending. Please let us know if you have processed the payment. Thank you!`;

  function handleWhatsAppClick() {
    if (!clientMobile) return;
    const cleanMobile = clientMobile.replace(/\D/g, "");
    const formattedMobile = cleanMobile.startsWith("91") ? cleanMobile : `91${cleanMobile}`;
    const url = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(reminderText)}`;
    window.open(url, "_blank");
  }

  async function handleLogContact(type: "call" | "whatsapp") {
    setLoading(true);
    setError(null);

    const desc = type === "call" 
      ? `Called client regarding outstanding balance of ₹${balanceAmount}. ${note}`
      : `Sent WhatsApp payment reminder for ₹${balanceAmount}.`;

    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("caseId", caseId);
    formData.append("channel", type === "call" ? "Phone Call" : "WhatsApp");
    formData.append("direction", "Outbound");
    formData.append("subject", type === "call" ? "Payment Call" : "WhatsApp Payment Reminder");
    formData.append("summary", desc);
    formData.append("communicationAt", new Date().toISOString());
    formData.append("revalidateTarget", `/clients/${clientId}/journey`);

    try {
      const res = await recordCommunicationAction({}, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setNote("");
        alert("Contact log saved successfully!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log contact.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Payment Follow-up</h3>
        <p className="text-sm text-text-muted mt-0.5">
          Follow up with the client regarding the outstanding balance of <span className="font-semibold font-mono text-amber-400">₹{balanceAmount.toLocaleString()}</span>.
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)] max-w-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl">
        <div className="space-y-3 p-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel/40">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Quick Actions</span>
          
          {clientMobile ? (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  handleWhatsAppClick();
                  handleLogContact("whatsapp");
                }}
                className="h-10 w-full rounded-[var(--radius-input)] border border-emerald-500/20 bg-emerald-950/10 hover:bg-emerald-950/30 text-emerald-400 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
              >
                <MessageSquare className="h-4.5 w-4.5" /> Send WhatsApp Reminder
              </button>
              
              <div className="pt-2">
                <span className="text-[10px] text-text-muted block mb-1">Pre-filled reminder:</span>
                <p className="text-[11px] text-text-secondary bg-neutral-950/20 p-2.5 rounded-[var(--radius-input)] font-mono border border-border-subtle leading-relaxed">
                  {reminderText}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No mobile number recorded for this client.</p>
          )}
        </div>

        <div className="space-y-3.5 p-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel/40 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Log Phone Call</span>
            <textarea
              placeholder="Enter summary of the call (e.g. will pay by Monday)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="block w-full rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 py-2 text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 leading-normal"
              rows={3}
              disabled={loading}
            />
          </div>

          <Button
            onClick={() => handleLogContact("call")}
            disabled={loading || !note}
            className="w-full justify-center active:scale-98 transition-transform mt-3"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <PhoneCall className="h-4 w-4 mr-1.5" />
            )}
            Log Outbound Call
          </Button>
        </div>
      </div>

      <div className="pt-2 flex justify-start">
        <Button variant="secondary" onClick={onComplete} className="flex items-center gap-1">
          <History className="h-4 w-4" /> Go to Payment Record
        </Button>
      </div>
    </div>
  );
}
