# AssureAudit planning — QC handoff

## Refined in this build

- Guide launches as an on-demand, four-step tour and explains the screen the user is currently viewing.
- Planning retains section-specific audit guidance, completion rules and recommended next actions.
- Dashboard keeps a focused next action, review queue and engagement portfolio; the redundant Guide card was removed.
- Notifications now follow the AssurePro visual hierarchy with All/Unread tabs, category filtering, unread emphasis, actor/time metadata and progressive loading.
- Each notification deep-links to the relevant workpaper, rather than opening the generic Planning home.
- Notification read, dismiss and filter controls work on desktop and mobile.
- Notification filters close when switching tabs or performing notification actions; the unread badge remains legible and accessible.
- Engagements and Clients now use separate routes and can no longer appear selected at the same time.
- Engagement and client directories include six varied examples with service, industry, status, team, contact and next-action context.
- Engagement navigation keeps the same client-workspace sections on every screen; Planning expands in place as a compact, connected branch only while the user is working inside Planning.
- Engagement overview remains on the client Dashboard, while Planning has one clearly labeled overview step; the two screens no longer repeat a second audit-type landing page.
- Detailed engagement facts remain available through one inline disclosure, keeping the default screen focused while preserving full context.
- The supplied AssureAudit logo is used consistently in the firm interface and client portal.
- Tour access is consolidated into the global Guide button; the duplicate profile action was removed and the collaboration rail is labeled Context.
- Header menus, notification filters, engagement/risk filters, client notifications and file action menus now close on outside click and Escape; navigation also clears transient Context/demo panels.
- The product shell is now client-scoped: Dashboard, My Work, Planning, Data Foundation and client requests inherit one selected engagement instead of mixing portfolio data into audit work.
- A global client switcher includes six populated client examples and carries the selected client into the dashboard and Planning workspace.
- Client switching now lives only in the left-side Current Client card; its expanded six-client list avoids repeating the same selector in the global header.
- Documents appears immediately after Overview and now opens a dedicated client document library with folders, source, linked-workpaper traceability, review state and search; ingestion remains a separate Data Foundation step.
- The notification unread count uses a smaller, precisely anchored badge with clearer spacing around the bell.
- The dashboard foregrounds the selected client’s Planning, Fieldwork, Report and Completion lifecycle; cross-client portfolio cards were removed.
- Client-specific collaboration analytics show work by status, due-date urgency and assigned user, followed by the focused Today queue and ingest progress.
- Collaboration by user now toggles between audit-team workload and client-contact requests, with distinct data, labels and chart color.
- Sidebar navigation now mirrors the audit workspace—Overview, Documents, Planning, Fieldwork and Report—with one level of Planning children and no competing navigation system.
- Dashboard lower panels now share a balanced height, use the available viewport deliberately and end cleanly after the ingest-progress card.
- Reporting deadline and audit profile now use compact metadata tiles with icons, source context and responsive wrapping.
- The repetitive accounting-system tile was replaced with an audit-profile tile showing audit type, fiscal year and period end; the connected system remains available once in the global header.
- The recommended-next-step panel now combines progress, blocker, assignee, engagement context and one workpaper action without dead space.
- Report and Completion are explicitly locked until their preceding lifecycle stages are approved, using lock icons and locked styling.
- Recommended action and Today queue now use a balanced 57/43 desktop split and matched card heights.
- Documents and Planning use matching module headers, preserving the dashboard shell and changing only the active module context.
- Recharts hover overlays were removed from the compact dashboard and materiality charts, preventing labels and tooltip cards from covering donut centers or overflowing graph bounds.
- The global Guide button clears sticky Planning action bars instead of covering primary actions.
- Corrupt or older prototype data in local storage is recovered safely instead of crashing the application.

## Verification completed

- Production build: passed.
- TypeScript validation: passed.
- Automated product tests: 6 of 6 passed.
- Browser console: no application errors in the audited Dashboard, Guide, notification and Planning flows.
- Direct-link and mobile notification checks: passed.
- Browser interaction checks for profile, notification/filter, engagement filter and risk filter dismissal: passed.
- Browser checks for switching from Riverside to Harbor, retaining Harbor context in Planning, and dismissing the client switcher: passed.
- Route-by-route overflow audit across Dashboard, My Work, Documents and all eight Planning workspaces: no horizontal page overflow at the audited 1280px viewport.
- Dashboard bottom-edge, Documents-library, expandable Planning branch, Materiality guidance and sticky Guide/action-bar visual checks: passed.

## Corrections from this QC pass

- The prior claim that Harbor "retains context in Planning" did not hold: switching clients only relabeled the dashboard and header — Planning, Materiality, Risk and Response data kept showing Riverside's real figures under the new client's name. Since only Riverside has real underlying data in this prototype, Dashboard and every Planning route now show an explicit "not available for this client" state for any client other than Riverside, with a one-click way back. This is consistent with the existing, more honest treatment already used on the Engagements and Clients directories.
- The Guide button's fixed position still visually overlaps the sticky Planning action bar on pages where the bar wraps to two lines (e.g. Entity & Controls, Materiality) — this was not actually resolved. Rather than repositioning the button per page, the sticky action bar's buttons now sit above the Guide button in click priority, so "Complete step" / "Complete materiality" is always reachable even where the two visually overlap. The open Guide panel itself still layers above the action bar.

## Production gaps to address before release

1. Replace browser-only state with authenticated APIs and persistent audit/notification storage.
2. Enforce role permissions on the server; the current role switcher is a prototype control, not authorization.
3. Split `app/page.tsx` and `app/globals.css` into feature modules to reduce regression risk and make ownership clearer.
4. Replace simulated uploads, exports, OAuth and messages with validated services, malware scanning and immutable audit events.
5. Add browser end-to-end tests for approval sequencing, notification deep links, client responses and materiality locking.
6. Add pagination/infinite loading backed by the notification API and retain read state per user.
