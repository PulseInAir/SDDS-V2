export const CASE_STATUSES = [
  'New Client',
  'Filing Queue',
  'Filed',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

// Defines the allowed transitions FROM a given status TO other statuses
export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  'New Client': ['Filing Queue', 'Filed'],
  'Filing Queue': ['New Client', 'Filed'],
  Filed: ['New Client', 'Filing Queue'],
};

