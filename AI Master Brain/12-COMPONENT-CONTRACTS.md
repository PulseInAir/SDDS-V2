# SDDS Shared Component Contracts

Use shared components to preserve one operational visual system. Props must use domain types, not arbitrary display-only fields.

## Layout

- `AppShell`
- `SidebarNav`
- `TopUtilityBar`
- `PageHeader`
- `PageContent`
- `ResponsiveNavDrawer`

## Inputs and actions

- `Button`
- `IconButton`
- `TextField`
- `SelectField`
- `DateField`
- `TextareaField`
- `SearchInput`
- `FilterBar`
- `ViewSwitcher`
- `PrivacyToggle`
- `AssessmentYearSelect`

## Feedback

- `LoadingSkeleton`
- `EmptyState`
- `ErrorState`
- `InlineError`
- `SuccessToast`
- `ConfirmationDialog`

## Data presentation

- `DataTable`
- `Pagination`
- `StatusBadge`
- `AttentionBadge`
- `MetricLink`
- `DefinitionList`
- `ActivityTimeline`
- `MoneyValue`
- `MaskedValue`
- `DueDateIndicator`

## Workflow

### `CaseCard`

Required information:

- case/client identifiers;
- client name;
- masked PAN;
- AY;
- current case status;
- next action;
- due/expected date;
- blocker/attention state;
- concise document/filing/financial indicators;
- selected/drag/pending states.

No invented avatar, trend, or decorative progress value.

### `CaseBoard`

- receives same dataset/filter contract as table;
- groups by approved status;
- supports accessible non-drag transition fallback;
- optimistic movement only when rollback is reliable;
- server validates every transition.

### `CaseTable`

- sortable/searchable approved fields;
- compact rows;
- controlled overflow;
- row action menu;
- preserved selection/filter state.

### `CaseDetailsPanel`

- context summary;
- next valid actions;
- checklist/attention;
- recent activity;
- link to full case.

## Documents

- `DocumentChecklist`
- `DocumentRow`
- `DocumentUploadDialog`
- `DocumentHistory`
- `SignedDownloadAction`

## Financial

- `InvoiceTable`
- `InvoiceForm`
- `InvoiceSummary`
- `PaymentForm`
- `PaymentHistory`
- `PrintableInvoice`

## Security-sensitive

- `CredentialStatus`
- `CredentialRevealDialog`
- `CredentialUpdateForm`

Credential plaintext must exist only in the smallest necessary client state and clear on close/navigation where practical.

## Component acceptance

Each shared component includes keyboard/focus behaviour, loading/disabled/error states, semantic labels, and test coverage appropriate to its risk.
