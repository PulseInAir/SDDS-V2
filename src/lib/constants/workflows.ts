export const CASE_STATUSES = [
  'New Client',
  'Filed',
  'On Hold',
  'Cancelled',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

// Defines the allowed transitions FROM a given status TO other statuses
export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  'New Client': ['Filed', 'On Hold', 'Cancelled'],
  Filed: ['On Hold', 'Cancelled'],
  'On Hold': ['New Client', 'Filed', 'Cancelled'],
  Cancelled: ['New Client', 'Filed', 'On Hold'],
};

