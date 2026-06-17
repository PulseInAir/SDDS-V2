export const CASE_STATUSES = [
  'New Client',
  'Documents Pending',
  'Verification Pending',
  'Computation In Progress',
  'Client Approval Pending',
  'Ready To File',
  'Filed',
  'Completed',
  'Rectification Required',
  'Notice Received',
  'On Hold',
  'Cancelled',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

// Defines the allowed transitions FROM a given status TO other statuses
export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  'New Client': ['Documents Pending', 'On Hold', 'Cancelled'],
  'Documents Pending': ['Verification Pending', 'On Hold', 'Cancelled'],
  'Verification Pending': [
    'Computation In Progress',
    'Documents Pending',
    'On Hold',
    'Cancelled',
  ],
  'Computation In Progress': [
    'Client Approval Pending',
    'Verification Pending',
    'On Hold',
    'Cancelled',
  ],
  'Client Approval Pending': [
    'Ready To File',
    'Computation In Progress',
    'On Hold',
    'Cancelled',
  ],
  'Ready To File': [
    'Filed',
    'Client Approval Pending',
    'On Hold',
    'Cancelled',
  ],
  Filed: [
    'Completed',
    'Rectification Required',
    'Notice Received',
    'On Hold',
    'Cancelled',
  ],
  'Rectification Required': [
    'Computation In Progress',
    'Filed',
    'Completed',
    'On Hold',
    'Cancelled',
  ],
  'Notice Received': [
    'Rectification Required',
    'Completed',
    'On Hold',
    'Cancelled',
  ],
  'On Hold': [
    'New Client',
    'Documents Pending',
    'Verification Pending',
    'Computation In Progress',
    'Client Approval Pending',
    'Ready To File',
    'Filed',
    'Rectification Required',
    'Notice Received',
    'Cancelled',
  ], // Returns to prior active state, or cancels
  Completed: [
    'Rectification Required',
    'Notice Received',
    'On Hold',
  ], // Post-completion actions
  Cancelled: [
    'New Client',
    'Documents Pending',
    'Verification Pending',
    'Computation In Progress',
    'Client Approval Pending',
    'Ready To File',
    'Filed',
    'Rectification Required',
    'Notice Received',
    'On Hold',
  ], // Reopening requires authorized action, returning to appropriate state
};
