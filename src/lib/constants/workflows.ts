export const CASE_STATUSES = [
  'New Client',
  'Filing Queue',
  'Filed',
  'On Hold',
  'Cancelled',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

// Defines the allowed transitions FROM a given status TO other statuses
export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  'New Client': ['Filing Queue', 'Filed', 'On Hold', 'Cancelled'],
  'Filing Queue': ['Filed', 'On Hold', 'Cancelled'],
  Filed: ['On Hold', 'Cancelled'],
  'On Hold': ['New Client', 'Filing Queue', 'Filed', 'Cancelled'],
  Cancelled: ['New Client', 'Filing Queue', 'Filed', 'On Hold'],
};

