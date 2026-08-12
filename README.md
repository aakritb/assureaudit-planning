# AssureAudit Planning Prototype

A responsive, high-fidelity front-end prototype for a connected audit-planning workflow. It is designed for product, audit, design, and engineering validation and uses seeded demo data for Brooklyn Bridge Animal Welfare Coalition, Inc.

The local prototype has no sign-in screen and uses only simulated connector, upload, questionnaire, approval, and notification behavior.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by the development server. Use `npm run build` to create a production build.

## Main routes

- `/dashboard` — AssureAudit dashboard and engagement cards
- `/engagements` — engagement list
- `/engagement/bbawc` — engagement summary
- `/engagement/bbawc/planning` — planning overview and progressive stepper
- `/engagement/bbawc/planning/setup` — acceptance, independence, engagement details, and strategy
- `/engagement/bbawc/planning/data` — connector, TB/GL import, transformation, mapping, reconciliation, and adjustments
- `/engagement/bbawc/planning/entity-controls` — entity understanding, controls, process mapping, fraud/JE risk, estimates, and related parties
- `/engagement/bbawc/planning/materiality` — live materiality calculator and source traceability
- `/engagement/bbawc/planning/risks` — risk register, heat map, analytics indicators, and risk details
- `/engagement/bbawc/planning/responses` — risk-to-procedure linkage, coverage, and workplan
- `/engagement/bbawc/planning/publish` — Engagement Variables and planning outputs
- `/engagement/bbawc/planning/review` — Manager/Partner roll-up, return, approval, lock, and reopen
- `/engagement/bbawc/planning/audit-trail` — detailed activity and rationale history
- `/client-portal/planning-requests` — role-protected client request experience

## Personas

The top-bar prototype role control supports Auditor/Preparer, Manager, Partner, Client Contact, and Firm Administrator. Selecting Client Contact moves into the separate portal experience. Internal risk ratings, materiality rationale, review notes, and audit responses are not rendered in the client portal.

## Major interactions and state transitions

- Simulated QuickBooks connection test, expiry, and safe reconnection
- TB and GL upload/retry, transformation checks, mapping review, and reconciliation actions
- Live benchmark, overall, performance, and clearly-trivial materiality calculations
- Engagement workprogram manager with stage progress, owners, review points, due dates, and entity-level risk
- Editable firm question templates for entity understanding, internal control, business processes, fraud/JE risk, estimates, and related parties
- Firm → client questionnaire → auditor cross-check workflow, including clarification, validation, and risk creation
- Flux analysis linked to Overall and Performance Materiality, with auditor-reviewed automatic scoping recommendations
- Clickable 3×3 heat map with risk-register filtering and risk detail drawer
- Planning-answer-to-risk and risk-to-procedure linkage, plus an auditor-only response quality check
- Versioned Engagement Variable publishing and printable output confirmations
- Independent Manager/Partner conclusion approval, return notes, final lock, and Fieldwork unlock
- Reopen confirmation with downstream workpaper impact
- Client upload and OAuth-consent request responses with status changes
- Prototype-only state controls for edge-case demonstrations

The primary workflow is `Not Started → In Progress → Ready for Review → Pending Manager Approval → Pending Partner Approval → Approved & Locked`. Returned, reopened, stale, blocked, expired-connector, failed-control-total, rolled-forward, group-audit, and changed-Final-TB states can be demonstrated from Demo Controls.

## Demo persistence and security

Prototype progress is stored in browser `localStorage`, as requested, under `assureaudit-planning-demo`. No real OAuth calls, accounting credentials, uploads, or notifications occur. Connector, upload, file-generation, and consent actions are safely simulated with seeded data.
