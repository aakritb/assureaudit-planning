import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the AssureAudit application shell and focused dashboard", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /title:\s*"AssureAudit Planning"/i);
  assert.match(page, /assure/);
  assert.match(page, /Client audit workspace/);
  assert.match(page, /Collaboration by status/);
  assert.match(page, /setCollabAudience\(option\)/);
  assert.match(page, /\["My team","Client"\]/);
  assert.match(page, /\{label:"Report",progress:0,status:"Locked"/);
  assert.match(page, /\{label:"Completion",progress:0,status:"Locked"/);
  assert.match(page, /const engagementCatalog/);
  assert.match(page, /className="sidebar-client-list"/);
  assert.doesNotMatch(page, /client-switch-wrap/);
  assert.match(page, /<Gauge\/><span>Overview<\/span>/);
  assert.match(page, /<FolderOpen\/><span>Documents<\/span>/);
  assert.match(page, /function DocumentsPage\(/);
  assert.match(page, /className=\{`planning-nav-branch/);
  assert.match(page, /className="module-page-head"/);
  assert.match(page, /function ChartTooltip/);
  assert.match(page, /<Tooltip content=\{<ChartTooltip/);
  assert.match(page, /clientName: "Riverside Youth & Family Services, Inc\."/);
  assert.match(page, /displayType: "Financial Audit"/);
  assert.match(page, /fiscalYear: "FY 2025"/);
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

test("keeps one consistent sidebar and expands Planning as an in-place branch", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /<Gauge\/><span>Overview<\/span>/);
  assert.match(page, /<FolderOpen\/><span>Documents<\/span>/);
  assert.match(page, /className="client-section-nav"/);
  assert.match(page, /className="branch-children"/);
  assert.match(page, /<span>Review & approval<\/span>/);
  assert.match(page, /<EngagementPlanningSummary state=\{state\} navigate=\{navigate\}\/>/);
  assert.doesNotMatch(page, /<Home\/>/);
  assert.doesNotMatch(page, /className="planning-stepper"/);
  assert.match(page, /branchLabels=\["Commence","Data ingest","Understand","Materiality","Identify & assess","Respond","Approve"\]/);
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

test("isolates live-preview and production-build caches", async () => {
  const [config, pkg] = await Promise.all([
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(config, /distDir:/);
  assert.match(config, /process\.env\.NEXT_OUTPUT_DIR/);
  assert.match(config, /process\.env\.VERCEL/);
  assert.match(pkg, /NEXT_OUTPUT_DIR=\.next-dev next dev/);
  assert.match(pkg, /NEXT_OUTPUT_DIR=\.next-build next build/);
});
