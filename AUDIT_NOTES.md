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
- Engagement navigation now uses a compact client identity card and progressively disclosed Planning stages instead of a permanently expanded, repetitive tree.
- Engagement overview and Planning overview are now one `Overview & planning` workspace; it presents engagement-letter facts, deadline, assigned team, client-request progress and entity risk without forcing users between duplicate overview pages.
- Detailed engagement facts remain available through one inline disclosure, keeping the default screen focused while preserving full context.
- The supplied AssureAudit logo is used consistently in the firm interface and client portal.
- Tour access is consolidated into the global Guide button; the duplicate profile action was removed and the collaboration rail is labeled Context.
- Header menus, notification filters, engagement/risk filters, client notifications and file action menus now close on outside click and Escape; navigation also clears transient Context/demo panels.
- Corrupt or older prototype data in local storage is recovered safely instead of crashing the application.

## Verification completed

- Production build: passed.
- TypeScript validation: passed.
- Automated product tests: 6 of 6 passed.
- Browser console: no application errors in the audited Dashboard, Guide, notification and Planning flows.
- Direct-link and mobile notification checks: passed.
- Browser interaction checks for profile, notification/filter, engagement filter and risk filter dismissal: passed.

## Production gaps to address before release

1. Replace browser-only state with authenticated APIs and persistent audit/notification storage.
2. Enforce role permissions on the server; the current role switcher is a prototype control, not authorization.
3. Split `app/page.tsx` and `app/globals.css` into feature modules to reduce regression risk and make ownership clearer.
4. Replace simulated uploads, exports, OAuth and messages with validated services, malware scanning and immutable audit events.
5. Add browser end-to-end tests for approval sequencing, notification deep links, client responses and materiality locking.
6. Add pagination/infinite loading backed by the notification API and retain read state per user.
