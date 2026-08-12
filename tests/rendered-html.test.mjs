import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the AssureAudit application shell", async () => {
  const response = await render("/dashboard");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>AssureAudit Planning<\/title>/i);
  assert.match(html, /assureaudit/i);
  assert.match(html, /Dashboard/);
  assert.match(html, /Financial Audit/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton|codex-preview/i);
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
  assert.match(page, /<h2>Planning<\/h2>/);
  assert.doesNotMatch(page, /<h2>Financial Audit · Planning<\/h2>/);
});
