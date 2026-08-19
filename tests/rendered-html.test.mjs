import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("separates the firm portfolio dashboard from each client overview", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /title:\s*"AssureAudit Planning"/i);
  assert.match(page, /assure/);
  assert.match(page, /Audit portfolio/);
  assert.match(page, /function ClientOverview\(/);
  assert.match(page, /Open a client to see its overview, documents and engagement workflow/);
  assert.match(page, /Riverside Youth & Family Services, Inc\./);
  assert.match(page, /Outstanding<\/small>/);
  assert.match(page, /Finish setup in AssurePro/);
  assert.match(page, /Audit data is intentionally hidden/);
  assert.doesNotMatch(page, /Your site is taking shape|react-loading-skeleton|codex-preview/i);
});

test("keeps the planning, questionnaire, analytics, and risk-response workspaces in the product", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /title:\s*"AssureAudit Planning"/);
  assert.match(page, /function PlanningManager\(/);
  assert.match(page, /function QuestionnaireWorkspace\(/);
  assert.match(page, /function FluxAnalytics\(/);
  assert.match(page, /function RiskResponseQc\(/);
  assert.match(page, /Send to client/);
  assert.match(page, /Automatic scoping/);
  assert.match(page, /Risk → response quality check/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
});

test("keeps materiality guidance contextual and calculates triviality from overall materiality", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /function InfoTip\(/);
  assert.match(page, /Benchmark/);
  assert.match(page, /Specific materialities/);
  assert.match(page, /Overall materiality/);
  assert.match(page, /Performance materiality/);
  assert.match(page, /Clearly trivial threshold/);
  assert.match(page, /const trivial=overall\*\(state\.trivialPct\/100\)/);
  assert.match(page, /firm methodology—not statutory safe harbors/);
  assert.match(page, /‘Clearly trivial’ is not another expression for ‘not material.’/);
});

test("uses a staged client workspace with ingest before workpapers", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /Home as HomeIcon/);
  assert.match(page, /<HomeIcon\/>/);
  assert.doesNotMatch(page, /<Home\/>/);
  assert.doesNotMatch(page, /className="planning-stepper"/);
  assert.match(page, /<span>Data ingest<\/span>/);
  assert.match(page, /<span>Workpapers<\/span>/);
  assert.match(page, /const INGEST_STEPS=/);
  assert.match(page, /label:"Accounting system"/);
  assert.match(page, /label:"Transform & validate"/);
  assert.match(page, /Map accounts/);
  assert.match(page, /label:"Reconcile data"/);
  assert.match(page, /Planning workpapers/);
  assert.match(page, /Complete the work, then send it for review/);
  assert.doesNotMatch(page, /<h2>Financial Audit · Planning<\/h2>/);
});

test("keeps engagement-letter facts centralized and the lifecycle actionable", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const engagement = \{/);
  assert.match(page, /From signed engagement letter/);
  assert.match(page, /Read-only facts synchronized from AssurePro/);
  assert.match(page, /className={`journey-step/);
  assert.match(page, /Review engagement terms/);
  assert.doesNotMatch(page, /Brooklyn Bridge Animal Welfare Coalition/);
});

test("adds stakeholder-required industry classification to new engagements", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const INDUSTRY_OPTIONS/);
  assert.match(page, /label="Industry" required/);
  assert.match(page, /label="Sub-industry" required/);
  assert.match(page, /setSubIndustry\(INDUSTRY_OPTIONS\[next\]\[0\]\)/);
  assert.match(page, /label="Select workflow"/);
  assert.match(page, /<span>Workflow<\/span>/);
});

test("captures teams, security, automation and phase ownership before creating an engagement", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Engagement details/);
  assert.match(page, /Team & workflow/);
  assert.match(page, /Financial period start/);
  assert.match(page, /Line of service/);
  assert.match(page, /Link prior engagement/);
  assert.match(page, /Engagement partner/);
  assert.match(page, /Primary client contact/);
  assert.match(page, /Require MFA/);
  assert.match(page, /Auto-submit Planning/);
  assert.match(page, /Auto-submit Fieldwork/);
  assert.match(page, /Archive date/);
  assert.match(page, /Assign engagement phases/);
  assert.match(page, /Firm owner/);
  assert.match(page, /Client owner/);
  assert.match(page, /Data Ingest will open first/);
});

test("keeps the client workspace map visible before a client is selected", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /workspace-preview/);
  assert.match(page, /Select a client/);
  assert.match(page, /!clientContext/);
});

test("uses the approved AssureAudit purple across UI and charts", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(css, /--violet:#6B46FF/);
  assert.match(css, /--violet-dark:#5330D9/);
  assert.match(page, /color:"#6B46FF"/);
});

test("keeps materiality in one workflow location, without a dead sidebar entry or inconsistent redirect", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /id:"materiality",label:"Materiality & handoff"/);
  assert.doesNotMatch(page, /\{ title: "Materiality", status:/);
  assert.match(page, /Materiality is maintained in Data Ingest/);
  // The sidebar's Workpapers branch must not render a "Materiality" entry at all — it
  // previously existed only to be hidden by a fragile `nth-child(4)` CSS rule, which left an
  // invisible-but-keyboard-focusable button (an accessibility bug) and would silently break if
  // sibling items were ever reordered. Landing on /planning/materiality directly (a stale link,
  // a refresh, or the "Lock materiality" shortcut) must show the same informational banner
  // every time — navigate() must NOT rewrite the path only for in-app clicks, since that
  // produced different content for the same URL depending on how you arrived.
  assert.doesNotMatch(page, /<span>Materiality<\/span><\/button>/);
  assert.doesNotMatch(page, /next\.replace\(\/\\\/planning\\\/materiality\$\/, "\/ingest\/materiality"\)/);
  assert.doesNotMatch(css, /branch-children[^{]*nth-child\(4\)\{display:none\}/);
});

test("shows firm and client teams with an approval hierarchy", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const CLIENT_TEAMS/);
  assert.match(page, /function EngagementTeam/);
  assert.match(page, /People & approvals/);
  assert.match(page, /Firm team/);
  assert.match(page, /Client team/);
  assert.match(page, /Final approval/);
  assert.match(page, /Management approval/);
});

test("uses consistent contextual info icons and actionable confirmations", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, />Learn more<\/button>/);
  assert.match(page, /title="Workpapers Content Pack"/);
  assert.match(page, /Connected platform updated/);
  assert.match(page, /Dismiss notification/);
  assert.match(page, /function MappingExceptionsModal/);
  assert.match(page, /function TransformDetailModal/);
});

test("isolates live-preview and production-build caches", async () => {
  const [config, pkg] = await Promise.all([
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(config, /distDir:.*process\.env\.NEXT_OUTPUT_DIR/);
  // Vercel's build system expects the conventional ".next" output directory; the isolated
  // NEXT_OUTPUT_DIR only matters for a local dev + build running side by side, so it must be
  // skipped in that environment or Vercel's own deploy step can't find the build output.
  assert.match(config, /distDir:.*process\.env\.VERCEL/);
  assert.match(pkg, /NEXT_OUTPUT_DIR=\.next-dev next dev/);
  assert.match(pkg, /NEXT_OUTPUT_DIR=\.next-build next build/);
});

test("keeps the notification count visible, accessible, and deep-links by item", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  // The bell badge and aria-label must reflect unread count, not total item count, now that
  // notifications can be individually marked read — these two must never drift apart.
  assert.match(page, /Open notifications, \$\{unreadCount\} unread/);
  assert.match(page, /<i>\{unreadCount}<\/i>/);
  assert.match(page, /const \[notifTab, setNotifTab\] = useState/);
  // Every notification must route to the specific step that resolves it, not always the
  // generic Planning home regardless of which item was clicked.
  assert.match(page, /function notificationRoute\(item: string\)/);
  assert.doesNotMatch(page, /navigate\("\/engagement\/bbawc\/planning"\); \}\}><AlertCircle/);
});

test("keeps financial year and Guide as persistent platform controls", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /fiscalYear: "FY 2025"/);
  assert.match(page, /aria-label="Financial year"/);
  assert.match(page, /function GlobalGuide/);
  assert.match(page, /aria-label="Open AssureAudit Guide"/);
  assert.match(page, /const tabs=\["Comments","Review notes","Activity","Attachments"\]/);
});

test("searches across the platform and keeps the signed-in identity role based", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /aria-label="Search platform"/);
  assert.match(page, /Materiality & handoff/);
  assert.match(page, /General Ledger Detail\.csv/);
  assert.match(page, /event\.metaKey\|\|event\.ctrlKey/);
  assert.match(page, /<span>\{state\.role\}<\/span>/);
  assert.doesNotMatch(page, /Baldeep Singh Chhabra · Partner/);
  assert.doesNotMatch(page, /className="global-search" onClick=\{\(\)=>navigate\("\/clients"\)\}/);
  assert.match(css, /\.global-search-menu/);
});
