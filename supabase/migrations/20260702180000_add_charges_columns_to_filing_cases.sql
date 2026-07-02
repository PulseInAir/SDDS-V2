-- Add charges tracking columns to filing_cases
ALTER TABLE public.filing_cases 
  ADD COLUMN IF NOT EXISTS itr_filing_charges numeric(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS refund_claimed_amount numeric(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS refund_claim_charges numeric(12,2) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.filing_cases.itr_filing_charges IS 'ITR filing fee auto-populated from rate card, editable';
COMMENT ON COLUMN public.filing_cases.refund_claimed_amount IS 'Total refund amount claimed in this filing';
COMMENT ON COLUMN public.filing_cases.refund_claim_charges IS 'Service charge on refund, auto-calculated from refund_charge_percentage';
