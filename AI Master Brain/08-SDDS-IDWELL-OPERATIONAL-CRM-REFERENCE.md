# SDDS — iDWELL-Inspired Operational CRM Design Reference

**Status:** LOCKED DESIGN DIRECTION  
**Version:** 1.0  
**Date:** 16 June 2026  
**Recommended repository path:** `docs/SDDS-IDWELL-OPERATIONAL-CRM-REFERENCE.md`  
**Purpose:** Convert the approved iDWELL-inspired direction into an implementation-ready design and workflow contract for SDDS.

---

## 0. Decision

SDDS will use an **iDWELL-inspired operational CRM design system**, adapted specifically for Indian ITR practice management.

SDDS may borrow and translate:

1. information hierarchy;
2. information density;
3. navigation logic;
4. workflow presentation;
5. entity-centred records;
6. operational case views;
7. task and status visibility;
8. contextual communication and document presentation.

SDDS must not copy:

- iDWELL branding, name, logo, typography identity, illustrations or marketing language;
- property, building, apartment, landlord, tenant or maintenance imagery;
- property-management terminology or workflows;
- exact screens, source code, proprietary assets or protected visual compositions;
- colours merely because iDWELL uses them;
- features that do not serve SDDS operations.

**No other dashboard or CRM design language may be mixed into the main SDDS visual system.** External products may be studied only for isolated usability evidence after an actual SDDS problem is identified. They must not introduce a second visual language.

---

## 1. Authority and conflict handling

This file is the authoritative reference for the **SDDS visual system, information hierarchy, navigation behaviour and workflow presentation** after the owner’s locked decision.

Use this reading order:

1. owner’s latest explicit instruction;
2. security and data-integrity restrictions;
3. `SDDS_SOURCE.md` for product truth, architecture and business rules;
4. this file for design-system and workflow-presentation direction;
5. approved page-specific implementation contracts;
6. current database schema and verified application behaviour;
7. existing implementation.

When an older dashboard screenshot, specification or task conflicts with this file:

- preserve any valid SDDS business requirement;
- reject the conflicting visual treatment;
- translate the requirement into this operational CRM system;
- document the conflict instead of blending both designs.

This file does not authorise changes to authentication, Supabase, encryption, database structure, storage, calculations or business logic.

---

## 2. Design objective

The SDDS interface must feel like a **serious operating environment for tax-practice work**, not a decorative analytics dashboard.

The operator should be able to answer these questions within seconds:

- What requires action now?
- Which cases are blocked?
- Which clients have not filed for the selected assessment year?
- Which documents are missing?
- Which returns are ready to file?
- Which filed cases still need post-filing work?
- Which intimations, refunds, notices or invoices require follow-up?
- What is the next action for this client?
- What happened previously for this client and assessment year?

The system must optimise for:

1. **recognition over memory**;
2. **next action over decoration**;
3. **complete context over scattered screens**;
4. **high useful density over oversized cards**;
5. **standardised workflow over free-form status notes**;
6. **fast scanning over visual novelty**;
7. **real records over invented analytics**.

---

## 3. What is being extracted from iDWELL

The approved inspiration is not a screenshot-copying exercise. It is a pattern extraction exercise.

Official iDWELL material presents an operational CRM built around:

- a bird’s-eye view of active work;
- multiple views of the same operational records, including Kanban and data tables;
- requests or cases as central work objects;
- predefined tasks and workflows;
- standardised status progression;
- communication attached to the relevant case;
- documents attached to the relevant entity or case;
- compact cards containing status, ownership and activity context;
- centralised operating information rather than separate disconnected tools.

SDDS will translate those principles as follows.

| iDWELL operational pattern | SDDS translation |
|---|---|
| Property-management request/case | Client + Assessment Year filing case |
| Tenant/owner record | Client profile |
| Property/unit context | Assessment Year and filing context |
| Maintenance workflow | ITR preparation, filing and post-filing workflow |
| Request status columns | Filing-status columns or grouped work queues |
| Task list/workflow | Required filing steps, next action and due date |
| Request communication | Client communication and follow-up timeline |
| Case-linked documents | Client + AY document checklist and document history |
| Service overview | Operational dashboard and attention queues |
| Flexible Kanban/table views | Board and table views of the same filing records |
| Team/assignee indicators | Current operator now; staff ownership only when real multi-user support exists |
| Service completion | Filing and post-filing completion criteria |

The translation must always use real SDDS entities, statuses, fields and routes.

---

## 4. The four locked design pillars

### 4.1 Information hierarchy

Every screen must use this order:

1. **Context** — page, assessment year, client or active record.
2. **Operational summary** — counts, status and risk.
3. **Primary work area** — board, table, checklist or record details.
4. **Immediate action** — the next valid action for the selected context.
5. **Supporting history** — activity, communication, documents and audit trail.

#### Page-header hierarchy

Every operational page should contain, where applicable:

- page title;
- one-line operational description only when necessary;
- selected Assessment Year;
- primary action;
- search;
- essential filters;
- view switcher when both board and table views are justified.

Do not place large decorative banners above the work area.

#### Record hierarchy

Every filing case must make these values easy to find:

1. client name;
2. PAN in privacy-safe form;
3. assessment year;
4. filing type;
5. current workflow status;
6. next action;
7. due or expected completion date where available;
8. blocking condition;
9. acknowledgement or filing reference where available;
10. financial state where relevant.

#### Visual priority

Use strong emphasis only for:

- page identity;
- primary action;
- urgent or overdue work;
- current workflow status;
- selected record;
- monetary values in financial contexts.

Everything else should remain quieter and support scanning.

---

### 4.2 Information density

SDDS is a desktop-first internal operations tool. It must show enough information to reduce unnecessary navigation without becoming cramped.

#### Density rules

- Prefer compact rows, structured cards and split views over oversized statistic tiles.
- Use one line for labels where possible.
- Keep metadata close to the record it describes.
- Show the most frequently used fields by default.
- Move uncommon fields into expandable sections, secondary tabs or details drawers.
- Avoid cards containing only one number when the same number can sit inside a useful operational panel.
- Use whitespace to separate groups, not to inflate every component.
- Do not hide essential status information behind hover.
- Do not force the operator to open a record merely to discover why it needs attention.

#### Recommended desktop density baseline

These are SDDS implementation standards, not copied iDWELL measurements:

- application sidebar: approximately `232–256px`;
- top utility bar: approximately `56–64px`;
- standard content padding: `20–24px` desktop;
- panel padding: `16–20px`;
- compact table row: `44–48px`;
- comfortable table row: `52–56px`;
- board card vertical padding: `12–16px`;
- primary gaps: `16–20px`;
- internal gaps: `8–12px`;
- body text: usually `13–14px`;
- metadata: usually `11–12px`;
- page title: usually `22–26px`;
- section title: usually `15–18px`.

Do not hard-code these values independently in many components. Use shared tokens.

#### Progressive disclosure

Show immediately:

- identity;
- status;
- next action;
- deadline;
- warning;
- essential amount;
- document completeness.

Reveal on demand:

- long notes;
- full addresses;
- complete identifiers;
- detailed audit records;
- less-used technical metadata;
- sensitive credentials.

---

### 4.3 Navigation logic

Navigation must reflect the operator’s work model, not database tables and not arbitrary page categories.

#### Primary navigation

Use one persistent desktop navigation system with these operational destinations:

1. Dashboard
2. Clients
3. Filing Queue
4. Documents
5. Invoices & Revenue
6. Refunds
7. Intimations / Notices
8. Follow-up
9. Settings

Navigation labels may change only after an approved product decision.

#### Navigation behaviour

- Exactly one primary navigation item is active.
- Nested routes keep the correct parent item active.
- Direct URL entry, refresh, back and forward navigation preserve active state.
- The active treatment must be obvious without relying only on colour.
- The sidebar remains visually stable between routes.
- The assessment-year selection persists where product logic allows.
- Search and filters should preserve state when opening a record and returning.
- Breadcrumbs are used only when the hierarchy is deeper than the sidebar communicates.
- Do not create separate navigation destinations for tiny features that belong inside a client or case.

#### Global versus contextual navigation

Global navigation changes the operating area.

Examples:

- Clients → Filing Queue;
- Filing Queue → Invoices & Revenue.

Contextual navigation changes the view of one entity.

Examples inside a client profile:

- Overview;
- Assessment Years;
- Documents;
- Filings;
- Invoices & Payments;
- Refunds;
- Intimations / Notices;
- Activity.

Do not mix global destinations and client tabs in the same navigation level.

#### View switchers

A Board/Table switcher is allowed only when both views use the same records and filters.

- Board view answers: “Where is work stuck?”
- Table view answers: “Which exact records match these criteria?”

The view switch must not trigger a different data definition.

---

### 4.4 Workflow presentation

Workflow is the centre of the SDDS interface.

#### Core work object

The primary operational object is:

> **one client + one assessment year filing case**

A client may have multiple assessment-year cases. A case may contain multiple filing records such as Original, Revised, Updated or Rectification-related records. These must never be flattened into one destructive record.

#### Controlled workflow

Use the approved filing statuses from `SDDS_SOURCE.md`:

1. New Client
2. Documents Pending
3. Verification Pending
4. Computation In Progress
5. Client Approval Pending
6. Ready To File
7. Filed
8. Completed
9. Rectification Required
10. Notice Received
11. On Hold
12. Cancelled

Do not invent new statuses to improve a mock-up.

#### Board presentation

The board is a workflow view, not a decorative card grid.

Each column must represent a real controlled status or an approved operational grouping. A board card should show only real fields, selected from:

- client name;
- masked PAN;
- assessment year;
- return or filing type;
- status;
- next action;
- due or expected date;
- document completeness;
- acknowledgement status;
- invoice/payment indicator;
- warning or blocking reason;
- recent activity time.

Rules:

- Card counts must reconcile with table results.
- Moving a card between statuses is allowed only if the backend supports and validates that transition.
- No drag-and-drop is added merely because Kanban products use it.
- High-risk changes require deliberate confirmation.
- Overdue or blocked cards must explain the cause.
- Completed records should not dominate the active-work board.
- Board columns must support practical scrolling without page-level chaos.

#### Table presentation

The table is the high-precision operational view.

Recommended filing-queue columns:

- Client;
- PAN;
- Assessment Year;
- Filing Type;
- Status;
- Next Action;
- Due/Expected Date;
- Documents;
- Ack / Verification;
- Billing State;
- Last Activity;
- Actions.

The exact columns must use fields that exist in the current data contract.

Table rules:

- sticky header on long lists;
- aligned data types;
- right-aligned amounts;
- no hidden horizontal overflow at normal desktop widths where avoidable;
- controlled internal horizontal scrolling when unavoidable;
- status text plus colour or icon;
- one obvious row-open action;
- secondary actions in a compact menu;
- no plaintext portal password in row data or DOM.

#### Case-detail presentation

A filing case page or panel should follow this sequence:

1. case header;
2. current status and next action;
3. progress/required-step summary;
4. client and AY facts;
5. document checklist;
6. filing records;
7. post-filing state;
8. invoice/payment state;
9. refund/intimation/notice state;
10. activity and communication history.

The operator should not need to reconstruct the workflow from disconnected notes.

---

## 5. SDDS application shell

The shell must look owned by SDDS, while following the operational clarity of the approved inspiration.

### 5.1 Sidebar

The sidebar must:

- remain persistent on desktop;
- use SDDS branding only;
- group navigation by operational meaning;
- show clear active state;
- support compact labels and consistent icons;
- place account/session controls separately from operational navigation;
- collapse deliberately on smaller screens.

The sidebar must not:

- use property icons or building imagery;
- contain promotional content;
- use multiple competing active-state designs;
- become a permanent visual feature unrelated to route state;
- include routes that do not exist.

### 5.2 Top utility bar

The top utility area should prioritise:

1. global search;
2. Assessment Year selector;
3. Privacy Mode state;
4. context-relevant primary action;
5. compact account/session controls.

Optional status indicators may appear only when they communicate a real operational or security condition.

Do not show decorative “system active” or “secure” badges unless they represent verified application state and have a useful purpose.

### 5.3 Content canvas

The content area must:

- use one consistent maximum-width and spacing system;
- begin with a compact page header;
- keep filters close to the records they affect;
- use panels to group operational contexts;
- avoid unnecessary outer frames inside frames;
- preserve a stable layout between loading and loaded states.

---

## 6. Dashboard contract

The dashboard is an **operational command centre**, not a marketing dashboard and not a collection of charts.

### 6.1 Required hierarchy

1. Selected Assessment Year and page context
2. Urgent attention summary
3. Workflow distribution
4. Immediate work queue
5. Financial attention
6. Recent activity
7. Upcoming follow-up or due work

### 6.2 Dashboard content

Use verified real data for applicable items:

- total active clients;
- returns filed;
- yet to file;
- documents pending;
- ready to file;
- rectification/attention cases;
- refunds pending;
- intimations/notices pending;
- billed amount;
- received amount;
- outstanding amount;
- overdue invoices;
- upcoming due work;
- recent activity.

### 6.3 Preferred presentation

Use:

- compact summary strip or grouped KPI panel;
- workflow status distribution linked to the Filing Queue;
- urgent cases table/list;
- recent activity timeline;
- financial exceptions panel;
- follow-up queue.

Avoid:

- oversized single-number cards across the whole page;
- decorative line charts without operational meaning;
- fake percentages or trends;
- charts copied from unrelated dashboard designs;
- illustrations or background imagery;
- duplicated metrics in several panels.

### 6.4 Metric interaction

Every clickable metric must open the corresponding filtered records where practical.

Examples:

- “Documents Pending” → Filing Queue filtered to Documents Pending;
- “Refunds Pending” → Refunds filtered to pending records;
- “Outstanding” → Invoices filtered to unpaid/partially paid;
- “Notices Due” → Intimations / Notices filtered to open due items.

A metric with no defined query or destination must not be displayed as an interactive control.

---

## 7. Page templates

### 7.1 Clients list

**Purpose:** Find and open the correct client quickly.

Hierarchy:

1. title, count and Add Client;
2. search and filters;
3. client table;
4. pagination or controlled loading.

Recommended visible information:

- client name;
- masked PAN;
- mobile in privacy-safe form;
- active AY status;
- document indicator;
- filing status;
- payment state;
- attention marker;
- last activity.

Do not use property-style cards for clients. Use a compact table or list suited to 110–150 active clients per year.

### 7.2 Client profile

**Purpose:** Provide the single source of truth for one client.

Header:

- client name;
- masked PAN;
- mobile/contact quick action;
- current AY;
- current filing state;
- next action;
- privacy-sensitive credential action.

Recommended internal navigation:

- Overview;
- Assessment Years;
- Documents;
- Filings;
- Billing;
- Refunds;
- Intimations / Notices;
- Activity.

Overview should show:

- identity summary;
- current case status;
- document completeness;
- filing and verification summary;
- billing summary;
- latest communication;
- next action.

Do not repeat editable versions of the same information across tabs.

### 7.3 Filing Queue

**Purpose:** Run daily filing operations.

Required controls:

- AY filter;
- status filter;
- search;
- attention/overdue filter;
- Board/Table switcher when supported;
- saved views only if truly implemented.

Default view should emphasise active work, not completed history.

### 7.4 Documents

**Purpose:** Identify missing, received, rejected and verified documents.

Hierarchy:

- document attention summary;
- client/AY filters;
- checklist-oriented work list;
- document history and action area.

Use real checklist states from the approved data model. Do not present documents as a decorative file gallery.

### 7.5 Invoices & Revenue

**Purpose:** Create, find and reconcile invoices and payments.

Hierarchy:

- financial exception summary;
- search and filters;
- invoice table;
- payment or invoice details;
- reconciliation context.

Keep billed, received, outstanding and overdue values distinct.

### 7.6 Refunds

**Purpose:** Track pending and received refunds and required follow-up.

Prioritise:

- pending status;
- expected/known amount;
- last checked or follow-up date where available;
- received amount/date;
- discrepancy or action note.

### 7.7 Intimations / Notices

**Purpose:** Prevent missed response work.

Prioritise:

- category;
- client;
- AY;
- issue/receipt date;
- response due date;
- status;
- next action;
- related documents;
- closure result.

Due items must be visually prominent without using alarm styling for normal records.

### 7.8 Follow-up

**Purpose:** Manage next-year retention and outstanding client contact.

Prioritise:

- clients due for contact;
- last contact;
- follow-up state;
- exclusion state and reason;
- one-click communication action where implemented;
- response and next action.

### 7.9 Settings

**Purpose:** Configure the system without competing with daily work.

Group settings by domain. Avoid one long unstructured form.

Potential groups only when implemented:

- organisation;
- assessment year;
- invoice preferences;
- privacy/security;
- data export/backup;
- workflow options.

---

## 8. Component system

Use reusable components that support the operational model.

### 8.1 Required shared components

- `AppShell`
- `SidebarNavigation`
- `TopUtilityBar`
- `PageHeader`
- `AssessmentYearSelector`
- `GlobalSearch`
- `FilterBar`
- `ViewSwitcher`
- `OperationalSummary`
- `AttentionPanel`
- `StatusBadge`
- `PriorityIndicator`
- `DataTable`
- `WorkflowBoard`
- `WorkflowColumn`
- `CaseCard`
- `EntityHeader`
- `DetailSection`
- `Checklist`
- `Timeline`
- `EmptyState`
- `ErrorState`
- `LoadingState`
- `PrivacyValue`
- `ActionMenu`
- `ConfirmationDialog`

Component names may differ in the repository, but responsibilities must remain clear.

### 8.2 Case card contract

A reusable case card should accept only fields supported by the current data contract, such as:

```ts
type FilingCaseCardProps = {
  id: string;
  clientName: string;
  maskedPan?: string;
  assessmentYear: string;
  filingType?: string;
  status: FilingStatus;
  nextAction?: string;
  dueDate?: string | null;
  documentState?: string;
  billingState?: string;
  attentionReason?: string | null;
  lastActivityAt?: string | null;
  href: string;
};
```

This is a design contract example, not permission to invent missing fields or alter the database.

### 8.3 Status badge contract

Status badges must:

- use approved status labels exactly;
- include text, not colour alone;
- use one consistent semantic colour mapping;
- remain readable in Privacy Mode;
- avoid excessive pill styling everywhere else.

### 8.4 Panel contract

Panels should have:

- one clear title;
- optional count;
- optional one-line supporting text;
- one primary contextual action at most;
- consistent padding and border treatment;
- loading, empty and error states.

---

## 9. Visual language owned by SDDS

The visual language must support dense professional work and remain legally and visually distinct from iDWELL.

### 9.1 Character

Use:

- clean neutral surfaces;
- strong information alignment;
- restrained SDDS accent colour;
- compact controls;
- clear status colours;
- subtle borders;
- minimal shadows;
- consistent iconography;
- square-to-moderate radii.

Avoid:

- real-estate imagery;
- bright consumer-app gradients;
- glassmorphism;
- glowing cards;
- oversized rounded pills;
- floating decorative objects;
- random colour per card;
- excessive shadows;
- illustrations inside operational screens;
- generic AI-dashboard charts.

### 9.2 Colour roles

Use semantic roles instead of copying a brand palette:

- `surface-app`
- `surface-panel`
- `surface-muted`
- `border-default`
- `text-primary`
- `text-secondary`
- `text-muted`
- `brand-primary`
- `brand-primary-hover`
- `status-info`
- `status-success`
- `status-warning`
- `status-danger`
- `status-neutral`
- `focus-ring`

One SDDS-owned accent family should dominate navigation and primary actions. Status colours must not become competing brand colours.

### 9.3 Typography

- Use one approved interface font family.
- Prioritise numeric clarity for PAN fragments, acknowledgement numbers, invoice numbers and amounts.
- Use tabular numbers where helpful.
- Use sentence case for labels.
- Avoid uppercase paragraphs.
- Keep headings compact.
- Use weight and spacing before increasing font size.

### 9.4 Radius and shadow

Recommended rules:

- controls: small-to-medium radius;
- panels: medium radius;
- pills: only for statuses, compact filters or toggle states;
- shadows: subtle and rare;
- selection: border/background emphasis before heavy shadow.

### 9.5 Icons

- Use one icon library already approved in the project.
- Use icons to aid recognition, not replace essential labels.
- Keep icon sizes consistent.
- Do not use building, house or property icons unless the concept genuinely exists in SDDS.

---

## 10. Interaction rules

### 10.1 Primary actions

Each page should have one dominant action where applicable.

Examples:

- Clients: Add Client
- Filing Queue: context-dependent action, not a generic decorative button
- Documents: Upload or Request Document when supported
- Invoices: Create Invoice
- Follow-up: Start/Send Follow-up when supported

Secondary actions belong in row actions, contextual menus or detail panels.

### 10.2 Selection and details

For dense work areas, prefer:

- row/card click opens the full record; or
- row/card selection opens a details panel when this improves speed and is implemented consistently.

Do not mix several unrelated selection patterns on the same page.

### 10.3 Filters

- Keep commonly used filters visible.
- Put advanced filters in one controlled popover/drawer.
- Show active-filter count.
- Provide clear reset.
- Preserve filters during record inspection where practical.
- Filter labels must match business language.

### 10.4 Search

Global search should search only supported indexed fields and communicate its scope.

Expected SDDS search targets include, where implemented:

- client name;
- PAN;
- mobile;
- invoice number;
- acknowledgement number.

Search results must identify record type and context.

### 10.5 Status changes

- Display the current status clearly.
- Show only valid next statuses where transition rules exist.
- Require a reason for On Hold or Cancelled where the product requires it.
- Preserve status history.
- Never use a visual status change that bypasses backend validation.

### 10.6 Privacy Mode

Privacy Mode is part of the design system, not an afterthought.

- Sensitive values are masked by default.
- Reveal is deliberate and record-specific.
- Layout must not jump excessively between masked and revealed states.
- Copy actions must follow the same authorisation boundary as reveal.
- Sensitive values must not leak into list markup, tooltips, analytics or logs.

---

## 11. Loading, empty, error and zero states

Every data-driven component must define four distinct conditions.

### Loading

- preserve approximate final layout;
- use compact skeletons;
- avoid blocking the complete page when only one panel is loading.

### Empty

Explain:

- what is empty;
- whether this is normal;
- the valid next action, if any.

Example: “No clients are currently in Ready To File for AY 2026–27.”

### Error

- state what failed in operator language;
- preserve unaffected content;
- provide retry where valid;
- do not expose internal errors or secrets.

### Zero

A valid count of zero is not an error and should not be replaced with fake data or a chart.

---

## 12. Responsive behaviour

Desktop is the main operating experience.

### Desktop

- persistent navigation;
- high-density table and workflow views;
- multi-panel layouts where useful;
- no unintended page-level horizontal scroll.

### Tablet

- collapsible navigation;
- reduced secondary columns;
- filters may move into a drawer;
- preserve status and primary actions.

### Mobile

- prioritise client lookup, status review and quick action;
- stack panels;
- use cards or simplified rows where tables cannot remain readable;
- do not compress desktop tables into illegible layouts;
- keep sensitive actions deliberate;
- do not attempt to reproduce the desktop board unchanged.

Responsive adaptation must preserve business priority, not merely shrink components.

---

## 13. Accessibility

- Full keyboard operation for navigation, filters, tables, dialogs and menus.
- Visible focus state.
- Semantic headings and controls.
- Form labels connected to inputs.
- Status communicated through text plus colour/icon.
- Sufficient contrast.
- Minimum practical touch targets on smaller screens.
- Dialog focus trapping and return.
- Announce dynamic status/error changes where necessary.
- Do not use tooltips as the only source of essential information.

---

## 14. Extraction and implementation protocol

Use this process whenever an iDWELL reference image or video is studied.

### Step 1 — Identify the operational purpose

Record what the screen helps the user accomplish. Do not start with colour or decoration.

### Step 2 — Identify hierarchy

Mark:

- global navigation;
- page context;
- summary;
- work area;
- record details;
- actions;
- history.

### Step 3 — Identify density rules

Record:

- information shown before opening a record;
- information hidden until requested;
- row/card size;
- metadata placement;
- whitespace usage.

### Step 4 — Identify navigation logic

Record:

- global destinations;
- contextual tabs;
- selected state;
- board/table switching;
- filter persistence;
- record-opening behaviour.

### Step 5 — Identify workflow presentation

Record:

- work object;
- statuses;
- columns or groups;
- card/row fields;
- next actions;
- warnings;
- history.

### Step 6 — Strip the source domain

Remove:

- property entities;
- property icons;
- real-estate terminology;
- source branding;
- source colours and imagery;
- unneeded features.

### Step 7 — Map to SDDS

For every retained pattern, document:

- SDDS entity;
- SDDS route;
- existing data source;
- valid status or field;
- user action;
- security/privacy requirement.

### Step 8 — Reject unsupported patterns

Do not implement a pattern when:

- the required data does not exist;
- it conflicts with SDDS_SOURCE.md;
- it weakens privacy or security;
- it duplicates an existing workflow;
- it exists only for visual resemblance;
- it introduces property-management concepts.

### Step 9 — Build with SDDS tokens and components

The implementation must look like one SDDS system, not a traced iDWELL screen.

### Step 10 — Verify operationally

Verify:

- data correctness;
- workflow correctness;
- route state;
- privacy;
- loading/empty/error states;
- responsive behaviour;
- visual consistency;
- no foreign branding or domain residue.

---

## 15. Implementation sequence

Use this order:

1. reconcile older design documents with this locked decision;
2. audit current routes, shell, shared components and data contracts;
3. define SDDS tokens;
4. implement the application shell;
5. implement navigation and route-active behaviour;
6. implement shared operational components;
7. rebuild Dashboard as the system master;
8. rebuild Filing Queue board/table views;
9. rebuild Clients list and client profile;
10. apply the system to Documents;
11. apply the system to Invoices & Revenue;
12. apply the system to Refunds;
13. apply the system to Intimations / Notices;
14. apply the system to Follow-up;
15. align Settings;
16. test responsive and accessibility behaviour;
17. run cross-route visual and functional regression;
18. remove deprecated visual-system code only after verified replacement.

Do not restyle isolated buttons, colours or cards before the shell and component rules are stable.

---

## 16. Required project artefacts

Before broad implementation, create or update:

1. `docs/SDDS-IDWELL-OPERATIONAL-CRM-REFERENCE.md` — this file;
2. design-token contract;
3. route and navigation map;
4. shared component ownership map;
5. page hierarchy map;
6. workflow view contract;
7. field-level data contract for cards and tables;
8. visual mismatch matrix;
9. responsive behaviour matrix;
10. verification checklist.

Do not create duplicate documents when an existing authoritative document can be updated safely.

---

## 17. Coding-agent operating instruction

Every SDDS frontend task must include this instruction:

> Read `SDDS_SOURCE.md` and `docs/SDDS-IDWELL-OPERATIONAL-CRM-REFERENCE.md` before editing. Use the iDWELL inspiration only for information hierarchy, useful density, navigation logic and workflow presentation. Translate every pattern into real SDDS entities, fields, statuses and actions. Do not copy iDWELL branding, imagery, domain language, exact screens or proprietary assets. Do not mix another dashboard design system into the implementation. Preserve all existing business logic, routes, data, authentication, Supabase behaviour, encryption and privacy controls unless the task explicitly changes them.

Task prompts must also state:

- exact objective;
- files allowed to change;
- behaviours that must remain unchanged;
- data source for every visible value;
- visual acceptance criteria;
- functional acceptance criteria;
- required verification;
- stop conditions.

---

## 18. Acceptance checklist

A page conforms to this reference only when all applicable statements are true.

### Hierarchy

- [ ] The page context is immediately clear.
- [ ] The most important operational state appears before secondary detail.
- [ ] One primary action is obvious.
- [ ] Supporting history does not overpower active work.

### Density

- [ ] Useful records are visible without excessive scrolling.
- [ ] Essential metadata is available without opening every record.
- [ ] The layout is not cramped.
- [ ] Oversized decorative cards are absent.

### Navigation

- [ ] Primary and contextual navigation are distinct.
- [ ] The correct route is active on click, refresh and direct entry.
- [ ] Filters and context persist where expected.
- [ ] No route exists solely to fill navigation space.

### Workflow

- [ ] Every status is approved and real.
- [ ] Counts reconcile with underlying records.
- [ ] Next action or blocker is visible where relevant.
- [ ] Original and subsequent filing records remain preserved.
- [ ] Board and table views use the same record definitions.

### Visual system

- [ ] The page uses shared SDDS tokens and components.
- [ ] No foreign branding, property imagery or real-estate language remains.
- [ ] No second dashboard design language is visible.
- [ ] Colours, typography, spacing, icons and states are consistent.

### Data and security

- [ ] No fake data, trends or percentages are displayed.
- [ ] Sensitive data is masked by default.
- [ ] No password or secret is exposed in list markup, logs or client code.
- [ ] Visual work has not changed business logic unintentionally.

### Quality

- [ ] Loading, empty, zero and error states exist.
- [ ] Keyboard and focus behaviour work.
- [ ] Desktop, tablet and mobile behaviour are intentional.
- [ ] Type check, lint, build and relevant tests pass.
- [ ] Browser console and network checks show no new errors.

---

## 19. Automatic rejection rules

Reject any proposed SDDS screen or implementation that:

- looks like a property-management product rather than an ITR operations tool;
- copies iDWELL branding, illustrations, terminology or exact composition;
- introduces another dashboard aesthetic into the main system;
- uses fake charts, fake trends, invented percentages or mock records;
- prioritises visual novelty over the next operational action;
- hides status, due work or blockers to achieve a cleaner screenshot;
- creates oversized low-information cards;
- changes workflow or database meaning for visual convenience;
- removes existing functionality because it is difficult to redesign;
- exposes sensitive values;
- uses inconsistent navigation or active states;
- declares completion without browser and data-flow verification.

---

## 20. Final decision rule

When several designs are possible, choose the one that best:

1. protects client and financial data;
2. makes the next action obvious;
3. preserves complete client and filing history;
4. exposes blockers and deadlines;
5. supports fast scanning at operational density;
6. uses one consistent SDDS visual language;
7. translates the approved iDWELL operational patterns without copying its identity;
8. introduces the least unnecessary complexity.

A prettier screen that weakens workflow clarity is rejected.  
A denser screen that becomes difficult to scan is rejected.  
A copied screen that does not fit Indian ITR operations is rejected.  
A design that combines competing dashboard styles is rejected.

---

## 21. Research basis and interpretation boundary

This reference was informed by publicly visible official iDWELL descriptions and interface imagery showing:

- a unified operational CRM;
- bird’s-eye dashboard visibility;
- Kanban and flexible table views;
- task and workflow automation;
- centralised communication;
- case-linked document management;
- compact status-oriented request cards.

Only these general product-design patterns are adopted. All SDDS structures, terminology, components, visual tokens and workflows must remain independently designed for the SDDS product and its verified data model.

---

**END OF LOCKED REFERENCE**
