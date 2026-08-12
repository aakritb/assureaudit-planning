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
  assert.match(page, /Good afternoon, Oscar/);
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

test("uses one engagement navigation tree without recursively rendering the page", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /Home as HomeIcon/);
  assert.match(page, /<HomeIcon\/>/);
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
