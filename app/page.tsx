"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Bell,
  BookOpen, BriefcaseBusiness, Building2, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, Circle, ClipboardCheck, Clock3,
  Cloud, Database, DollarSign, Download, FileCheck2, FileSpreadsheet, FileText, Filter,
  FolderOpen, Gauge, History, Home as HomeIcon, Info, LayoutDashboard, Link2, ListChecks,
  LockKeyhole, Menu, MessageSquare, MoreHorizontal, Paperclip, Pencil, Plus,
  RefreshCw, RotateCcw, Search, Send, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, Table2, Trash2, UploadCloud, UserRound, Users, X, Zap
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis
} from "recharts";

type Role = "Auditor / Preparer" | "Manager" | "Partner" | "Client Contact" | "Firm Administrator";
type StepState = "Complete" | "In Progress" | "Needs Attention" | "Not Started" | "Approved" | "Locked" | "Stale" | "Declined";

type RiskItem = { id: number; title: string; fsa: string; assertion: string; likelihood: string; magnitude: string; level: string; significant: boolean; fraud: boolean; balance: string; driver: string; response: string };
type ProcedureItem = { title: string; risk: string; type: string; assignee: string; due: string; status: string };
type ReconRow = { account: string; tb: string; gl: string; variance: string; status: string; owner: string };

type DemoState = {
  role: Role;
  fiscalYear: string;
  connector: "Connected" | "Expired" | "Not connected";
  controlTotals: "Pass" | "Fail";
  mapped: number;
  groupAudit: boolean;
  rolledForward: boolean;
  planningStatus: string;
  materialityPct: number;
  benchmark: number;
  performancePct: number;
  trivialPct: number;
  materialityOverride: boolean;
  materialityRationale: string;
  materialityBenchmarkType: string;
  materialityLocked: boolean;
  transformationConfirmed: boolean;
  responseGap: boolean;
  independenceOutstanding: number;
  finalTb: boolean;
  publishVersion: number;
  managerApproved: boolean;
  partnerApproved: boolean;
  locked: boolean;
  reopened: boolean;
  completedRequests: number;
  entityRisk: "Normal" | "Elevated" | "High";
  questionnaireStatus: "Draft" | "Sent to Client" | "Client Responded" | "Clarification Needed" | "Validated";
  questionnairePrompt: string;
  clientAnswer: string;
  acceptanceDecision: "accept" | "safeguards" | "decline";
  acceptanceSafeguardsNote: string;
  customRisks: RiskItem[];
  customProcedures: ProcedureItem[];
  flaggedForReview: boolean;
  reconciliationRows: ReconRow[];
  fieldworkSynced: boolean;
  fieldworkPeriod: string;
};

const defaultState: DemoState = {
  role: "Auditor / Preparer", fiscalYear: "FY 2025", connector: "Connected", controlTotals: "Pass", mapped: 96,
  groupAudit: false, rolledForward: false, planningStatus: "In Progress", materialityPct: 2.5,
  benchmark: 9600000, performancePct: 75, trivialPct: 5, materialityOverride: false, materialityRationale: "", materialityBenchmarkType: "Total Revenue", materialityLocked: false, transformationConfirmed: false, responseGap: true, independenceOutstanding: 2, finalTb: false,
  publishVersion: 1, managerApproved: false, partnerApproved: false, locked: false,
  reopened: false, completedRequests: 3,
  entityRisk: "Normal", questionnaireStatus: "Draft",
  questionnairePrompt: "Describe the organization’s business model, primary revenue streams, significant changes during the year, and the controls management uses to ensure complete and accurate reporting.",
  clientAnswer: "",
  acceptanceDecision: "accept", acceptanceSafeguardsNote: "", customRisks: [], customProcedures: [], flaggedForReview: false,
  reconciliationRows: [
    { account: "Restricted grants", tb: "$1,122,000", gl: "$1,110,000", variance: "$12,000", status: "Accepted", owner: "J. Alvarez" },
    { account: "Accrued payroll", tb: "$94,600", gl: "$89,100", variance: "$5,500", status: "Resolved", owner: "M. Kapoor" },
    { account: "Net assets released", tb: "($210,000)", gl: "($206,200)", variance: "($3,800)", status: "Accepted", owner: "J. Alvarez" },
  ],
  fieldworkSynced: false, fieldworkPeriod: "",
};

const engagement = {
  clientName: "Riverside Youth & Family Services, Inc.",
  shortName: "Riverside Youth & Family Services",
  initials: "RY",
  engagementType: "Financial Statement Audit",
  displayType: "Financial Audit",
  fiscalYear: "FY 2025",
  periodEnd: "December 31, 2025",
  periodShort: "Dec 31, 2025",
  periodStart: "January 1, 2025",
  reportingFramework: "US GAAP",
  industry: "Nonprofit / Youth & family services",
  entityType: "New York nonprofit corporation",
  engagementLetter: "Signed August 4, 2025",
  reportingDeadline: "April 30, 2026",
  serviceScope: "Audit of financial statements and related notes",
  locations: "Brooklyn headquarters + 3 program sites",
  accountingSystem: "QuickBooks Online",
  partner: "Oscar Owner",
  manager: "Meera Kapoor",
};

// Single source of truth for "the risk register", merging the seeded risks with any
// auditor-added custom risks so the register table, heat map and phase status never disagree.
function allRisks(state: DemoState): RiskItem[] {
  return [...risks, ...state.customRisks];
}

// Acceptance & continuance must actually gate downstream planning: Decline stops planning
// from proceeding at all, and Accept with safeguards requires a captured safeguards narrative.
function acceptanceReady(state: DemoState) {
  return state.acceptanceDecision === "accept" || (state.acceptanceDecision === "safeguards" && !!state.acceptanceSafeguardsNote.trim());
}

function getPhases(state: DemoState) {
  const declined = state.acceptanceDecision === "decline";
  const riskList = allRisks(state);
  const highRiskCount = riskList.filter(r => r.level === "High").length;
  const allRisksCovered = !riskList.some(r => r.response.includes("Needs"));
  const dataDone = state.controlTotals !== "Fail" && state.mapped >= 100;
  const foundationDone = acceptanceReady(state) && state.independenceOutstanding === 0;
  const publishBlockers = (state.controlTotals === "Fail" ? 1 : 0) + (state.responseGap ? 1 : 0) + (state.mapped < 100 ? 1 : 0) + (declined ? 1 : 0);
  return [
    { title: "Engagement Foundation", status: (declined ? "Declined" : foundationDone ? "Complete" : "In Progress") as StepState, route: "setup", detail: declined ? "Engagement declined — planning does not proceed" : foundationDone ? "4 of 4 steps complete" : !acceptanceReady(state) ? "Safeguards rationale required before proceeding" : `3 of 4 steps complete · ${state.independenceOutstanding} independence confirmation${state.independenceOutstanding === 1 ? "" : "s"} outstanding` },
    { title: "Data Foundation", status: (declined ? "Not Started" : dataDone ? "Complete" : "Needs Attention") as StepState, route: "data", detail: declined ? "Blocked — engagement was declined" : state.controlTotals === "Fail" ? "Control totals do not balance" : dataDone ? "All accounts mapped" : "4 accounts need review" },
    { title: "Entity & Controls", status: (declined ? "Not Started" : state.questionnaireStatus === "Validated" ? "Complete" : "In Progress") as StepState, route: "entity-controls", detail: declined ? "Blocked — engagement was declined" : state.questionnaireStatus === "Validated" ? "11 of 11 areas validated" : "7 of 11 areas validated" },
    { title: "Risk Assessment", status: (declined ? "Not Started" : allRisksCovered ? "Complete" : "In Progress") as StepState, route: "risks", detail: declined ? "Blocked — engagement was declined" : `${riskList.length} risks • ${highRiskCount} high` },
    { title: "Audit Response", status: (declined ? "Not Started" : state.responseGap ? "Needs Attention" : "Complete") as StepState, route: "responses", detail: declined ? "Blocked — engagement was declined" : state.responseGap ? "1 risk needs coverage" : "All risks covered" },
    { title: "Publish & Approval", status: (declined ? "Not Started" : state.locked ? "Locked" : publishBlockers > 0 ? "Not Started" : "In Progress") as StepState, route: "publish", detail: declined ? "Blocked — engagement declined; cannot be published" : state.locked ? "Approved and locked" : `${publishBlockers} checks remaining` },
  ];
}

// Single source of truth for "% complete" everywhere it's shown (sidebar, dashboard, engagement home).
function planningProgressPct(state: DemoState) {
  const phases = getPhases(state);
  const done = phases.filter(p => p.status === "Complete" || p.status === "Locked").length;
  return Math.round((done / phases.length) * 100);
}

// Single source of truth for the outstanding-items list — used by the Planning
// overview summary and the Engagement home "blockers" metric so they can never disagree.
function attentionItems(state: DemoState) {
  if (state.acceptanceDecision === "decline") {
    // A declined engagement supersedes every other in-flight item — showing granular
    // "2 independence confirmations" alongside a decline would read as contradictory.
    return ["Engagement declined — Planning cannot proceed"];
  }
  const outstandingRequests = 6 - state.completedRequests;
  return [
    state.acceptanceDecision === "safeguards" && !state.acceptanceSafeguardsNote.trim() && "Safeguards rationale required for Accept with safeguards decision",
    state.independenceOutstanding > 0 && `${state.independenceOutstanding} independence confirmation${state.independenceOutstanding === 1 ? "" : "s"}`,
    state.responseGap && "1 response gap",
    state.mapped < 100 && "4 accounts need mapping review",
    state.controlTotals === "Fail" && "Control totals do not balance",
    state.flaggedForReview && "1 data issue flagged for investigation",
    outstandingRequests > 0 && `${outstandingRequests} client request${outstandingRequests === 1 ? "" : "s"}`,
  ].filter(Boolean) as string[];
}

// Routes each notification to the specific step that resolves it, instead of always opening
// the generic Planning home regardless of which item was clicked.
function notificationRoute(item: string) {
  if (item.includes("Safeguards")) return "/engagement/bbawc/planning/setup";
  if (item.includes("independence")) return "/engagement/bbawc/planning/setup";
  if (item.includes("response gap")) return "/engagement/bbawc/planning/responses";
  if (item.includes("mapping review")) return "/engagement/bbawc/ingest/map-accounts";
  if (item.includes("Control totals")) return "/engagement/bbawc/ingest/validate";
  if (item.includes("flagged for investigation")) return "/engagement/bbawc/ingest/reconcile";
  if (item.includes("client request")) return "/client-portal";
  if (item.includes("declined")) return "/engagement/bbawc/planning/setup";
  return "/engagement/bbawc/planning";
}
const NOTIF_ACTORS = ["Jasmine Alvarez", "Meera Kapoor", "Oscar Owner", "Leo Chen"];
const NOTIF_TIMES = ["18 min ago", "2h ago", "Yesterday", "3h ago"];

function nextOpenPhase(state: DemoState) {
  return getPhases(state).find(p => p.status !== "Complete" && p.status !== "Locked");
}

// Single source of truth for the red/amber/green phase breakdown behind the status-count
// badges (Engagements list, Planning status summary) — always derived from getPhases().
function phaseStatusCounts(state: DemoState) {
  const phases = getPhases(state);
  const complete = phases.filter(p => p.status === "Complete" || p.status === "Locked" || p.status === "Approved").length;
  const attention = phases.filter(p => p.status === "Needs Attention" || p.status === "Declined" || p.status === "Stale").length;
  const inProgress = phases.length - complete - attention;
  return { complete, inProgress, attention };
}

const risks: RiskItem[] = [
  { id: 1, title: "Revenue cutoff", fsa: "Revenue", assertion: "Cutoff", likelihood: "High", magnitude: "High", level: "High", significant: true, fraud: true, balance: "$3,840,000", driver: "New grant terms and year-end donations", response: "2 procedures" },
  { id: 2, title: "Management override of controls", fsa: "Journal entries", assertion: "Occurrence", likelihood: "High", magnitude: "High", level: "High", significant: true, fraud: true, balance: "N/A", driver: "Fraud brainstorming session", response: "1 procedure" },
  { id: 3, title: "Conditional contribution recognition", fsa: "Contributions", assertion: "Accuracy", likelihood: "Moderate", magnitude: "High", level: "High", significant: true, fraud: false, balance: "$1,120,000", driver: "Significant contracts review", response: "Needs response" },
  { id: 4, title: "Allowance for uncollectible pledges", fsa: "Receivables", assertion: "Valuation", likelihood: "Moderate", magnitude: "Moderate", level: "Moderate", significant: false, fraud: false, balance: "$486,200", driver: "Accounting estimate questionnaire", response: "2 procedures" },
  { id: 5, title: "Related-party completeness", fsa: "Disclosures", assertion: "Completeness", likelihood: "Moderate", magnitude: "Moderate", level: "Moderate", significant: false, fraud: false, balance: "$90,000", driver: "Related-party listing", response: "1 procedure" },
  { id: 6, title: "Payroll allocation", fsa: "Expenses", assertion: "Classification", likelihood: "Moderate", magnitude: "Low", level: "Moderate", significant: false, fraud: false, balance: "$2,610,000", driver: "Business process walkthrough", response: "1 procedure" },
  { id: 7, title: "Investment valuation", fsa: "Investments", assertion: "Valuation", likelihood: "Low", magnitude: "Moderate", level: "Moderate", significant: false, fraud: false, balance: "$742,100", driver: "Marketable securities schedule", response: "1 procedure" },
  { id: 8, title: "Accounts payable completeness", fsa: "Payables", assertion: "Completeness", likelihood: "Moderate", magnitude: "Moderate", level: "Moderate", significant: false, fraud: false, balance: "$318,700", driver: "Close process walkthrough", response: "2 procedures" },
  { id: 9, title: "Cash existence", fsa: "Cash", assertion: "Existence", likelihood: "Low", magnitude: "Low", level: "Low", significant: false, fraud: false, balance: "$612,480", driver: "Bank reconciliation control", response: "1 procedure" },
  { id: 10, title: "Fixed asset additions", fsa: "Property & equipment", assertion: "Classification", likelihood: "Low", magnitude: "Low", level: "Low", significant: false, fraud: false, balance: "$384,000", driver: "Capital expenditure policy", response: "1 procedure" },
  { id: 11, title: "Prepaid expense allocation", fsa: "Prepaids", assertion: "Accuracy", likelihood: "Low", magnitude: "Low", level: "Low", significant: false, fraud: false, balance: "$72,600", driver: "Prior-year risk conclusion", response: "1 procedure" },
  { id: 12, title: "Grant restriction presentation", fsa: "Net assets", assertion: "Presentation", likelihood: "Moderate", magnitude: "Moderate", level: "Moderate", significant: false, fraud: false, balance: "$2,210,000", driver: "Restriction schedule", response: "2 procedures" },
];

const roleNames: Role[] = ["Auditor / Preparer", "Manager", "Partner", "Client Contact", "Firm Administrator"];

function money(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
function useDismiss<T extends HTMLElement = HTMLDivElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const escHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", escHandler); };
  }, [open, onClose]);
  return ref;
}
function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }

// Engagement team roster, matching the initials already used across Independence, the risk
// register and Audit Response (J. Alvarez / Preparer, M. Kapoor / Manager, Oscar Owner / Partner,
// Leo Chen / Tax specialist) so the New Engagement wizard doesn't invent a second cast of characters.
const TEAM_ROSTER = [
  { initials: "JA", name: "Jasmine Alvarez" },
  { initials: "MK", name: "Meera Kapoor" },
  { initials: "OO", name: "Oscar Owner" },
  { initials: "LC", name: "Leo Chen" },
];
// Chart of Accounts templates — reuses the exact options already offered in the Data Foundation
// account-mapping tab, rather than inventing a second, inconsistent template list.
const COA_TEMPLATES = ["AssureAudit Nonprofit (US)", "Commercial", "EBP", "Fund", "Government"];
const CONTENT_PACKS = ["US Audit — Private Nonprofit", "US Audit — Commercial", "US Audit — Employee Benefit Plan", "US Audit — Government / Fund"];
const ACCOUNTABILITY_ROWS = ["Planning Activities", "Planning Approval", "Response to Risk Activities", "Completion Activities", "Completion Approval"];
const DEFAULT_ASSIGNEES = ["Jasmine Alvarez", "Meera Kapoor", "Jasmine Alvarez", "Leo Chen", "Oscar Owner"];
const DEFAULT_DUE_WEEKS = [2, 3, 6, 10, 11];

type ClientRecord = {
  slug: string;
  initials: string;
  name: string;
  industry: string;
  subIndustry: string;
  auditType: string;
  period: string;
  stage: string;
  progress: number;
  openItems: number;
  owner: string;
  due: string;
  documents: number;
  ready: boolean;
};

type EngagementMember = { initials:string; name:string; role:string; approval:string };
type ClientTeam = { firm:EngagementMember[]; client:EngagementMember[] };

const CLIENT_TEAMS: Record<string,ClientTeam> = {
  bbawc:{firm:[{initials:"OO",name:"Oscar Owner",role:"Engagement partner",approval:"Final approval"},{initials:"MK",name:"Meera Kapoor",role:"Engagement manager",approval:"Manager review"},{initials:"JA",name:"Jasmine Alvarez",role:"Senior auditor",approval:"Prepares & submits"},{initials:"LC",name:"Leo Chen",role:"Tax specialist",approval:"Consulted"}],client:[{initials:"DC",name:"Dana Collins",role:"Controller",approval:"Primary responder"},{initials:"RM",name:"Rina Morris",role:"Executive director",approval:"Management approval"},{initials:"AP",name:"Andre Price",role:"Board treasurer",approval:"Governance oversight"}]},
  harbor:{firm:[{initials:"OO",name:"Oscar Owner",role:"Engagement partner",approval:"Final approval"},{initials:"MK",name:"Meera Kapoor",role:"Engagement manager",approval:"Manager review"},{initials:"RP",name:"Ravi Patel",role:"Audit senior",approval:"Prepares & submits"}],client:[{initials:"NW",name:"Nora Wells",role:"Chief financial officer",approval:"Management approval"},{initials:"ET",name:"Evan Torres",role:"Accounting manager",approval:"Primary responder"}]},
  greenfield:{firm:[{initials:"OO",name:"Oscar Owner",role:"Engagement partner",approval:"Final approval"},{initials:"LC",name:"Leo Chen",role:"Engagement manager",approval:"Manager review"},{initials:"JA",name:"Jasmine Alvarez",role:"Auditor",approval:"Prepares & submits"}],client:[{initials:"SM",name:"Sofia Martin",role:"Finance director",approval:"Management approval"},{initials:"KL",name:"Kai Lee",role:"Property accountant",approval:"Primary responder"}]},
  metro:{firm:[{initials:"OO",name:"Oscar Owner",role:"Engagement partner",approval:"Pending assignment"}],client:[{initials:"AB",name:"Amelia Brooks",role:"Executive director",approval:"Engagement sponsor"}]},
  horizon:{firm:[{initials:"OO",name:"Oscar Owner",role:"Engagement partner",approval:"Final approval"},{initials:"MK",name:"Meera Kapoor",role:"Engagement manager",approval:"Manager review"},{initials:"LC",name:"Leo Chen",role:"EBP specialist",approval:"Prepares & submits"}],client:[{initials:"JT",name:"Jordan Taylor",role:"Plan administrator",approval:"Management approval"},{initials:"CH",name:"Casey Hall",role:"Benefits manager",approval:"Primary responder"}]},
  cedar:{firm:[{initials:"OO",name:"Oscar Owner",role:"Engagement partner",approval:"Final approval"},{initials:"MK",name:"Meera Kapoor",role:"Engagement manager",approval:"Manager review"},{initials:"JA",name:"Jasmine Alvarez",role:"Senior auditor",approval:"Prepares & submits"}],client:[{initials:"LM",name:"Lena Moore",role:"Chief financial officer",approval:"Management approval"},{initials:"TG",name:"Theo Grant",role:"Senior accountant",approval:"Primary responder"}]},
};

const CLIENTS: ClientRecord[] = [
  {slug:"bbawc",initials:"RY",name:"Riverside Youth & Family Services, Inc.",industry:"Nonprofit",subIndustry:"Youth & family services",auditType:"Financial Audit",period:"Dec 31, 2025",stage:"Data ingest",progress:63,openItems:4,owner:"Jasmine Alvarez",due:"Aug 18",documents:28,ready:true},
  {slug:"harbor",initials:"HC",name:"Harbor Community Foundation",industry:"Nonprofit",subIndustry:"Community foundation",auditType:"Financial Audit",period:"Jun 30, 2025",stage:"Workpapers",progress:42,openItems:2,owner:"Meera Kapoor",due:"Aug 21",documents:34,ready:true},
  {slug:"greenfield",initials:"GH",name:"Greenfield Housing Alliance",industry:"Real estate",subIndustry:"Affordable housing",auditType:"NFP Audit",period:"Sep 30, 2025",stage:"Data ingest",progress:28,openItems:6,owner:"Leo Chen",due:"Aug 16",documents:19,ready:true},
  {slug:"metro",initials:"MA",name:"Metro Arts Council",industry:"Nonprofit",subIndustry:"Arts & culture",auditType:"Fund Audit",period:"Jun 30, 2025",stage:"Setup required",progress:0,openItems:1,owner:"Unassigned",due:"Not set",documents:7,ready:false},
  {slug:"horizon",initials:"HR",name:"Horizon Retirement Plan",industry:"Employee benefits",subIndustry:"Defined contribution plan",auditType:"EBP Audit",period:"Dec 31, 2025",stage:"Review",progress:81,openItems:3,owner:"Oscar Owner",due:"Aug 14",documents:41,ready:true},
  {slug:"cedar",initials:"CG",name:"Cedar Grove Outreach",industry:"Nonprofit",subIndustry:"Human services",auditType:"Financial Audit",period:"Mar 31, 2025",stage:"Complete",progress:100,openItems:0,owner:"Meera Kapoor",due:"Complete",documents:52,ready:true},
];

const INDUSTRY_OPTIONS: Record<string,string[]> = {
  "Nonprofit": ["Charity", "Community foundation", "Arts & culture", "Youth & family services", "Human services", "Healthcare nonprofit"],
  "Real estate": ["Affordable housing", "Commercial real estate", "Property management", "Real estate investment"],
  "Employee benefits": ["Defined contribution plan", "Defined benefit plan", "Health & welfare plan"],
  "Government": ["Municipality", "School district", "Public authority", "State agency"],
  "Financial services": ["Credit union", "Investment adviser", "Insurance", "Fintech"],
};

export default function Home() {
  const [state, setState] = useState<DemoState>(defaultState);
  const [path, setPath] = useState("/dashboard");
  const [drawer, setDrawer] = useState("Comments");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("assureaudit-planning-demo");
    if (saved) setState({ ...defaultState, ...JSON.parse(saved) });
    setPath(window.location.pathname === "/" ? "/dashboard" : window.location.pathname);
    const pop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => { localStorage.setItem("assureaudit-planning-demo", JSON.stringify(state)); }, [state]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3200); return () => clearTimeout(t); }, [toast]);

  const navigate = (next: string) => {
    window.history.pushState({}, "", next); setPath(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const update = (patch: Partial<DemoState>, message?: string) => { setState(s => ({ ...s, ...patch })); if (message) setToast(message); };
  const isClient = state.role === "Client Contact";

  if (isClient || path.startsWith("/client-portal")) {
    return <ClientPortal state={state} update={update} onExit={() => { update({ role: "Auditor / Preparer" }); navigate("/dashboard"); }} />;
  }

  const planning = path.includes("/planning");
  const ingest = path.includes("/ingest");
  const fieldwork = path.includes("/fieldwork");
  const clientSlug = path.startsWith("/clients/") ? path.split("/")[2] : "";
  return (
    <div className="app-shell">
      <Sidebar path={path} navigate={navigate} state={state} update={update} mobileNav={mobileNav} setMobileNav={setMobileNav} />
      <main className="main-area">
        <Topbar path={path} state={state} update={update} navigate={navigate} onMenu={() => setMobileNav(!mobileNav)} demoOpen={demoOpen} setDemoOpen={setDemoOpen} />
        {ingest ? (
          <IngestWorkspace path={path} navigate={navigate} state={state} update={update}/>
        ) : fieldwork ? (
          <FieldworkShell path={path} navigate={navigate} state={state} update={update}/>
        ) : planning ? (
          <PlanningShell path={path} navigate={navigate} state={state} update={update} drawer={drawer} setDrawer={setDrawer} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} demoOpen={demoOpen} setDemoOpen={setDemoOpen} />
        ) : path === "/my-work" ? <MyWork navigate={navigate} state={state} update={update} /> : path === "/documents" ? <DocumentsCenter navigate={navigate} update={update} /> : path === "/engagements" || path === "/clients" ? <Engagements navigate={navigate} update={update} state={state} /> : clientSlug && path.endsWith("/documents") ? <DocumentsCenter initialSlug={clientSlug} navigate={navigate} update={update} /> : clientSlug ? <ClientOverview client={CLIENTS.find(c=>c.slug===clientSlug)||CLIENTS[0]} navigate={navigate} state={state} update={update} /> : path.startsWith("/engagement/") ? <ClientOverview client={CLIENTS[0]} navigate={navigate} state={state} update={update} /> : <Dashboard navigate={navigate} state={state} />}
      </main>
      {demoOpen && <DemoControls state={state} update={update} close={() => setDemoOpen(false)}/>} 
      {toast && <div className="toast sync-toast" role="status"><span className="toast-success"><Check/></span><div><strong>{/AssurePro|QuickBooks|sync|connector|connection/i.test(toast)?"Connected platform updated":"Action completed"}</strong><span>{toast}</span></div><button aria-label="Dismiss notification" onClick={()=>setToast("")}><X/></button></div>}
      <GlobalGuide path={path} open={guideOpen} setOpen={setGuideOpen} navigate={navigate}/>
    </div>
  );
}

function Sidebar({ path, navigate, state, update, mobileNav, setMobileNav }: { path: string; navigate: (p: string) => void; state: DemoState; update: (p: Partial<DemoState>, m?: string) => void; mobileNav: boolean; setMobileNav: (v: boolean) => void }) {
  const clientContext=path.startsWith("/engagement/")||path.startsWith("/clients/");
  const clientSlug=path.startsWith("/clients/")?path.split("/")[2]||"bbawc":path.startsWith("/engagement/")?path.split("/")[2]||"bbawc":"bbawc";
  const client=CLIENTS.find(c=>c.slug===clientSlug)||CLIENTS[0];
  const inPlanning=path.includes("/planning"); const inIngest=path.includes("/ingest"); const inFieldwork=path.includes("/fieldwork"); const active=path.split("/").pop()||"overview";
  const [planningOpen,setPlanningOpen]=useState(inPlanning||inFieldwork); const [ingestOpen,setIngestOpen]=useState(inIngest); const [productOpen,setProductOpen]=useState(false);
  const productRef=useDismiss(productOpen,()=>setProductOpen(false));
  useEffect(()=>{ if(inPlanning||inFieldwork) setPlanningOpen(true); }, [inPlanning,inFieldwork]);
  useEffect(()=>{ if(inIngest) setIngestOpen(true); }, [inIngest]);
  const ingestSteps=["Details","System","Trial balance","General ledger","Validate","Map accounts","Reconcile","Materiality"];
  return <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`} style={{transform: mobileNav ? "none" : undefined}}>
    <div className="product-switcher" ref={productRef}><button className="brand" aria-expanded={productOpen} onClick={()=>setProductOpen(!productOpen)}><img className="brand-logo" src="/assureaudit-logo.png" alt="AssureAudit"/><ChevronDown size={15}/></button>{productOpen&&<div className="product-menu"><small>Assure platform</small><button className="active" onClick={()=>setProductOpen(false)}><ShieldCheck/>AssureAudit <Check/></button><button onClick={()=>{setProductOpen(false);update({},"Return to AssurePro (simulated)")}}><BriefcaseBusiness/>AssurePro</button></div>}<button className="icon-btn close-mobile" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
    <nav>
      <button className={`nav-item ${path === "/dashboard" ? "active" : ""}`} onClick={() => navigate("/dashboard")}><LayoutDashboard/><span>Dashboard</span></button>
      <button className={`nav-item ${path === "/clients" || path === "/engagements" ? "active" : ""}`} onClick={() => navigate("/clients")}><Users/><span>Clients</span></button>
      <button className={`nav-item ${path === "/documents" ? "active" : ""}`} onClick={() => navigate("/documents")}><FolderOpen/><span>Documents</span></button>
      <button className={`nav-item ${path === "/my-work" ? "active" : ""}`} onClick={() => navigate("/my-work")}><ClipboardCheck/><span>My work</span><span className="nav-count">{myWorkBadgeCount(state)}</span></button>
      {!clientContext&&<><p className="nav-label branch-label">Client workspace</p><div className="client-workspace-nav workspace-preview"><button className="select-client-nav" onClick={()=>navigate("/clients")}><Search/><span>Select a client</span><ChevronRight/></button><button disabled><HomeIcon/><span>Overview</span><LockKeyhole className="branch-lock"/></button><button disabled><Database/><span>Data ingest</span><LockKeyhole className="branch-lock"/></button><button disabled><ClipboardCheck/><span>Workpapers</span><LockKeyhole className="branch-lock"/></button><button disabled><Search/><span>Fieldwork</span><LockKeyhole className="branch-lock"/></button><button disabled><FileCheck2/><span>Report</span><LockKeyhole className="branch-lock"/></button></div></>}
      {clientContext&&<><p className="nav-label branch-label">Client workspace</p><button className="sidebar-client-chip" onClick={()=>navigate(`/clients/${clientSlug}`)} title={`${client.name} — back to overview`}><i>{client.initials}</i><span><strong>{client.name}</strong><small>{client.industry}</small></span></button><div className="client-workspace-nav"><button className={path===`/clients/${clientSlug}`||path===`/engagement/${clientSlug}`?"active":""} onClick={()=>navigate(`/clients/${clientSlug}`)}><HomeIcon/><span>Overview</span></button>{!client.ready?<button className="setup-blocked-nav" disabled><AlertTriangle/><span>Finish setup in AssurePro</span><LockKeyhole className="branch-lock"/></button>:<><button className={`branch-parent ${inIngest?"active":""}`} onClick={()=>{setIngestOpen(!ingestOpen);if(!inIngest)navigate(`/engagement/${clientSlug}/ingest/details`)}}><Database/><span>Data ingest</span><b>{client.progress}%</b><ChevronDown className={ingestOpen?"rotated":""}/></button>{ingestOpen&&<div className="branch-children ingest-branch">{ingestSteps.map((label,i)=><button key={label} className={active===label.toLowerCase().replace(" ","-")?"active":""} onClick={()=>navigate(`/engagement/${clientSlug}/ingest/${label.toLowerCase().replace(" ","-")}`)}><i className={i<4?"approved":i===4?"warning":""}/><span>{label}</span></button>)}</div>}<button className={`branch-parent ${inPlanning?"active":""}`} onClick={()=>{setPlanningOpen(!planningOpen);if(!inPlanning)navigate(`/engagement/${clientSlug}/planning`)}}><ClipboardCheck/><span>Workpapers</span><b>{planningProgressPct(state)}%</b><ChevronDown className={planningOpen?"rotated":""}/></button>{planningOpen&&<div className="branch-children">{/* Materiality is intentionally not listed here — it lives only in Data Ingest; landing on /planning/materiality (e.g. a stale link) shows a banner pointing there instead of a dead sidebar entry. Planning's own workpaper board and insight rail already link to every sub-view (setup, entity-controls, risks, responses, publish), so this is a single entry rather than a partial duplicate list. */}<button className={inPlanning?"active":""} onClick={()=>navigate(`/engagement/${clientSlug}/planning`)}><i className={inPlanning?"progress":""}/><span>Planning</span><b>{planningProgressPct(state)}%</b></button><button className={inFieldwork?"active":""} onClick={()=>navigate(`/engagement/${clientSlug}/fieldwork`)}><i className={inFieldwork?"progress":state.fieldworkSynced?"approved":""}/><span>Fieldwork</span>{state.fieldworkSynced&&<b>Synced</b>}</button><button onClick={()=>update({},"Reporting unlocks after Fieldwork")}><i/><span>Report</span><LockKeyhole className="branch-lock"/></button></div>}</>}</div></>}
      <p className="nav-label practice">Firm</p><button className="nav-item" onClick={()=>update({},"Firm audit log opened (simulated)")}><History/><span>Firm audit log</span></button><button className="nav-item" disabled title="Template Library — coming soon. A firm-wide library of pre-defined engagement letter and service templates, ready to preview and add to any engagement."><FileText/><span>Template Library</span><LockKeyhole className="branch-lock"/></button>
    </nav>
    {/* Matches AssurePro's sidebar identity chip, which shows role + firm ("Owner · Patel &…").
        The top-right avatar is the profile menu — the reference carries both, so both stay. */}
    <div className="profile"><div className="avatar">OO</div><div><strong>Oscar Owner</strong><span>{state.role} · Patel &amp; Associates CPA</span></div></div>
  </aside>;
}

function Topbar({ path, state, update, navigate, onMenu, demoOpen, setDemoOpen }: { path:string; state: DemoState; update: (p: Partial<DemoState>, m?: string) => void; navigate: (p: string) => void; onMenu: () => void; demoOpen: boolean; setDemoOpen: (v: boolean) => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"All"|"Unread">("All");
  const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set());
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const items = attentionItems(state);
  const notifications = items.map((text,i)=>({text,route:notificationRoute(text),actor:NOTIF_ACTORS[i%NOTIF_ACTORS.length],time:NOTIF_TIMES[i%NOTIF_TIMES.length],read:readNotifs.has(text)}));
  const unreadCount = notifications.filter(n=>!n.read).length;
  const visibleNotifs = notifTab==="All"?notifications:notifications.filter(n=>!n.read);
  const markRead = (text:string)=>setReadNotifs(r=>new Set(r).add(text));
  const openNotification = (n:{text:string;route:string})=>{ markRead(n.text); setNotifOpen(false); navigate(n.route); };
  const notifRef=useDismiss(notifOpen,()=>setNotifOpen(false));
  const profileRef=useDismiss(profileOpen,()=>setProfileOpen(false));
  const searchItems = [
    { kind:"Page", title:"Firm dashboard", detail:"Portfolio, deadlines and review workload", route:"/dashboard", icon:LayoutDashboard },
    { kind:"Page", title:"Clients", detail:"All clients and assurance engagements", route:"/clients", icon:Users },
    { kind:"Page", title:"My work", detail:"Assigned tasks, approvals and reviews", route:"/my-work", icon:ClipboardCheck },
    ...CLIENTS.map(client=>({ kind:"Client", title:client.name, detail:`${client.auditType} · ${client.period}`, route:`/clients/${client.slug}`, icon:Building2 })),
    { kind:"Data ingest", title:"Engagement details", detail:"Industry, reporting period and source setup", route:"/engagement/bbawc/ingest/details", icon:FileText },
    { kind:"Data ingest", title:"Trial balance", detail:"Upload and validate the trial balance", route:"/engagement/bbawc/ingest/trial-balance", icon:FileSpreadsheet },
    { kind:"Data ingest", title:"General ledger", detail:"Upload and validate general ledger detail", route:"/engagement/bbawc/ingest/general-ledger", icon:Database },
    { kind:"Data ingest", title:"Map accounts", detail:"Map financial statement categories", route:"/engagement/bbawc/ingest/map-accounts", icon:Table2 },
    { kind:"Data ingest", title:"Reconcile data", detail:"Resolve control-total and mapping exceptions", route:"/engagement/bbawc/ingest/reconcile", icon:RefreshCw },
    { kind:"Data ingest", title:"Materiality & handoff", detail:"Benchmarks, thresholds and audit guidance", route:"/engagement/bbawc/ingest/materiality", icon:Gauge },
    { kind:"Workpaper", title:"Engagement Foundation", detail:"Acceptance, independence and engagement setup", route:"/engagement/bbawc/planning/setup", icon:ClipboardCheck },
    { kind:"Workpaper", title:"Understanding the Entity", detail:"Entity, environment and internal controls", route:"/engagement/bbawc/planning/entity-controls", icon:Building2 },
    { kind:"Workpaper", title:"Risk Assessment", detail:"Risks, assertions and audit responses", route:"/engagement/bbawc/planning/risks", icon:AlertTriangle },
    { kind:"Workpaper", title:"Audit Response", detail:"Procedures, owners and coverage", route:"/engagement/bbawc/planning/responses", icon:ListChecks },
    { kind:"Document", title:"Trial Balance — FY 2025.xlsx", detail:"Validated source document", route:"/engagement/bbawc/ingest/trial-balance", icon:FileSpreadsheet },
    { kind:"Document", title:"General Ledger Detail.csv", detail:"Processed source document", route:"/engagement/bbawc/ingest/general-ledger", icon:FileText },
  ];
  const normalizedQuery=searchQuery.trim().toLowerCase();
  const filteredSearchItems=searchItems.filter(item=>!normalizedQuery||`${item.kind} ${item.title} ${item.detail}`.toLowerCase().includes(normalizedQuery)).slice(0,9);
  const closeSearch=()=>{setSearchOpen(false);setSearchQuery("");};
  const openSearch=()=>{setSearchOpen(true);setNotifOpen(false);setProfileOpen(false);};
  const openSearchResult=(route:string)=>{closeSearch();navigate(route);};
  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{
      if ((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k") { event.preventDefault(); openSearch(); }
      if (event.key==="Escape") { closeSearch(); setNotifOpen(false); setProfileOpen(false); }
    };
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  },[]);
  return <header className="topbar">
    <button className="icon-btn hamburger" onClick={onMenu}><Menu size={20}/></button>
    <div className="topbar-popover global-search-wrap">
      <button className="global-search" aria-label="Search AssureAudit" aria-expanded={searchOpen} onClick={()=>searchOpen?closeSearch():openSearch()}><Search/><span>Search clients, workpapers, documents and tasks</span><kbd>⌘K</kbd></button>
      {searchOpen&&<><button className="search-dismiss-layer" aria-label="Close search" onClick={closeSearch}/><section className="global-search-menu" role="dialog" aria-label="Search AssureAudit">
        <div className="global-search-head"><div><strong>Search AssureAudit</strong><span>Go directly to a client, page, workpaper or document.</span></div><button className="icon-btn" aria-label="Close search" onClick={closeSearch}><X/></button></div>
        <label className="global-search-input"><Search/><input autoFocus aria-label="Search platform" placeholder="Search clients, tasks, workpapers or documents" value={searchQuery} onChange={event=>setSearchQuery(event.target.value)}/><kbd>ESC</kbd></label>
        <div className="global-search-results">
          {filteredSearchItems.map((item,index)=>{const ItemIcon=item.icon;return <button key={`${item.kind}-${item.title}-${index}`} onClick={()=>openSearchResult(item.route)}><span className="global-search-result-icon"><ItemIcon/></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><em>{item.kind}</em><ChevronRight/></button>})}
          {filteredSearchItems.length===0&&<div className="global-search-empty"><Search/><strong>No matching result</strong><span>Try a client name, workflow, workpaper or document.</span></div>}
        </div>
      </section></>}
    </div>
    <div className="top-actions">
      {path!=="/dashboard"&&<button className={`outline-action ${state.connector === "Expired" ? "danger-outline" : ""}`} onClick={() => update({ connector: "Connected" }, state.connector === "Connected" ? "AssurePro sync is current" : "Connection restored")}><ShieldCheck size={16}/>{state.connector === "Connected" ? "AssurePro synced" : "Reconnect"}</button>}
      <label className="year-select"><CalendarDays size={16}/><select aria-label="Financial year" value={state.fiscalYear} onChange={e=>update({fiscalYear:e.target.value},`Dashboard changed to ${e.target.value}`)}><option>FY 2026</option><option>FY 2025</option><option>FY 2024</option></select><ChevronDown size={14}/></label>
      <div className="topbar-popover" ref={notifRef}>
        <button className="icon-btn notification" aria-label={`Open notifications, ${unreadCount} unread`} aria-expanded={notifOpen} onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); closeSearch(); }}><Bell size={18}/>{unreadCount > 0 && <i>{unreadCount}</i>}</button>
        {notifOpen && <div className="dropdown-menu notif-menu">
          <div className="dropdown-head"><strong>Notifications</strong><span>{unreadCount} unread</span></div>
          <div className="notif-tabs">{(["All","Unread"] as const).map(t=><button key={t} className={notifTab===t?"active":""} onClick={()=>setNotifTab(t)}>{t}{t==="Unread"&&unreadCount>0&&<b>{unreadCount}</b>}</button>)}</div>
          {visibleNotifs.length === 0 ? <div className="dropdown-empty">{notifTab==="Unread"?"You're all caught up.":"Nothing needs attention right now."}</div> : visibleNotifs.map((n, i) => <div key={i} className={`notif-row ${n.read?"":"unread"}`}>
            <button className="notif-row-main" onClick={() => openNotification(n)}><AlertCircle size={14}/><span><strong>{n.text}</strong><small>{n.actor} · {n.time}</small></span></button>
            {!n.read && <button className="icon-btn notif-dismiss" title="Mark as read" onClick={()=>markRead(n.text)}><Check size={13}/></button>}
          </div>)}
        </div>}
      </div>
      <div className="topbar-popover" ref={profileRef}>
        <button className="avatar" aria-label="Open user profile" aria-expanded={profileOpen} title={state.role} onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); closeSearch(); }}>OO</button>
        {profileOpen && <div className="dropdown-menu profile-menu">
          <div className="dropdown-head"><strong>Oscar Owner</strong><span>Viewing as {state.role}</span></div>
          <button className="dropdown-item" onClick={() => { setProfileOpen(false); setDemoOpen(!demoOpen); }}><SlidersHorizontal size={14}/><span>Switch role</span></button>
          <button className="dropdown-item" onClick={() => { setProfileOpen(false); update({}, "Signed out (simulated) — this is a demo, no session was ended"); }}><LockKeyhole size={14}/><span>Sign out</span></button>
        </div>}
      </div>
    </div>
  </header>;
}

type WorkTask={id:number;title:string;clientSlug:string;type:"Collect"|"Prepare"|"Review"|"Approve"|"Admin";assignee:string;priority:"Urgent"|"High"|"Medium"|"Low";status:"Todo"|"In Progress"|"Blocked"|"Done";waitingOn:string;due:string;billable:boolean;description:string;stage:string;route?:string};
const ROLE_ASSIGNEE:Record<string,string>={"Auditor / Preparer":"Jasmine Alvarez","Manager":"Meera Kapoor","Partner":"Oscar Owner"};
function staffedClientSlugs(name:string):string[]{return CLIENTS.filter(c=>CLIENT_TEAMS[c.slug]?.firm.some(m=>m.name===name)).map(c=>c.slug)}
const TASK_TYPES=["Collect","Prepare","Review","Approve","Admin"] as const;
const TASK_PRIORITIES=["Urgent","High","Medium","Low"] as const;
const TASK_STATUSES=["Todo","In Progress","Blocked","Done"] as const;
function taskPriorityTone(p:string){return p==="Urgent"?"danger":p==="High"?"warning":p==="Medium"?"progress":"neutral"}
function taskStatusTone(s:string){return s==="Done"?"approved":s==="Blocked"?"danger":s==="In Progress"?"progress":"neutral"}
const WORK_TASKS:WorkTask[]=[
  {id:1,title:"Complete independence confirmations",clientSlug:"bbawc",type:"Approve",assignee:"Jasmine Alvarez",priority:"Urgent",status:"In Progress",waitingOn:"Not blocked",due:"Today",billable:true,description:"2 team confirmations remain outstanding before Commence can close.",stage:"Commence",route:"planning/setup"},
  {id:2,title:"Resolve audit-plan response gap",clientSlug:"bbawc",type:"Prepare",assignee:"Jasmine Alvarez",priority:"Urgent",status:"Blocked",waitingOn:"Risk assessment sign-off",due:"Aug 18",billable:true,description:"One significant risk has no responsive procedure yet.",stage:"Respond",route:"planning/responses"},
  {id:3,title:"Review risk assessment",clientSlug:"bbawc",type:"Review",assignee:"Meera Kapoor",priority:"High",status:"In Progress",waitingOn:"Not blocked",due:"Aug 16",billable:true,description:"78% complete — confirm significant and fraud risk flags before sign-off.",stage:"Identify & assess",route:"planning/risks"},
  {id:4,title:"Validate entity understanding",clientSlug:"bbawc",type:"Prepare",assignee:"Jasmine Alvarez",priority:"High",status:"In Progress",waitingOn:"Client response",due:"Aug 14",billable:true,description:"Client questionnaire response received; cross-check against policy handbook.",stage:"Understand",route:"planning/entity-controls"},
  {id:5,title:"Review account mapping exceptions",clientSlug:"bbawc",type:"Review",assignee:"Jasmine Alvarez",priority:"High",status:"In Progress",waitingOn:"Not blocked",due:"Aug 13",billable:true,description:"4 accounts still need mapping review before reconciliation.",stage:"Data ingest",route:"ingest/map-accounts"},
  {id:6,title:"Approve planning communications",clientSlug:"bbawc",type:"Approve",assignee:"Oscar Owner",priority:"Medium",status:"Todo",waitingOn:"Manager approval",due:"Aug 20",billable:false,description:"Final Partner sign-off once Manager review is complete.",stage:"Approve",route:"planning/publish"},
  {id:7,title:"Prepare workpaper index for review",clientSlug:"harbor",type:"Prepare",assignee:"Ravi Patel",priority:"Medium",status:"In Progress",waitingOn:"Not blocked",due:"Aug 21",billable:true,description:"Assemble completed workpapers for Manager review.",stage:"Workpapers"},
  {id:8,title:"Review workpapers for FY 2025",clientSlug:"harbor",type:"Review",assignee:"Meera Kapoor",priority:"Medium",status:"Todo",waitingOn:"Ravi Patel · workpaper index",due:"Aug 22",billable:true,description:"Second-level review of prepared workpapers.",stage:"Workpapers"},
  {id:9,title:"Resolve 6 data-ingest validation exceptions",clientSlug:"greenfield",type:"Collect",assignee:"Jasmine Alvarez",priority:"Urgent",status:"In Progress",waitingOn:"Not blocked",due:"Aug 16",billable:true,description:"Transaction-splitting batches need auditor review before mapping.",stage:"Data ingest",route:"ingest/validate"},
  {id:10,title:"Follow up on trial balance upload",clientSlug:"greenfield",type:"Collect",assignee:"Leo Chen",priority:"High",status:"Blocked",waitingOn:"Client upload",due:"Aug 15",billable:false,description:"Client has not yet uploaded the prior-year closing trial balance.",stage:"Data ingest"},
  {id:11,title:"Complete engagement setup in AssurePro",clientSlug:"metro",type:"Admin",assignee:"Oscar Owner",priority:"High",status:"Todo",waitingOn:"Not blocked",due:"Not set",billable:false,description:"Engagement letter, period and team assignment are still required before Data Ingest can open.",stage:"Setup"},
  {id:12,title:"Complete Manager review sign-off",clientSlug:"horizon",type:"Review",assignee:"Meera Kapoor",priority:"Medium",status:"In Progress",waitingOn:"Not blocked",due:"Aug 14",billable:true,description:"Workpapers are 81% complete; sign off remaining EBP procedures.",stage:"Review"},
  {id:13,title:"Confirm plan administrator representations",clientSlug:"horizon",type:"Collect",assignee:"Leo Chen",priority:"Low",status:"Todo",waitingOn:"Client response",due:"Aug 19",billable:true,description:"Awaiting signed representation letter from Jordan Taylor.",stage:"Completion"},
  {id:14,title:"Archive engagement file",clientSlug:"cedar",type:"Admin",assignee:"Meera Kapoor",priority:"Low",status:"Todo",waitingOn:"Not blocked",due:"Not set",billable:false,description:"Engagement is complete; finalize retention and archive per firm policy.",stage:"Completion"},
];
const WORKFLOW_STAGES=["Intake","Ingest","Review","Delivered"] as const;
type WorkflowStage=typeof WORKFLOW_STAGES[number];
const WORKFLOW_STAGE_TONE:Record<WorkflowStage,string>={Intake:"danger",Ingest:"progress",Review:"warning",Delivered:"approved"};
function clientToWorkflowStage(stage:string):WorkflowStage{
  if(stage==="Setup required")return "Intake";
  if(stage==="Data ingest")return "Ingest";
  if(stage==="Workpapers"||stage==="Review")return "Review";
  return "Delivered";
}
const WORKFLOW_ROLE_LETTERS=["P","R","S","A"] as const;
function buildTeamSlots(slug:string,assignedCount:number):{initials:string;named:boolean}[]{
  const firm=CLIENT_TEAMS[slug].firm;
  return WORKFLOW_ROLE_LETTERS.map((letter,i)=>i<assignedCount&&firm[i]?{initials:firm[i].initials,named:true}:{initials:letter,named:false});
}
type WorkflowCard={id:string;clientSlug:string|null;name:string;type:string;category:string;flagged:boolean;overdue:boolean;due:string;daysInStage:number;started:string;value:number;checklistDone:number;checklistTotal:number;team:{initials:string;named:boolean}[];stage:WorkflowStage};
function seedWorkflowCards():WorkflowCard[]{
  const seed=[
    {slug:"bbawc",flagged:true,overdue:false,due:"Aug 18",days:5,started:"Aug 12",value:42000,done:4,total:7,assigned:4},
    {slug:"harbor",flagged:false,overdue:false,due:"Aug 21",days:7,started:"Aug 13",value:36500,done:3,total:6,assigned:2},
    {slug:"greenfield",flagged:false,overdue:true,due:"Aug 16",days:3,started:"Aug 14",value:28750,done:2,total:5,assigned:2},
    {slug:"metro",flagged:false,overdue:false,due:"No date",days:1,started:"Aug 17",value:18000,done:0,total:3,assigned:0},
    {slug:"horizon",flagged:false,overdue:false,due:"Aug 14",days:9,started:"Aug 9",value:54000,done:6,total:8,assigned:3},
    {slug:"cedar",flagged:false,overdue:false,due:"Complete",days:14,started:"Aug 4",value:61200,done:9,total:9,assigned:3},
  ];
  return seed.map(s=>{
    const client=CLIENTS.find(c=>c.slug===s.slug)!;
    const team=buildTeamSlots(s.slug,s.assigned);
    return {id:s.slug,clientSlug:s.slug,name:client.name,type:client.auditType,category:client.subIndustry,flagged:s.flagged,overdue:s.overdue,due:s.due,daysInStage:s.days,started:s.started,value:s.value,checklistDone:s.done,checklistTotal:s.total,team,stage:clientToWorkflowStage(client.stage)};
  });
}
function WorkflowProgressRing({done,total}:{done:number;total:number}){
  const pct=total>0?Math.min(1,done/total):0;
  const r=9,c=2*Math.PI*r;
  return <span className="workflow-progress-ring">
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r={r} fill="none" stroke="var(--line)" strokeWidth="2.5"/>
      <circle cx="11" cy="11" r={r} fill="none" stroke="var(--violet)" strokeWidth="2.5" strokeDasharray={`${c*pct} ${c}`} strokeLinecap="round" transform="rotate(-90 11 11)"/>
    </svg>
    <b>{done}/{total}</b>
  </span>;
}
function WorkflowEngagements({view,navigate,update}:{view:"Board"|"List";navigate:(p:string)=>void;update:(p:Partial<DemoState>,m?:string)=>void}){
  const [cards,setCards]=useState<WorkflowCard[]>(seedWorkflowCards);
  const [dragId,setDragId]=useState<string|null>(null);
  const [collapsedCols,setCollapsedCols]=useState<Record<string,boolean>>({});
  const [query,setQuery]=useState("");
  const [typeFilter,setTypeFilter]=useState("All engagements");
  const [typeOpen,setTypeOpen]=useState(false);
  const typeRef=useDismiss(typeOpen,()=>setTypeOpen(false));
  const [displayOpen,setDisplayOpen]=useState(false);
  const displayRef=useDismiss(displayOpen,()=>setDisplayOpen(false));
  const [showAvatars,setShowAvatars]=useState(true);
  const [showCategory,setShowCategory]=useState(true);

  const types=Array.from(new Set(cards.map(c=>c.type)));
  const visible=cards.filter(c=>(typeFilter==="All engagements"||c.type===typeFilter)&&c.name.toLowerCase().includes(query.toLowerCase()));
  const intakeValue=visible.filter(c=>c.stage==="Intake").reduce((s,c)=>s+c.value,0);
  const newEngagement=()=>update({},"New engagements are created in AssurePro — you'll be redirected there to continue.");

  const moveCard=(id:string,to:WorkflowStage)=>{
    const card=cards.find(c=>c.id===id);
    setDragId(null);
    if(!card||card.stage===to)return;
    setCards(cs=>cs.map(c=>c.id===id?{...c,stage:to,daysInStage:0,started:"Today"}:c));
    update({},`Engagement moved — ${card.name} moved from ${card.stage} to ${to}`);
  };

  return <>
    <div className="workflow-toolbar">
      <div className="topbar-popover" ref={typeRef}>
        <button className="secondary-btn" onClick={()=>setTypeOpen(v=>!v)}>{typeFilter} <b className="count-inline">{typeFilter==="All engagements"?cards.length:cards.filter(c=>c.type===typeFilter).length}</b><ChevronDown size={14}/></button>
        {typeOpen&&<div className="dropdown-menu">
          <button className={`dropdown-item ${typeFilter==="All engagements"?"active":""}`} onClick={()=>{setTypeFilter("All engagements");setTypeOpen(false)}}>All engagements <b className="count-inline">{cards.length}</b></button>
          {types.map(t=><button key={t} className={`dropdown-item ${typeFilter===t?"active":""}`} onClick={()=>{setTypeFilter(t);setTypeOpen(false)}}>{t} <b className="count-inline">{cards.filter(c=>c.type===t).length}</b></button>)}
        </div>}
      </div>
      <span className="workflow-pipeline-badge">Pipeline <b>{money(intakeValue)}</b></span>
      <div className="search no-margin workflow-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search engagements…"/></div>
      <button className="primary-btn" onClick={newEngagement}><Plus size={15}/>New Engagement</button>
      <div className="topbar-popover" ref={displayRef}>
        <button className="secondary-btn" onClick={()=>setDisplayOpen(v=>!v)}><SlidersHorizontal size={14}/>Display</button>
        {displayOpen&&<div className="dropdown-menu display-menu">
          <div className="dropdown-head"><strong>Display properties</strong><span>Choose what shows on each card</span></div>
          <label className="dropdown-check"><input type="checkbox" checked={showAvatars} onChange={()=>setShowAvatars(v=>!v)}/><span>Show team avatars</span></label>
          <label className="dropdown-check"><input type="checkbox" checked={showCategory} onChange={()=>setShowCategory(v=>!v)}/><span>Show category</span></label>
        </div>}
      </div>
    </div>
    {view==="Board"?<div className="kanban-board workflow-kanban-board">
      {WORKFLOW_STAGES.map(stage=>{
        const rows=visible.filter(c=>c.stage===stage);
        const isCollapsed=collapsedCols[stage];
        return <div key={stage} className={`kanban-column workflow-column ${isCollapsed?"collapsed":""}`} onDragOver={e=>e.preventDefault()} onDrop={()=>dragId&&moveCard(dragId,stage)}>
          <div className="kanban-column-head"><span><i className={`tone-dot ${WORKFLOW_STAGE_TONE[stage]}`}/>{stage}</span><span className="workflow-col-actions">{stage==="Intake"&&intakeValue>0&&<b className="workflow-col-value">{money(intakeValue)}</b>}<b>{rows.length}</b><button className="icon-btn" title={isCollapsed?"Expand column":"Collapse column"} onClick={()=>setCollapsedCols(c=>({...c,[stage]:!c[stage]}))}><ChevronLeft size={13}/></button><button className="icon-btn" title="New engagement" onClick={newEngagement}><Plus size={13}/></button></span></div>
          {!isCollapsed&&<>
            {rows.map(card=><button key={card.id} className="kanban-card workflow-card" draggable onDragStart={()=>setDragId(card.id)} onClick={()=>card.clientSlug&&navigate(`/clients/${card.clientSlug}`)}>
              {card.flagged&&<span className="workflow-card-flag"><AlertTriangle size={11}/></span>}
              <span className="workflow-card-tag">{card.type}</span>
              <span className="workflow-card-name">{card.name}</span>
              {showCategory&&card.category&&<span className="workflow-card-category">{card.category}</span>}
              <span className="workflow-card-row">
                {showAvatars&&<span className="workflow-avatar-row">{card.team.map((m,i)=><i key={i} className={`workflow-avatar ${m.named?"":"placeholder"}`}>{m.initials}</i>)}</span>}
                <span className={`workflow-due-pill ${card.overdue?"danger":""}`}><CalendarDays size={11}/>{card.due}</span>
              </span>
              <span className="workflow-card-footer">
                <span className="workflow-card-footer-text"><Clock3 size={11}/>{card.daysInStage===0?"Today":`${card.daysInStage}d in stage`} · Started {card.started}</span>
                <WorkflowProgressRing done={card.checklistDone} total={card.checklistTotal}/>
              </span>
            </button>)}
            {rows.length===0&&<p className="panel-empty-text">No engagements</p>}
          </>}
        </div>;
      })}
    </div>:<div className="table-card">
      <div className="workflow-list-head"><span>Engagement</span><span>Stage</span>{showAvatars&&<span>Team</span>}<span>Value</span><span>Progress</span><span>Due</span><span/></div>
      {[...visible].sort((a,b)=>WORKFLOW_STAGES.indexOf(a.stage)-WORKFLOW_STAGES.indexOf(b.stage)).map(card=><button key={card.id} className="workflow-list-row" onClick={()=>card.clientSlug&&navigate(`/clients/${card.clientSlug}`)}>
        <span className="portfolio-client">{card.flagged&&<AlertTriangle size={13} className="workflow-list-flag"/>}<span><strong>{card.name}</strong><small>{card.type}{showCategory&&card.category?` · ${card.category}`:""}</small></span></span>
        <span className="workflow-list-stage"><i className={`tone-dot ${WORKFLOW_STAGE_TONE[card.stage]}`}/>{card.stage}</span>
        {showAvatars&&<span className="workflow-avatar-row">{card.team.map((m,i)=><i key={i} className={`workflow-avatar ${m.named?"":"placeholder"}`}>{m.initials}</i>)}</span>}
        <span>{money(card.value)}</span>
        <span><WorkflowProgressRing done={card.checklistDone} total={card.checklistTotal}/></span>
        <span className={card.overdue?"workflow-due-pill danger":""}>{card.due}</span>
        <ChevronRight/>
      </button>)}
      {visible.length===0&&<div className="clients-empty"><Search/><h3>No engagements match</h3><p>Clear filters or search to see the full pipeline.</p></div>}
    </div>}
  </>;
}
function myWorkBadgeCount(state:DemoState):number{
  const name=ROLE_ASSIGNEE[state.role];
  if(!name)return 0;
  const allowed=staffedClientSlugs(name);
  return WORK_TASKS.filter(t=>(!t.clientSlug||allowed.includes(t.clientSlug))&&t.assignee===name&&(t.priority==="Urgent"||t.status==="Blocked")).length;
}
function MyWork({ navigate, state, update }: { navigate:(p:string)=>void; state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const [tasks,setTasks]=useState<WorkTask[]>(WORK_TASKS);
  const [view,setView]=useState<"Board"|"List"|"Tasks">("Board");
  const [scope,setScope]=useState<"All"|"My tasks">("My tasks");
  const [selectedId,setSelectedId]=useState<number|null>(null);
  const [createOpen,setCreateOpen]=useState(false);
  const [displayOpen,setDisplayOpen]=useState(false);
  const displayRef=useDismiss(displayOpen,()=>setDisplayOpen(false));
  const [collapsed,setCollapsed]=useState<Record<string,boolean>>({});

  const myName=ROLE_ASSIGNEE[state.role]||"";
  const isAdmin=state.role==="Firm Administrator";
  const canReassign=state.role==="Manager"||state.role==="Partner"||isAdmin;
  const allowedSlugs=isAdmin?null:staffedClientSlugs(myName);
  const teamOptions=Array.from(new Set(Object.values(CLIENT_TEAMS).flatMap(t=>t.firm.map(m=>m.name))));

  const inHierarchy=(t:WorkTask)=>!allowedSlugs||!t.clientSlug||allowedSlugs.includes(t.clientSlug);
  const inScope=(t:WorkTask)=>scope==="All"||t.assignee===myName;
  const visible=tasks.filter(t=>inHierarchy(t)&&inScope(t));
  const myTasksTotal=tasks.filter(t=>inHierarchy(t)&&t.assignee===myName).length;
  const urgentCount=tasks.filter(t=>inHierarchy(t)&&t.assignee===myName&&t.priority==="Urgent").length;
  const blockedCount=tasks.filter(t=>inHierarchy(t)&&t.assignee===myName&&t.status==="Blocked").length;
  const next=[...visible].filter(t=>t.status!=="Done").sort((a,b)=>TASK_PRIORITIES.indexOf(a.priority)-TASK_PRIORITIES.indexOf(b.priority))[0];

  const groups=Array.from(new Set(visible.map(t=>t.clientSlug))).sort((a,b)=>{
    const an=a?CLIENTS.find(c=>c.slug===a)?.name||a:"Firm tasks"; const bn=b?CLIENTS.find(c=>c.slug===b)?.name||b:"Firm tasks";
    return an.localeCompare(bn);
  });

  const updateTask=(id:number,patch:Partial<WorkTask>)=>setTasks(ts=>ts.map(t=>t.id===id?{...t,...patch}:t));
  const toggleDone=(task:WorkTask)=>{const done=task.status==="Done";updateTask(task.id,{status:done?"Todo":"Done"});update({},`"${task.title}" ${done?"reopened":"marked done"}`)};
  const createTask=(t:Omit<WorkTask,"id"|"status">)=>{
    const id=Math.max(0,...tasks.map(x=>x.id))+1;
    setTasks(ts=>[{...t,id,status:"Todo"},...ts]);
    update({},`Task "${t.title}" created and assigned to ${t.assignee}`);
    setCreateOpen(false);
  };

  return <div className="page my-work-page"><div className="page-heading"><div><p className="eyebrow">Synced from AssurePro</p><h1>My work</h1><p>Tasks flow from AssurePro's Workflow module and stay in sync — edits here update AssurePro too.</p></div>{view!=="Board"&&<div className="my-work-summary"><span><strong>{urgentCount}</strong> urgent</span><span><strong>{blockedCount}</strong> blocked</span></div>}</div>
    {next&&<section className="my-work-next"><div className="next-work-icon"><Zap/></div><div><span>Start here</span><h2>{next.title}</h2><p>{next.clientSlug?CLIENTS.find(c=>c.slug===next.clientSlug)?.name:"Firm task"} · {next.stage} · Due {next.due.toLowerCase()}</p></div><span className={`status-pill ${taskStatusTone(next.status)}`}>{next.status}</span><button className="primary-btn" onClick={()=>next.clientSlug&&next.route?navigate(`/engagement/${next.clientSlug}/${next.route}`):setSelectedId(next.id)}>Open task <ArrowRight/></button></section>}
    <div className="subtabs">{(["Board","List","Tasks"] as const).map(v=><button key={v} className={view===v?"active":""} onClick={()=>setView(v)}>{v}</button>)}</div>
    {(view==="Board"||view==="List")?<WorkflowEngagements view={view} navigate={navigate} update={update}/>:<>
    <div className="my-work-toolbar">
      <div className="my-work-filters">{(["All","My tasks"] as const).map(s=><button key={s} className={scope===s?"active":""} onClick={()=>setScope(s)}>{s}{s==="My tasks"&&<span>{myTasksTotal}</span>}</button>)}</div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div className="topbar-popover" ref={displayRef}><button className="secondary-btn" onClick={()=>setDisplayOpen(!displayOpen)}><Filter size={14}/>Display</button>{displayOpen&&<div className="dropdown-menu display-menu"><div className="dropdown-head"><strong>Grouped by client</strong><span>Matches AssurePro's Workflow &gt; Tasks view</span></div><label className="dropdown-check"><input type="checkbox" checked disabled/><span>Group by client</span></label></div>}</div>
        <button className="primary-btn" onClick={()=>setCreateOpen(true)}><Plus size={15}/>New task</button>
      </div>
    </div>
    {visible.length===0&&<div className="work-empty"><CheckCircle2/><h3>No work in this view</h3><p>Choose another filter to see assigned tasks.</p></div>}
    {groups.map(slug=>{
      const rows=visible.filter(t=>t.clientSlug===slug);
      const clientName=slug?CLIENTS.find(c=>c.slug===slug)?.name||slug:"Firm tasks (no client)";
      const isOpen=!collapsed[slug];
      return <section className="workpaper-stage" key={slug||"__firm"}><button className="stage-toggle" onClick={()=>setCollapsed(c=>({...c,[slug]:isOpen}))}><span><strong>{clientName}</strong><small>{rows.length} task{rows.length===1?"":"s"}</small></span><span className="stage-progress">{isOpen?<ChevronDown/>:<ChevronRight/>}</span></button>
        {isOpen&&<div className="stage-rows">{rows.map(task=><Fragment key={task.id}>
          <button className="work-queue-row" onClick={()=>setSelectedId(selectedId===task.id?null:task.id)}>
            <span className={`task-check ${task.status==="Done"?"done":""}`} onClick={e=>{e.stopPropagation();toggleDone(task)}}>{task.status==="Done"?<CheckCircle2/>:<Circle/>}</span>
            <span className="queue-title"><strong className={task.status==="Done"?"done-strike":""}>{task.title}</strong><small>{task.type} · {task.stage}</small></span>
            <span className="queue-progress"><span className={`priority-chip ${taskPriorityTone(task.priority)}`}><BarChart3 size={12}/>{task.priority}</span></span>
            <i className="person-avatar violet">{task.assignee.split(" ").map(n=>n[0]).join("").slice(0,2)}</i>
            <span className="queue-due"><small>Due</small><strong>{task.due}</strong></span>
            <ChevronRight/>
          </button>
          {selectedId===task.id&&<TaskDetailInline task={task} canReassign={canReassign} teamOptions={teamOptions} onUpdate={patch=>updateTask(task.id,patch)} navigate={navigate} update={update}/>}
        </Fragment>)}</div>}
      </section>;
    })}
    {createOpen&&<CreateTaskModal close={()=>setCreateOpen(false)} onCreate={createTask} restrictAssigneeToSelf={!canReassign} defaultAssignee={myName||"Oscar Owner"} teamOptions={teamOptions}/>}
    </>}
  </div>;
}
function TaskDetailInline({task,canReassign,teamOptions,onUpdate,navigate,update,close}:{task:WorkTask;canReassign:boolean;teamOptions:string[];onUpdate:(p:Partial<WorkTask>)=>void;navigate:(p:string)=>void;update:(p:Partial<DemoState>,m?:string)=>void;close?:()=>void}){
  const [description,setDescription]=useState(task.description);
  const client=task.clientSlug?CLIENTS.find(c=>c.slug===task.clientSlug):null;
  const fields=<>
    <div className="field-block"><span>Engagement</span>{client?<button className="text-link" onClick={()=>navigate(`/clients/${client.slug}`)}>{client.name} <ArrowRight size={13}/></button>:<strong>Standalone (no engagement)</strong>}</div>
    <div className="field-block"><span>Assignee</span>{canReassign?<select value={task.assignee} onChange={e=>onUpdate({assignee:e.target.value})}>{teamOptions.map(n=><option key={n}>{n}</option>)}</select>:<strong>{task.assignee} <LockKeyhole size={11}/></strong>}</div>
    <div className="field-block"><span>Priority</span><select value={task.priority} onChange={e=>onUpdate({priority:e.target.value as WorkTask["priority"]})}>{TASK_PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div>
    <div className="field-block"><span>Status</span><select value={task.status} onChange={e=>{onUpdate({status:e.target.value as WorkTask["status"]});update({},`"${task.title}" marked ${e.target.value}`)}}>{TASK_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
    <div className="field-block"><span>Type</span><strong>{task.type}</strong></div>
    <div className="field-block"><span>Waiting on</span><input value={task.waitingOn} onChange={e=>onUpdate({waitingOn:e.target.value})}/></div>
    <div className="field-block"><span>Due</span><input value={task.due} onChange={e=>onUpdate({due:e.target.value})}/></div>
    <div className="field-block"><span>Billable</span><label className="checkbox-row"><input type="checkbox" checked={task.billable} onChange={e=>onUpdate({billable:e.target.checked})}/><span>{task.billable?"Billable":"Non-billable"}</span></label></div>
    {task.route&&client&&<div className="field-block"><span>Workpaper</span><button className="text-link" onClick={()=>navigate(`/engagement/${client.slug}/${task.route}`)}>Open in Planning <ArrowRight size={13}/></button></div>}
    <textarea value={description} onChange={e=>setDescription(e.target.value)} onBlur={()=>onUpdate({description})} placeholder="Add a description…"/>
    {!canReassign&&<p className="restriction-note"><LockKeyhole size={12}/>Preparers can update status and notes, but reassigning tasks requires a Manager or Partner.</p>}
  </>;
  if(close)return <div className="detail-drawer">
    <div className="drawer-head"><div><span className={`status-pill ${taskStatusTone(task.status)}`}>{task.status}</span><h2>{task.title}</h2></div><button className="icon-btn" onClick={close}><X/></button></div>
    <div className="drawer-body"><div className="task-detail-inline" style={{margin:0}}>{fields}</div></div>
  </div>;
  return <div className="task-detail-inline">{fields}</div>;
}
function CreateTaskModal({close,onCreate,restrictAssigneeToSelf,defaultAssignee,teamOptions}:{close:()=>void;onCreate:(t:Omit<WorkTask,"id"|"status">)=>void;restrictAssigneeToSelf:boolean;defaultAssignee:string;teamOptions:string[]}){
  const [title,setTitle]=useState("");
  const [type,setType]=useState<WorkTask["type"]>("Prepare");
  const [clientSlug,setClientSlug]=useState("");
  const [assignee,setAssignee]=useState(defaultAssignee);
  const [priority,setPriority]=useState<WorkTask["priority"]>("Medium");
  const [due,setDue]=useState("");
  const [waitingOn,setWaitingOn]=useState("Not blocked");
  const [notes,setNotes]=useState("");
  const client=CLIENTS.find(c=>c.slug===clientSlug);
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>Create task</h2><p>Adds a task to the firm workflow — syncs to AssurePro.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <Field label="Title" required><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Collect bank statements"/></Field>
    <div className="form-grid">
      <Field label="Type"><select value={type} onChange={e=>setType(e.target.value as WorkTask["type"])}>{TASK_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field>
      <Field label="Client (optional)"><select value={clientSlug} onChange={e=>setClientSlug(e.target.value)}><option value="">Standalone (no client)</option>{CLIENTS.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></Field>
    </div>
    <div className="form-grid">
      <Field label="Assign to">{restrictAssigneeToSelf?<input value={assignee} readOnly/>:<select value={assignee} onChange={e=>setAssignee(e.target.value)}>{teamOptions.map(n=><option key={n}>{n}</option>)}</select>}</Field>
      <Field label="Priority"><select value={priority} onChange={e=>setPriority(e.target.value as WorkTask["priority"])}>{TASK_PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></Field>
    </div>
    <div className="form-grid">
      <Field label="Due date"><input placeholder="e.g. Aug 25" value={due} onChange={e=>setDue(e.target.value)}/></Field>
      <Field label="Waiting on"><input value={waitingOn} onChange={e=>setWaitingOn(e.target.value)} placeholder="Not blocked"/></Field>
    </div>
    <Field label="Notes"><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional notes…"/></Field>
    {restrictAssigneeToSelf&&<p className="restriction-note"><LockKeyhole size={12}/>Preparers can only create tasks assigned to themselves — ask a Manager or Partner to assign work to others.</p>}
    <div className="modal-actions"><button className="secondary-btn" onClick={close}>Cancel</button><button className="primary-btn" disabled={!title.trim()} onClick={()=>onCreate({title,type,clientSlug,assignee,priority,due:due.trim()||"No date",waitingOn,billable:true,description:notes,stage:client?"Intake":"Admin"})}>Create task</button></div>
  </div></div>;
}

function Dashboard({ navigate, state }: { navigate: (p: string) => void; state: DemoState }) {
  const stageCount=(s:WorkflowStage)=>CLIENTS.filter(c=>clientToWorkflowStage(c.stage)===s).length;
  const pipeline=[
    {name:"Intake",value:stageCount("Intake"),color:"#E0D9FF"},
    {name:"Ingest",value:stageCount("Ingest"),color:"#6B46FF"},
    {name:"Review",value:stageCount("Review"),color:"#A38FFF"},
    {name:"Delivered",value:stageCount("Delivered"),color:"#C1B3FF"},
  ].filter(s=>s.value>0);
  const due=[{name:"Overdue",value:2},{name:"0–7 days",value:5},{name:"8–14 days",value:3},{name:"15+ days",value:1}];
  return <div className="page firm-dashboard">
    <div className="page-heading"><div><p className="eyebrow">Firm overview · {state.fiscalYear}</p><h1>Audit portfolio</h1><p>Every client, deadline and engagement stage in one view.</p></div><button className="primary-btn" onClick={()=>navigate("/clients")}><Users/>View clients</button></div>
    <section className="portfolio-kpis"><article><span>Active engagements</span><strong>6</strong><small>Across 6 clients</small></article><article><span>Need attention</span><strong>4</strong><small>2 due today</small></article><article><span>In data ingest</span><strong>2</strong><small>10 source files received</small></article><article><span>Awaiting review</span><strong>1</strong><small>Partner review due Aug 14</small></article></section>
    <div className="portfolio-grid">
      <section className="portfolio-card pipeline-card"><div className="section-title"><div><h2>Engagement pipeline</h2><p>Current stage across active engagements.</p></div><button className="text-link" onClick={()=>navigate("/clients")}>All clients <ArrowRight/></button></div><div className="pipeline-body"><div className="portfolio-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pipeline} dataKey="value" innerRadius={64} outerRadius={91} paddingAngle={2} isAnimationActive={false}>{pipeline.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip position={{x:16,y:-36}} formatter={(v:any,name:any)=>[`${v} engagement${v===1?"":"s"}`,name]}/></PieChart></ResponsiveContainer><span><strong>{CLIENTS.length}</strong><small>engagements</small></span></div><div className="pipeline-legend">{pipeline.map(x=><div key={x.name}><i style={{background:x.color}}/><span>{x.name}</span><strong>{x.value}</strong></div>)}</div></div></section>
      <section className="portfolio-card due-card"><div className="section-title"><div><h2>Work by due date</h2><p>Open actions across the firm.</p></div><InfoTip title="Work by due date" text="Counts assigned audit actions, review notes and data requests by their next due date." standard="Firm workflow"/></div><div className="firm-due-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={due} layout="vertical" margin={{left:8,right:22}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={78} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="value" radius={[0,7,7,0]}>{due.map((_,i)=><Cell key={i} fill={["#6B46FF","#8164FF","#A38FFF","#D2C7FF"][i]}/>)}</Bar></BarChart></ResponsiveContainer></div></section>
    </div>
    <section className="portfolio-card client-portfolio-card"><div className="section-title"><div><h2>Client portfolio</h2><p>Open a client to see its overview, documents and engagement workflow.</p></div><button className="secondary-btn" onClick={()=>navigate("/clients")}>View all <ArrowRight/></button></div><div className="portfolio-table-head"><span>Client</span><span>Current stage</span><span>Team</span><span>Owner</span><span>Next due</span><span/></div>{CLIENTS.slice(0,5).map(c=><button className="portfolio-row" key={c.slug} onClick={()=>navigate(`/clients/${c.slug}`)}><span className="portfolio-client"><i>{c.initials}</i><span><strong>{c.name}</strong><small>{c.auditType} · {c.industry}</small></span></span><span><em className={`status-pill ${WORKFLOW_STAGE_TONE[clientToWorkflowStage(c.stage)]}`}>{clientToWorkflowStage(c.stage)}</em></span>{clientCell(c,"team")}<span>{c.owner}</span><span className={c.due==="Aug 14"||c.due==="Aug 16"?"due-soon":""}>{c.due}</span><ChevronRight/></button>)}</section>
  </div>;
}

const CLIENT_COLUMNS=[
  {key:"stage",label:"Current stage"},
  {key:"progress",label:"Progress"},
  {key:"owner",label:"Owner"},
  {key:"due",label:"Next due"},
  {key:"industry",label:"Industry"},
  {key:"documents",label:"Documents"},
  {key:"openItems",label:"Open items"},
  {key:"team",label:"Team"},
];
const CLIENT_COLUMNS_DEFAULT=["stage","progress","owner","due"];
function clientCell(c:ClientRecord,key:string){
  if(key==="stage")return <span key={key}><em className={`status-pill ${WORKFLOW_STAGE_TONE[clientToWorkflowStage(c.stage)]}`}>{clientToWorkflowStage(c.stage)}</em></span>;
  if(key==="progress")return <span className="row-progress" key={key}><i><b style={{width:`${c.progress}%`}}/></i><strong>{c.progress}%</strong></span>;
  if(key==="owner")return <span key={key}>{c.owner}</span>;
  if(key==="due")return <span key={key} className={c.due==="Aug 14"||c.due==="Aug 16"?"due-soon":""}>{c.due}</span>;
  if(key==="industry")return <span key={key}>{c.industry}</span>;
  if(key==="documents")return <span key={key}>{c.documents}</span>;
  if(key==="openItems")return <span key={key} className={c.openItems?"due-soon":""}>{c.openItems||"—"}</span>;
  if(key==="team"){const team=CLIENT_TEAMS[c.slug];const people=[...team.firm,...team.client];return <span className="portfolio-team" key={key}><span className="mini-avatar-stack">{people.slice(0,4).map(p=><i key={p.initials}>{p.initials}</i>)}</span><small>{people.length} people</small></span>;}
  return <span key={key}/>;
}
function Engagements({ navigate, update, state }: { navigate: (p: string) => void; update: (p: Partial<DemoState>, m?: string) => void; state: DemoState }) {
  const [newOpen, setNewOpen] = useState(false);
  const [query,setQuery]=useState(""); const [industry,setIndustry]=useState("All industries");
  const [view,setView]=useState<"list"|"card">("list");
  const [displayOpen,setDisplayOpen]=useState(false);
  const displayRef=useDismiss(displayOpen,()=>setDisplayOpen(false));
  const [visibleCols,setVisibleCols]=useState<string[]>(CLIENT_COLUMNS_DEFAULT);
  const toggleCol=(key:string)=>setVisibleCols(v=>v.includes(key)?v.filter(k=>k!==key):[...v,key]);
  const cols=CLIENT_COLUMNS.filter(c=>visibleCols.includes(c.key));
  const gridTemplate=`minmax(240px,1fr) ${cols.map(()=>"minmax(100px,.6fr)").join(" ")} 18px`;
  const rows=CLIENTS.filter(c=>(industry==="All industries"||c.industry===industry)&&`${c.name} ${c.auditType} ${c.subIndustry}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page clients-page"><div className="page-heading"><div><p className="eyebrow">Firm portfolio</p><h1>Clients</h1><p>Select a client to open its audit overview, documents and engagements.</p></div><button className="primary-btn" onClick={() => setNewOpen(true)}><Plus size={17}/>New engagement</button></div>
    <section className="clients-toolbar"><div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search client, industry or audit type"/></div><select value={industry} onChange={e=>setIndustry(e.target.value)}><option>All industries</option>{Object.keys(INDUSTRY_OPTIONS).map(x=><option key={x}>{x}</option>)}</select><span>{rows.length} clients</span>{view==="list"&&<div className="topbar-popover" ref={displayRef}><button className={`filter-btn ${displayOpen?"active":""}`} onClick={()=>setDisplayOpen(!displayOpen)}><SlidersHorizontal size={15}/>Display</button>{displayOpen&&<div className="dropdown-menu display-menu"><div className="dropdown-head"><strong>Display properties</strong><span>Choose which columns to show</span></div>{CLIENT_COLUMNS.map(col=><label className="dropdown-check" key={col.key}><input type="checkbox" checked={visibleCols.includes(col.key)} onChange={()=>toggleCol(col.key)}/><span>{col.label}</span></label>)}<button className="dropdown-item" onClick={()=>setVisibleCols(CLIENT_COLUMNS_DEFAULT)}><RotateCcw size={14}/><span>Reset to default</span></button></div>}</div>}<div className="view-toggle" role="group" aria-label="Change view"><button aria-label="List view" className={view==="list"?"active":""} onClick={()=>setView("list")}><ListChecks size={15}/></button><button aria-label="Card view" className={view==="card"?"active":""} onClick={()=>setView("card")}><LayoutDashboard size={15}/></button></div></section>
    {view==="list"?<div className="table-card"><div className="portfolio-table-head" style={{gridTemplateColumns:gridTemplate}}><span>Client</span>{cols.map(col=><span key={col.key}>{col.label}</span>)}<span/></div>{rows.map(c=><button className="portfolio-row" key={c.slug} style={{gridTemplateColumns:gridTemplate}} onClick={()=>navigate(`/clients/${c.slug}`)}><span className="portfolio-client"><i>{c.initials}</i><span><strong>{c.name}</strong><small>{c.auditType} · {c.industry}</small></span></span>{cols.map(col=>clientCell(c,col.key))}<ChevronRight/></button>)}{rows.length===0&&<div className="clients-empty"><Search/><h3>No clients match</h3><p>Try a broader name or industry filter.</p></div>}</div>:<section className="clients-grid">{rows.map(c=>{const team=CLIENT_TEAMS[c.slug];const people=[...team.firm,...team.client];return <button className="client-card" key={c.slug} onClick={()=>navigate(`/clients/${c.slug}`)}><div className="client-card-head"><i>{c.initials}</i><span><strong>{c.name}</strong><small>{c.industry} · {c.subIndustry}</small></span><ChevronRight/></div><div className="client-card-engagement"><span>{c.auditType}</span><strong>{state.fiscalYear}</strong><small>Period ended {c.period}</small></div><div className="client-card-progress"><div><span>{clientToWorkflowStage(c.stage)}</span><strong>{c.progress}%</strong></div><i><b style={{width:`${c.progress}%`}}/></i></div><div className="client-card-team"><span className="mini-avatar-stack">{people.slice(0,4).map(p=><i key={`${c.slug}-${p.initials}`}>{p.initials}</i>)}</span><span><strong>{people.length} team members</strong><small>{team.firm.length} firm · {team.client.length} client</small></span></div><div className="client-card-foot"><span><FileText/>{c.documents} documents</span><span className={c.openItems?"attention":""}>{c.openItems?`${c.openItems} need attention`:"Up to date"}</span></div></button>})}{rows.length===0&&<div className="clients-empty"><Search/><h3>No clients match</h3><p>Try a broader name or industry filter.</p></div>}</section>}
    {newOpen && <NewEngagementWizard onClose={() => setNewOpen(false)} update={update}/>}
  </div>;
}

type DocRecord={id:number;name:string;category:string;type:string;status:string;date:string;tone:string;due:string;assignee:string;attachments:number;description:string;clientUpload:boolean;comments:{author:string;text:string}[]};
function docsForClient(client:ClientRecord):DocRecord[]{
  return [
    {id:1,name:`${client.name.split(" ")[0]} Trial Balance — FY 2025.xlsx`,category:"Data ingest",type:"Trial balance",status:"Validated",date:"Aug 11",tone:"approved",due:"Complete",assignee:client.owner,attachments:1,clientUpload:false,description:`Reconciled trial balance used across ${client.name}'s Planning.`,comments:[]},
    {id:2,name:"General Ledger Detail.csv",category:"Data ingest",type:"General ledger",status:"Processed",date:"Aug 11",tone:"approved",due:"Complete",assignee:client.owner,attachments:1,clientUpload:false,description:"Transaction-level general ledger detail for the current period.",comments:[]},
    {id:3,name:"Signed engagement letter.pdf",category:"Planning",type:"Engagement",status:"Synced",date:"Aug 4",tone:"approved",due:"Complete",assignee:"Oscar Owner",attachments:1,clientUpload:false,description:"Fully executed engagement letter synchronized from AssurePro.",comments:[]},
    {id:4,name:"Board minutes — Q4.pdf",category:"Planning",type:"Client upload",status:client.openItems>0?"New":"Reviewed",date:"Aug 13",tone:client.openItems>0?"warning":"approved",due:client.openItems>0?"Due in 2d":"Complete",assignee:client.owner,attachments:1,clientUpload:true,description:"Board minutes covering the most recent governance decisions.",comments:client.openItems>0?[{author:client.owner,text:"Reviewing before filing."}]:[]},
  ];
}
// Sub-folders roll up under the same audit stages the sidebar itself uses (Data ingest,
// Planning, Fieldwork, Report), so Documents reads as one part of the same audit, not a
// separately-invented filing system. Anything uncategorized (a user's own "Create Category")
// defaults to Fieldwork, since that's where ad-hoc testing-area folders belong.
const AUDIT_STAGE_ORDER=["Data ingest","Planning","Fieldwork","Report"];
const CATEGORY_STAGE:Record<string,string>={"Data ingest":"Data ingest","Planning":"Planning","Financial Reporting":"Report"};
function stageForCategory(cat:string){return CATEGORY_STAGE[cat]||"Fieldwork"}

// The request pack AssureAudit's "Create Default Requests" seeds — the standard categories a
// financial-statement audit collects. Mirrors the real product, which reports back how many
// categories and requests it created and then hides the button once the pack exists.
const DEFAULT_REQUEST_PACK:{category:string;items:string[]}[]=[
  {category:"Cash & Equivalents",items:["Bank statements — all accounts","Bank reconciliations","Outstanding check listing"]},
  {category:"Accounts Receivable",items:["AR aging detail","Subsequent receipts testing","Allowance for doubtful accounts"]},
  {category:"Inventory",items:["Year-end inventory listing","Obsolete inventory policy","Inventory valuation policy","Physical count observation memo"]},
  {category:"Fixed Assets",items:["Fixed asset rollforward","Additions support","Disposals support","Depreciation schedule","Repair & maintenance detail"]},
  {category:"Accounts Payable & Accruals",items:["AP aging detail","Subsequent disbursements","Accrued liabilities schedule"]},
  {category:"Long Term Debt",items:["Loan agreements","Debt covenant compliance"]},
  {category:"Equity Workpapers",items:["Equity rollforward","Board minutes — equity actions","Member register"]},
  {category:"Revenue and Expense Workpapers",items:["Revenue recognition policy","Top-20 revenue transactions","Cutoff testing support","Expense analytics","Payroll register","Related-party transactions","Grant agreements","Contribution schedules"]},
  {category:"Financial Reporting",items:["Draft financial statements","Trial balance — final","Journal entry listing","Note disclosure support","Prior-year comparatives"]},
  {category:"Miscellaneous",items:["Management representation letter"]},
];
const DOC_PAGE_SIZES=[10,20,50];
const DOC_TONES=["neutral","warning","danger","approved"] as const;
const TONE_LABEL:Record<string,string>={neutral:"Outstanding — not yet provided",warning:"Provided — awaiting review",danger:"Returned — needs revision",approved:"Accepted"};
const STATUS_OPTIONS=[{tone:"neutral",due:"Not started"},{tone:"warning",due:"Due in 3d"},{tone:"danger",due:"Overdue"},{tone:"approved",due:"Complete"}];
const WORKPAPER_REFS=[
  {id:201,title:"Independence confirmations",route:"details"},
  {id:202,title:"Understanding the entity",route:"details"},
  {id:203,title:"Trial balance mapping",route:"map-accounts"},
  {id:204,title:"Reconciliation review",route:"reconcile"},
  {id:205,title:"Materiality workpaper",route:"materiality"},
];

type ClientRequest={id:number;title:string;type:string;status:"To do"|"Submitted"|"Done";due:string;locked:boolean};
function requestsForClient(client:ClientRecord):ClientRequest[]{
  const requests:ClientRequest[]=[
    {id:1,title:"Signed engagement letter (current year)",type:"File upload",status:"Done",due:"Complete",locked:true},
  ];
  if(client.openItems>0)requests.push({id:2,title:"Clarify Board minutes — Q4 governance note",type:"Clarification",status:"To do",due:"Due in 2d",locked:false});
  return requests;
}

type TimelineAction={label:string;icon:"assign"|"request"|"comment"|"upload"|"status"|"approve";time:string;detail?:string};
type TimelineEntry={id:number;actor:string;dateLabel:string;time:string;read:boolean;itemTitle:string;category:string;actions:TimelineAction[];target?:{tab:"Files"|"Requests";id:number}};
function timelineForClient(client:ClientRecord):TimelineEntry[]{
  const team=CLIENT_TEAMS[client.slug];
  const partner=team.firm.find(m=>m.role.toLowerCase().includes("partner"))?.name||"Oscar Owner";
  const manager=team.firm.find(m=>m.role.toLowerCase().includes("manager"))?.name||partner;
  const senior=team.firm[team.firm.length-1]?.name||partner;
  const clientContact=team.client[0]?.name||"the client";
  const requests=requestsForClient(client);
  const docs=docsForClient(client);
  const openRequest=requests.find(r=>r.status!=="Done")||requests[0];
  const reviewDoc=docs.find(d=>d.clientUpload)||docs[0];
  return [
    {id:1,actor:partner,dateLabel:"Today",time:"4:02 PM",read:false,itemTitle:`${openRequest.id} ${openRequest.title}`,category:"Requests",actions:[{label:"Changed Assignments",icon:"assign",time:"4:02 PM",detail:`${partner} assigned — Team: ${team.firm.map(m=>m.name).join(", ")} | Client: ${clientContact}.`}],target:{tab:"Requests",id:openRequest.id}},
    {id:2,actor:manager,dateLabel:"Today",time:"4:01 PM",read:false,itemTitle:`${openRequest.id} ${openRequest.title}`,category:"Requests",actions:[{label:"Created Request",icon:"request",time:"4:01 PM"}],target:{tab:"Requests",id:openRequest.id}},
    {id:3,actor:clientContact,dateLabel:"1 week ago",time:"9:16 PM",read:true,itemTitle:openRequest.title,category:"Requests",actions:[{label:"Submitted Response",icon:"upload",time:"9:16 PM"}],target:{tab:"Requests",id:openRequest.id}},
    {id:4,actor:senior,dateLabel:"1 week ago",time:"2:52 PM",read:true,itemTitle:reviewDoc.name,category:reviewDoc.category,actions:[{label:"Added Comment",icon:"comment",time:"2:52 PM",detail:reviewDoc.comments[0]?.text||"Reviewing before filing."}],target:{tab:"Files",id:reviewDoc.id}},
    {id:5,actor:manager,dateLabel:"2 weeks ago",time:"11:04 AM",read:true,itemTitle:docs[0].name,category:docs[0].category,actions:[{label:`Status changed to ${docs[0].due}`,icon:"status",time:"11:04 AM"}],target:{tab:"Files",id:docs[0].id}},
    {id:6,actor:partner,dateLabel:"2 weeks ago",time:"10:20 AM",read:true,itemTitle:docs[2]?.name||docs[0].name,category:docs[2]?.category||docs[0].category,actions:[{label:"Approved",icon:"approve",time:"10:20 AM"}],target:{tab:"Files",id:docs[2]?.id||docs[0].id}},
  ];
}
function TimelineFilterSelect({label,options,value,onChange,open,setOpen,outerRef}:{label:string;options:string[];value:string;onChange:(v:string)=>void;open:boolean;setOpen:(v:boolean)=>void;outerRef:React.RefObject<HTMLDivElement|null>}){
  return <div className="timeline-filter-field" ref={outerRef}>
    <label>{label}</label>
    <button className="timeline-filter-select" onClick={()=>setOpen(!open)}><span>{value}</span><ChevronDown size={14} className={open?"":"collapsed"}/></button>
    {open&&<div className="dropdown-menu timeline-filter-options">{options.map(o=><button key={o} className="dropdown-item" onClick={()=>{onChange(o);setOpen(false)}}>{o}{o===value&&<Check size={14}/>}</button>)}</div>}
  </div>;
}
function TimelineActionIcon({kind}:{kind:TimelineAction["icon"]}){
  const size=13;
  if(kind==="assign")return <Users size={size}/>;
  if(kind==="request")return <Send size={size}/>;
  if(kind==="comment")return <MessageSquare size={size}/>;
  if(kind==="upload")return <UploadCloud size={size}/>;
  if(kind==="approve")return <Check size={size}/>;
  return <RefreshCw size={size}/>;
}
function EngagementTimeline({client,close,onGoTo}:{client:ClientRecord;close:()=>void;onGoTo:(entry:TimelineEntry)=>void}){
  const [entries,setEntries]=useState<TimelineEntry[]>(()=>timelineForClient(client));
  const [query,setQuery]=useState("");
  const [filterOpen,setFilterOpen]=useState(false);
  const filterRef=useDismiss(filterOpen,()=>setFilterOpen(false));
  const [actionType,setActionType]=useState("All actions");
  const [actionTypeDraft,setActionTypeDraft]=useState("All actions");
  const [actionTypeOpen,setActionTypeOpen]=useState(false);
  const actionTypeRef=useDismiss(actionTypeOpen,()=>setActionTypeOpen(false));
  const [userFilter,setUserFilter]=useState("All users");
  const [userDraft,setUserDraft]=useState("All users");
  const [userOpen,setUserOpen]=useState(false);
  const userRef=useDismiss(userOpen,()=>setUserOpen(false));
  const [categoryFilter,setCategoryFilter]=useState("All categories");
  const [categoryDraft,setCategoryDraft]=useState("All categories");
  const [categoryOpen,setCategoryOpen]=useState(false);
  const categoryRef=useDismiss(categoryOpen,()=>setCategoryOpen(false));
  const [dateRange,setDateRange]=useState("");
  const [dateRangeDraft,setDateRangeDraft]=useState("");
  const markRead=(id:number)=>setEntries(es=>es.map(e=>e.id===id?{...e,read:true}:e));
  const allActionTypes=["All actions",...Array.from(new Set(entries.flatMap(e=>e.actions.map(a=>a.label))))];
  const allUsers=["All users",...Array.from(new Set(entries.map(e=>e.actor)))];
  const allCategories=["All categories",...Array.from(new Set(entries.map(e=>e.category)))];
  const activeFilterCount=(actionType!=="All actions"?1:0)+(userFilter!=="All users"?1:0)+(categoryFilter!=="All categories"?1:0)+(dateRange?1:0);
  const openFilters=()=>{setActionTypeDraft(actionType);setUserDraft(userFilter);setCategoryDraft(categoryFilter);setDateRangeDraft(dateRange);setFilterOpen(true)};
  const applyFilters=()=>{setActionType(actionTypeDraft);setUserFilter(userDraft);setCategoryFilter(categoryDraft);setDateRange(dateRangeDraft);setFilterOpen(false)};
  const clearFilters=()=>{setActionTypeDraft("All actions");setUserDraft("All users");setCategoryDraft("All categories");setDateRangeDraft("");setActionType("All actions");setUserFilter("All users");setCategoryFilter("All categories");setDateRange("")};
  const visible=entries.filter(e=>
    (actionType==="All actions"||e.actions.some(a=>a.label===actionType))
    &&(userFilter==="All users"||e.actor===userFilter)
    &&(categoryFilter==="All categories"||e.category===categoryFilter)
    &&`${e.actor} ${e.itemTitle} ${e.actions.map(a=>a.label).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const unread=entries.filter(e=>!e.read).length;
  const groups:{dateLabel:string;items:TimelineEntry[]}[]=[];
  visible.forEach(e=>{const g=groups[groups.length-1];if(g&&g.dateLabel===e.dateLabel)g.items.push(e);else groups.push({dateLabel:e.dateLabel,items:[e]})});
  return <div className="detail-drawer timeline-drawer">
    <div className="drawer-head"><h2>Engagement Timeline</h2><div className="timeline-head-actions"><span className="timeline-unread"><strong>{unread}</strong> Unread of {entries.length}</span><button className="icon-btn" onClick={close}><X/></button></div></div>
    <div className="timeline-toolbar">
      <div className="topbar-popover" ref={filterRef}>
        <button className={`secondary-btn ${activeFilterCount>0?"active":""}`} onClick={()=>filterOpen?setFilterOpen(false):openFilters()}><Filter size={14}/>Filters{activeFilterCount>0&&<b className="count-inline">{activeFilterCount}</b>}<ChevronDown size={14}/></button>
        {filterOpen&&<div className="dropdown-menu timeline-filter-menu">
          <TimelineFilterSelect label="Action Type" options={allActionTypes} value={actionTypeDraft} onChange={setActionTypeDraft} open={actionTypeOpen} setOpen={setActionTypeOpen} outerRef={actionTypeRef}/>
          <TimelineFilterSelect label="User" options={allUsers} value={userDraft} onChange={setUserDraft} open={userOpen} setOpen={setUserOpen} outerRef={userRef}/>
          <TimelineFilterSelect label="Category" options={allCategories} value={categoryDraft} onChange={setCategoryDraft} open={categoryOpen} setOpen={setCategoryOpen} outerRef={categoryRef}/>
          <div className="timeline-filter-field"><label>Date Range</label><div className="timeline-daterange-input"><CalendarDays size={14}/><input value={dateRangeDraft} onChange={e=>setDateRangeDraft(e.target.value)} placeholder="Select date range"/></div></div>
          <div className="timeline-filter-actions"><button className="secondary-btn" onClick={clearFilters}>Clear</button><button className="primary-btn" onClick={applyFilters}>Apply</button></div>
        </div>}
      </div>
      <div className="search no-margin"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search"/></div>
    </div>
    <div className="drawer-body timeline-body">
      {groups.map((g,gi)=><Fragment key={gi}>
        <div className="timeline-date-divider"><span>{g.dateLabel}</span></div>
        {g.items.map(e=><div key={e.id} className={`timeline-card ${e.read?"":"unread"}`} onClick={()=>markRead(e.id)}>
          <div className="timeline-card-head"><strong>{e.actor}</strong><span className={`status-pill ${e.read?"neutral":"warning"}`}>{e.read?"Read":"Unread"}</span></div>
          <p className="timeline-meta">{e.actions.length} Action{e.actions.length===1?"":"s"} · {e.time}</p>
          <p className="timeline-item-title">{e.itemTitle}</p>
          {e.actions.map((a,i)=><div className="timeline-action" key={i}>
            <div className="timeline-action-row">
              <span className="timeline-action-label"><TimelineActionIcon kind={a.icon}/>{a.label}</span>
              <span className="timeline-action-time">{a.time}</span>
              {e.target&&<button className="goto-btn" onClick={ev=>{ev.stopPropagation();onGoTo(e)}}>Go to this request</button>}
            </div>
            {a.detail&&<p className="timeline-action-detail">{a.detail}</p>}
          </div>)}
        </div>)}
      </Fragment>)}
      {visible.length===0&&<div className="work-empty"><Search/><h3>No matching activity</h3><p>Try a different search or clear filters.</p></div>}
    </div>
  </div>;
}

function DocumentsCenter({initialSlug,navigate,update}:{initialSlug?:string;navigate:(p:string)=>void;update:(p:Partial<DemoState>,m?:string)=>void}) {
  const [selectedSlug,setSelectedSlug]=useState(initialSlug||CLIENTS[0].slug);
  const [clientQuery,setClientQuery]=useState("");
  const client=CLIENTS.find(c=>c.slug===selectedSlug)||CLIENTS[0];
  const filteredClients=CLIENTS.filter(c=>`${c.name} ${c.industry}`.toLowerCase().includes(clientQuery.toLowerCase()));
  return <div className="page documents-center-page">
    <div className="page-heading"><div><p className="eyebrow">Firm portfolio</p><h1>Documents</h1><p>One document center for every client — select a client to view its library.</p></div></div>
    <div className="documents-center-layout">
      <aside className="documents-center-clients">
        <div className="search"><Search/><input value={clientQuery} onChange={e=>setClientQuery(e.target.value)} placeholder="Search clients…"/></div>
        <div className="documents-center-client-list">
          {filteredClients.map(c=><button key={c.slug} className={c.slug===selectedSlug?"active":""} onClick={()=>setSelectedSlug(c.slug)}>
            <i>{c.initials}</i>
            <span><strong>{c.name}</strong><small>{c.documents} documents{c.openItems>0?` · ${c.openItems} pending`:""}</small></span>
            {c.openItems>0&&<b className="pending-dot"/>}
          </button>)}
          {filteredClients.length===0&&<div className="dropdown-empty">No clients match.</div>}
        </div>
      </aside>
      <ClientDocumentsMain key={client.slug} client={client} navigate={navigate} update={update}/>
    </div>
  </div>;
}

function ClientDocumentsMain({client,navigate,update,embedded}:{client:ClientRecord;navigate:(p:string)=>void;update:(p:Partial<DemoState>,m?:string)=>void;embedded?:boolean}) {
  const [query,setQuery]=useState("");
  const [toneFilters,setToneFilters]=useState<string[]>([]);
  const [collapsedGroups,setCollapsedGroups]=useState<Record<string,boolean>>({});
  const [selectedFolder,setSelectedFolder]=useState<string|null>(null);
  const [selectedId,setSelectedId]=useState<number|null>(null);
  const [requestOpen,setRequestOpen]=useState(false);
  const [categoryOpen,setCategoryOpen]=useState(false);
  const [folders,setFolders]=useState<string[]>([]);
  const [tab,setTab]=useState<"Files"|"Requests">("Files");
  const [documents,setDocuments]=useState<DocRecord[]>(()=>docsForClient(client));
  const [requests,setRequests]=useState<ClientRequest[]>(()=>requestsForClient(client));
  const [timelineOpen,setTimelineOpen]=useState(false);
  // AssureAudit's own Documents section: category chips, bulk selection, paging, a Filters
  // popover and the default-request pack. Kept as features, restyled to AssurePro's language.
  const [checked,setChecked]=useState<number[]>([]);
  const [chipsOpen,setChipsOpen]=useState(true);
  const [pageSize,setPageSize]=useState(20);
  const [page,setPage]=useState(1);
  const [sizeOpen,setSizeOpen]=useState(false);
  const sizeRef=useDismiss(sizeOpen,()=>setSizeOpen(false));
  const [filtersOpen,setFiltersOpen]=useState(false);
  const filtersRef=useDismiss(filtersOpen,()=>setFiltersOpen(false));
  const [onlyFlagged,setOnlyFlagged]=useState(false);
  const [onlyClientUploads,setOnlyClientUploads]=useState(false);
  const [packCreated,setPackCreated]=useState(false);
  const goToTimelineTarget=(entry:TimelineEntry)=>{
    if(!entry.target)return;
    if(entry.target.tab==="Files"){setTab("Files");setSelectedId(entry.target.id)}
    else{setTab("Requests");update({},`Opened request: ${entry.itemTitle}`)}
    setTimelineOpen(false);
  };
  const visible=documents.filter(doc=>(toneFilters.length===0||toneFilters.includes(doc.tone))
    &&(!onlyFlagged||doc.tone==="danger"||doc.tone==="warning")
    &&(!onlyClientUploads||doc.clientUpload)
    &&`${doc.name} ${doc.type} ${doc.category}`.toLowerCase().includes(query.toLowerCase()));
  const visibleAll=visible;
  const grouped:Record<string,DocRecord[]>={};
  visible.forEach(doc=>{(grouped[doc.category]=grouped[doc.category]||[]).push(doc)});
  const displayedDocs=selectedFolder?visible.filter(d=>d.category===selectedFolder):visible;
  const toggleTone=(tone:string)=>setToneFilters(f=>f.includes(tone)?f.filter(t=>t!==tone):[...f,tone]);
  const toggleGroup=(cat:string)=>setCollapsedGroups(g=>({...g,[cat]:!g[cat]}));
  const updateDoc=(id:number,patch:Partial<DocRecord>)=>setDocuments(docs=>docs.map(d=>d.id===id?{...d,...patch}:d));
  const removeDoc=(id:number)=>{setDocuments(docs=>docs.filter(d=>d.id!==id));setSelectedId(null)};
  const addCategory=(name:string)=>{setFolders(f=>[...f,name]);setCategoryOpen(false);update({},`"${name}" category created for ${client.name}`)};
  const selectedDoc=documents.find(d=>d.id===selectedId)||null;
  const requestsPending=requests.filter(r=>r.status!=="Done").length;
  const addRequest=(title:string,due:string)=>setRequests(r=>[{id:Math.max(0,...r.map(x=>x.id))+1,title,type:"File upload",status:"To do",due,locked:false},...r]);
  const updateRequest=(id:number,patch:Partial<ClientRequest>)=>setRequests(rs=>rs.map(r=>r.id===id?{...r,...patch}:r));
  const [selectedRequestId,setSelectedRequestId]=useState<number|null>(null);
  const selectedRequest=requests.find(r=>r.id===selectedRequestId)||null;
  const activeFilterCount=(onlyFlagged?1:0)+(onlyClientUploads?1:0)+toneFilters.length;
  const createDefaultRequests=()=>{
    let nextId=Math.max(0,...documents.map(d=>d.id))+1;
    const added:DocRecord[]=[];
    DEFAULT_REQUEST_PACK.forEach(({category,items})=>items.forEach(name=>{
      added.push({id:nextId++,name,category,type:"Document request",status:"Requested",date:"Today",tone:"neutral",due:"Not started",assignee:client.owner,attachments:0,clientUpload:false,description:`Requested from ${client.name} as part of the default ${client.auditType} pack.`,comments:[]});
    }));
    setDocuments(d=>[...d,...added]);
    setPackCreated(true);
    update({},`Created ${DEFAULT_REQUEST_PACK.length} categories and ${added.length} requests.`);
  };
  const catOrder=Array.from(new Set(visibleAll.map(d=>d.category)));
  const pageCount=Math.max(1,Math.ceil(displayedDocs.length/pageSize));
  const safePage=Math.min(page,pageCount);
  const pagedDocs=displayedDocs.slice((safePage-1)*pageSize,safePage*pageSize);
  const pagedGrouped:Record<string,DocRecord[]>={};
  pagedDocs.forEach(doc=>{(pagedGrouped[doc.category]=pagedGrouped[doc.category]||[]).push(doc)});
  const allChecked=pagedDocs.length>0&&pagedDocs.every(d=>checked.includes(d.id));
  const toggleCheck=(id:number)=>setChecked(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id]);
  const toggleAll=()=>setChecked(allChecked?[]:pagedDocs.map(d=>d.id));
  return <>
    <section className="documents-main documents-center-main">
    {!embedded&&<div className="documents-center-main-head"><i>{client.initials}</i><span><strong>{client.name}</strong><small>{client.industry} · {client.subIndustry}</small></span><button className="text-link" onClick={()=>navigate(`/clients/${client.slug}`)}>Open client workspace <ArrowRight size={14}/></button></div>}
    <div className="chip-row-label"><span>Linked workpapers</span><InfoTip title="Linked workpapers" text="Numbered cross-references (201–205) to the specific Data Ingest and Workpapers step that produced or relies on this client's documents. Click a chip to jump straight to that step." standard="Cross-reference · Planning workflow"/></div>
    <div className="workpaper-chip-row">{WORKPAPER_REFS.map(w=><button key={w.id} onClick={()=>navigate(`/engagement/${client.slug}/ingest/${w.route}`)}><b>{w.id}</b><span>{w.title}</span></button>)}</div>
      <div className="documents-tabs"><button className={tab==="Files"?"active":""} onClick={()=>setTab("Files")}>Files <b>{documents.length}</b></button><button className={tab==="Requests"?"active":""} onClick={()=>setTab("Requests")}>Requests {requestsPending>0&&<b className="warn">{requestsPending} pending</b>}</button></div>
      {tab==="Files"?<>
        {/* Category summary chips: each category's request IDs as bubbles, collapsible from the
            toolbar caret — AssureAudit's own pattern, restyled to AssurePro's chip language. */}
        {chipsOpen&&catOrder.length>0&&<div className="doc-category-chips">
          {catOrder.map(cat=>{
            const docs=grouped[cat]||[];
            return <button key={cat} className={`doc-category-chip ${selectedFolder===cat?"active":""}`} onClick={()=>{setSelectedFolder(selectedFolder===cat?null:cat);setSelectedId(null);setPage(1)}} title={`${cat} — ${docs.length} item${docs.length===1?"":"s"}`}>
              <span className="doc-chip-bubbles">{docs.slice(0,8).map(d=><i key={d.id}>{d.id}</i>)}{docs.length>8&&<em>+{docs.length-8}</em>}</span>
              <span className="doc-chip-label">{cat}</span>
            </button>;
          })}
        </div>}
        <div className="documents-toolbar-row">
          <button className="icon-btn" title={chipsOpen?"Hide categories":"Show categories"} aria-expanded={chipsOpen} onClick={()=>setChipsOpen(v=>!v)}><ChevronDown size={15} className={chipsOpen?"":"collapsed"}/></button>
          <div className="search no-margin"><Search/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Search documents or type"/></div>
          <span className="toolbar-label">Status:</span>
          <div className="tone-filter-row">{DOC_TONES.map(t=><button key={t} title={TONE_LABEL[t]} aria-label={`Filter: ${TONE_LABEL[t]}`} className={`tone-dot ${t} ${toneFilters.includes(t)?"active":""}`} onClick={()=>{toggleTone(t);setPage(1)}}/>)}</div>
          <div className="topbar-popover" ref={filtersRef}>
            <button className={`secondary-btn ${activeFilterCount>0?"active":""}`} onClick={()=>setFiltersOpen(v=>!v)}><Filter size={14}/>Filters{activeFilterCount>0&&<b className="count-inline">{activeFilterCount}</b>}</button>
            {filtersOpen&&<div className="dropdown-menu">
              <div className="dropdown-head"><strong>Filter documents</strong><span>Narrow the list below</span></div>
              <label className="dropdown-check"><input type="checkbox" checked={onlyFlagged} onChange={()=>{setOnlyFlagged(v=>!v);setPage(1)}}/><span>Needs attention only</span></label>
              <label className="dropdown-check"><input type="checkbox" checked={onlyClientUploads} onChange={()=>{setOnlyClientUploads(v=>!v);setPage(1)}}/><span>Client uploads only</span></label>
              {activeFilterCount>0&&<button className="dropdown-item" onClick={()=>{setOnlyFlagged(false);setOnlyClientUploads(false);setToneFilters([]);setPage(1)}}><RotateCcw size={14}/><span>Clear all filters</span></button>}
            </div>}
          </div>
          <button className="icon-btn notification" title="Engagement Timeline" onClick={()=>setTimelineOpen(true)}><History size={16}/><i>1</i></button>
          {!packCreated&&<button className="secondary-btn" onClick={createDefaultRequests}><Plus size={15}/>Create Default Requests</button>}
          <button className="icon-btn" title="Export documents.csv" onClick={()=>update({},`Documents for ${client.name} exported as documents.csv (simulated)`)}><Download size={16}/></button>
          <button className="secondary-btn" onClick={()=>setCategoryOpen(true)}><Plus size={15}/>Create Category</button>
          <button className="primary-btn" onClick={()=>setRequestOpen(true)}><Plus size={15}/>Create Request</button>
        </div>
        <div className="documents-workspace">
          <aside className="documents-folder-tree">
            {/* Category is as deep as the tree goes within a stage — matching AssureAudit's own
                Documents section, where a folder is a request category, not a per-file drill-down.
                Categories roll up under the same audit stages the sidebar uses, so a document
                folder reads as part of the one audit, not a separately-invented filing system. */}
            <p className="folder-tree-heading">Folders</p>
            <button className={`folder-tree-item ${!selectedFolder?"active":""}`} onClick={()=>{setSelectedFolder(null);setSelectedId(null)}}><FolderOpen size={15}/><span>All documents</span><b>{documents.length}</b></button>
            {AUDIT_STAGE_ORDER.map(stage=>{
              const cats=Object.entries(grouped).filter(([cat])=>stageForCategory(cat)===stage);
              const emptyCats=folders.filter(name=>!grouped[name]&&stageForCategory(name)===stage);
              if(cats.length===0&&emptyCats.length===0)return null;
              return <div className="folder-tree-stage" key={stage}>
                <p className="folder-tree-stage-label">{stage}</p>
                {cats.map(([cat,docs])=><button key={cat} title={cat} className={`folder-tree-item sub ${selectedFolder===cat?"active":""}`} onClick={()=>{setSelectedFolder(cat);setSelectedId(null)}}><FolderOpen size={14}/><span>{cat}</span><b>{docs.length}</b></button>)}
                {emptyCats.map(name=><button key={name} title={name} className={`folder-tree-item sub empty ${selectedFolder===name?"active":""}`} onClick={()=>{setSelectedFolder(name);setSelectedId(null)}}><FolderOpen size={14}/><span>{name}</span><b>0</b></button>)}
              </div>;
            })}
          </aside>
          {/* File list and detail sit side by side, three columns total with the tree — the same
              layout as both AssureAudit's own Documents section and AssurePro's, where opening a
              file never hides the list you picked it from. */}
          <div className="documents-main-panel">
            <div className="documents-grouped-list">
              {pagedDocs.length>0&&<label className="doc-select-all"><input type="checkbox" checked={allChecked} onChange={toggleAll}/><span>Select All{checked.length>0&&` (${checked.length} selected)`}</span></label>}
              {Object.entries(pagedGrouped).map(([cat,docs])=><section className="doc-group" key={cat}>
                <button className="doc-group-head" onClick={()=>toggleGroup(cat)}><ChevronDown className={collapsedGroups[cat]?"collapsed":""}/><strong>{cat}</strong><b className="count">{docs.length}</b></button>
                {!collapsedGroups[cat]&&docs.map(doc=><div className="doc-row-v2" key={doc.id}>
                  <input type="checkbox" checked={checked.includes(doc.id)} onChange={()=>toggleCheck(doc.id)}/>
                  <button className="doc-row-clickzone" onClick={()=>setSelectedId(doc.id)}>
                    <i className={`tone-dot ${doc.tone}`} title={TONE_LABEL[doc.tone]}/>
                    <span className="doc-id">{doc.id}</span>
                    <span className="doc-row-title"><strong>{doc.name}</strong><small>{doc.type}</small></span>
                    <span className={`status-pill ${doc.tone}`}>{doc.due}</span>
                    <span className="doc-row-meta"><MessageSquare size={13}/>{doc.comments.length}</span>
                    <span className="doc-row-meta"><Paperclip size={13}/>{doc.attachments}</span>
                  </button>
                </div>)}
              </section>)}
              {displayedDocs.length===0&&selectedFolder&&!grouped[selectedFolder]&&<p className="panel-empty-text" style={{padding:"10px 17px"}}>No documents yet — open any document and use "Move" to file it here.</p>}
              {displayedDocs.length===0&&!(selectedFolder&&!grouped[selectedFolder])&&<div className="work-empty"><FolderOpen/><h3>No documents found</h3><p>{packCreated||documents.length>0?"Clear the filters or search to see the full client library.":'Use "Create Default Requests" to seed the standard request pack, or "Create Request" for a one-off.'}</p></div>}
              {displayedDocs.length>0&&<div className="doc-pagination">
                <div className="topbar-popover" ref={sizeRef}>
                  <span>Showing</span>
                  <button className="secondary-btn" onClick={()=>setSizeOpen(v=>!v)}>{pageSize}<ChevronDown size={13}/></button>
                  {sizeOpen&&<div className="dropdown-menu">{DOC_PAGE_SIZES.map(s=><button key={s} className="dropdown-item" onClick={()=>{setPageSize(s);setPage(1);setSizeOpen(false)}}>{s}</button>)}</div>}
                  <span>of {displayedDocs.length} documents</span>
                </div>
                <div className="doc-pagination-pages">
                  <button className="icon-btn" disabled={safePage===1} onClick={()=>setPage(1)}><ChevronLeft size={14}/></button>
                  <button className="icon-btn" disabled={safePage===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={14}/></button>
                  <span className="doc-pagination-current">{safePage}</span>
                  <span>of {pageCount} pages</span>
                  <button className="icon-btn" disabled={safePage===pageCount} onClick={()=>setPage(p=>p+1)}><ChevronRight size={14}/></button>
                  <button className="icon-btn" disabled={safePage===pageCount} onClick={()=>setPage(pageCount)}><ChevronRight size={14}/></button>
                </div>
              </div>}
            </div>
          </div>
          {selectedDoc&&<div className="documents-detail-col"><DocumentDetailPanel inline doc={selectedDoc} close={()=>setSelectedId(null)} update={update} onUpdate={patch=>updateDoc(selectedDoc.id,patch)} onDelete={()=>removeDoc(selectedDoc.id)} clientDocs={documents.filter(d=>d.category===selectedDoc.category&&d.clientUpload&&d.id!==selectedDoc.id)} categories={Array.from(new Set([...documents.map(d=>d.category),...folders]))}/></div>}
        </div>
      </>:requests.length===0?<div className="work-empty"><Send/><h3>No open requests</h3><p>Use Request to ask {client.owner==="Unassigned"?"the client":client.owner} for a new document.</p></div>:<div className="request-list documents-requests-list">{requests.map(r=><button key={r.id} onClick={()=>setSelectedRequestId(r.id)}><div className={`request-icon ${r.status==="Done"?"done":""}`}>{r.status==="Done"?<Check/>:<FileText/>}</div><div><strong>{r.title}</strong><span>{r.type} · {r.due==="Complete"?"No action required":`Due ${r.due}`}</span></div>{/* the lock slot always renders so locked and unlocked rows share one grid */}{r.locked?<LockKeyhole size={14} className="request-lock-icon"/>:<span/>}<span className={`status-pill ${r.status==="Done"?"approved":r.status==="Submitted"?"warning":"neutral"}`}>{r.status}</span><ChevronRight/></button>)}</div>}
    </section>
    {requestOpen&&<CreateRequestModalSimple close={()=>setRequestOpen(false)} update={update} clientName={client.name} onCreate={addRequest}/>}
    {categoryOpen&&<CreateCategoryModal close={()=>setCategoryOpen(false)} onCreate={addCategory}/>}
    {timelineOpen&&<EngagementTimeline client={client} close={()=>setTimelineOpen(false)} onGoTo={goToTimelineTarget}/>}
    {selectedRequest&&<RequestDetailDrawer request={selectedRequest} close={()=>setSelectedRequestId(null)} update={update} onUpdate={patch=>updateRequest(selectedRequest.id,patch)}/>}
  </>;
}
function RequestDetailDrawer({request,close,update,onUpdate}:{request:ClientRequest;close:()=>void;update:(p:Partial<DemoState>,m?:string)=>void;onUpdate:(patch:Partial<ClientRequest>)=>void}){
  const [statusOpen,setStatusOpen]=useState(false);
  const statusRef=useDismiss(statusOpen,()=>setStatusOpen(false));
  const REQUEST_STATUSES=["To do","Submitted","Done"] as const;
  const setStatus=(status:typeof REQUEST_STATUSES[number])=>{
    onUpdate({status,locked:status==="Done"?true:request.locked});
    setStatusOpen(false);
    update({},`"${request.title}" marked ${status}`);
  };
  const toggleLock=()=>{
    onUpdate({locked:!request.locked});
    update({},`"${request.title}" ${request.locked?"unlocked":"locked"}${request.locked?" — the client can edit it again":" — the client can no longer edit it"}`);
  };
  return <div className="detail-drawer">
    <div className="drawer-head"><div><span className={`status-pill ${request.status==="Done"?"approved":request.status==="Submitted"?"warning":"neutral"}`}>{request.status}</span><h2>{request.title}</h2><p>{request.type}</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <div className="drawer-body">
      {request.locked&&<div className="request-locked-banner"><LockKeyhole size={15}/><span>This request is locked — the client can't make further changes until you unlock it.</span></div>}
      <div className="panel-meta-row"><div><small>Type</small><strong>{request.type}</strong></div><div><small>Due</small><strong>{request.due}</strong></div></div>
      <p className="drawer-label">Status</p>
      <div className="topbar-popover" ref={statusRef}>
        <button className="secondary-btn" disabled={request.locked} onClick={()=>setStatusOpen(v=>!v)}>{request.status} <ChevronDown size={14}/></button>
        {statusOpen&&<div className="dropdown-menu">{REQUEST_STATUSES.map(s=><button key={s} className="dropdown-item" onClick={()=>setStatus(s)}>{s}</button>)}</div>}
      </div>
      {request.locked&&<p className="restriction-note"><LockKeyhole size={12}/>Unlock this request to change its status.</p>}
      <button className={`secondary-btn full ${request.locked?"":"danger-outline"}`} style={{marginTop:14}} onClick={toggleLock}><LockKeyhole size={15}/>{request.locked?"Unlock request":"Lock request"}</button>
    </div>
  </div>;
}

function DocumentDetailPanel({doc,close,update,onUpdate,onDelete,clientDocs,categories,inline}:{doc:DocRecord;close:()=>void;update:(p:Partial<DemoState>,m?:string)=>void;onUpdate:(patch:Partial<DocRecord>)=>void;onDelete:()=>void;clientDocs:DocRecord[];categories:string[];inline?:boolean}){
  const [tab,setTab]=useState<"Request Info"|"Client Docs"|"Comments"|"Activity">("Request Info");
  const [statusMenuOpen,setStatusMenuOpen]=useState(false);
  const statusMenuRef=useDismiss(statusMenuOpen,()=>setStatusMenuOpen(false));
  const [assignOpen,setAssignOpen]=useState(false);
  const assignRef=useDismiss(assignOpen,()=>setAssignOpen(false));
  const [categoryOpen,setCategoryOpen]=useState(false);
  const categoryRef=useDismiss(categoryOpen,()=>setCategoryOpen(false));
  const moveToCategory=(cat:string)=>{onUpdate({category:cat});setCategoryOpen(false);update({},`${doc.name} moved to "${cat}"`)};
  const [commentDraft,setCommentDraft]=useState("");
  const setStatus=(tone:string,due:string)=>{onUpdate({tone,due});setStatusMenuOpen(false);update({},`${doc.name} marked ${due}`)};
  const addComment=()=>{if(!commentDraft.trim())return;onUpdate({comments:[...doc.comments,{author:"Oscar Owner",text:commentDraft.trim()}]});setCommentDraft("")};
  const assignTo=(name:string)=>{onUpdate({assignee:name});setAssignOpen(false);update({},`${doc.name} assigned to ${name}`)};
  const uploadDoc=()=>{onUpdate({attachments:doc.attachments+1});update({},`File uploaded to ${doc.name}`)};
  const [revisionOpen,setRevisionOpen]=useState(false);
  const [revisionNote,setRevisionNote]=useState("");
  const isPendingReview=doc.clientUpload&&doc.tone!=="approved";
  const approve=()=>{onUpdate({tone:"approved",due:"Complete"});update({},`${doc.name} approved`)};
  const requestRevision=()=>{
    if(!revisionNote.trim())return;
    onUpdate({tone:"danger",due:"Revision requested",comments:[...doc.comments,{author:"Oscar Owner",text:`Revision requested: ${revisionNote.trim()}`}]});
    update({},`Revision requested for ${doc.name}`);
    setRevisionNote("");
    setRevisionOpen(false);
  };
  const tabs=["Request Info","Client Docs","Comments","Activity"] as const;
  return <div className={inline?"document-preview-panel":"detail-drawer document-detail-panel"}>
    <div className="drawer-head"><div><span className={`status-pill ${doc.tone}`}>{doc.due}</span><h2>{doc.name}</h2><p>{doc.category} · #{doc.id}</p></div>
      <div className="drawer-head-actions">
        <button className="icon-btn" title="Rename" onClick={()=>update({},"Rename not available in this prototype")}><Pencil size={16}/></button>
        <button className="icon-btn danger" title="Delete" onClick={onDelete}><Trash2 size={16}/></button>
        <button className="icon-btn" onClick={close}><X/></button>
      </div>
    </div>
    <div className="doc-preview-surface"><FileText size={36}/><strong>{doc.name}</strong><span>Preview not available in this prototype — showing file summary below</span></div>
    {isPendingReview&&<div className="doc-approval-actions">
      <button className="primary-btn" onClick={approve}><Check size={15}/>Approve</button>
      <button className="secondary-btn danger-outline" onClick={()=>setRevisionOpen(v=>!v)}><AlertTriangle size={15}/>Request revision</button>
    </div>}
    {revisionOpen&&<div className="revision-note-box"><textarea value={revisionNote} onChange={e=>setRevisionNote(e.target.value)} placeholder="Explain what needs to change…"/><button className="primary-btn" disabled={!revisionNote.trim()} onClick={requestRevision}>Send revision request</button></div>}
    <div className="panel-status-row"><div className="topbar-popover" ref={statusMenuRef}><button className="secondary-btn" onClick={()=>setStatusMenuOpen(v=>!v)}>Change Status <ChevronDown size={14}/></button>{statusMenuOpen&&<div className="dropdown-menu status-menu">{STATUS_OPTIONS.map(o=><button key={o.due} className="dropdown-item" onClick={()=>setStatus(o.tone,o.due)}><i className={`tone-dot ${o.tone}`}/><span>{o.due}</span></button>)}</div>}</div></div>
    <div className="drawer-tabs">{tabs.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</div>
    <div className="drawer-body">
      {tab==="Request Info"&&<>
        <p className="drawer-label">Description</p>
        <p className="panel-description">{doc.description}</p>
        <div className="panel-meta-row"><div><small>Created by</small><strong>{doc.type}</strong></div><div><small>Due Date</small><strong>{doc.due}</strong></div></div>
        <div className="panel-assign-row"><div><small>Assignments</small><strong>{doc.assignee||"Unassigned"}</strong></div><div className="topbar-popover" ref={assignRef}><button className="text-link" onClick={()=>setAssignOpen(v=>!v)}>Assign</button>{assignOpen&&<div className="dropdown-menu">{["Jasmine Alvarez","Meera Kapoor","Oscar Owner","Leo Chen"].map(name=><button key={name} className="dropdown-item" onClick={()=>assignTo(name)}>{name}</button>)}</div>}</div></div>
        <div className="panel-assign-row"><div><small>Category</small><strong>{doc.category}</strong></div><div className="topbar-popover" ref={categoryRef}><button className="text-link" onClick={()=>setCategoryOpen(v=>!v)}>Move</button>{categoryOpen&&<div className="dropdown-menu">{categories.filter(c=>c!==doc.category).map(cat=><button key={cat} className="dropdown-item" onClick={()=>moveToCategory(cat)}>{cat}</button>)}{categories.length<=1&&<div className="dropdown-empty">Create another category first.</div>}</div>}</div></div>
        <p className="drawer-label">My Documents</p>
        {doc.attachments>0?<div className="drawer-file"><FileText/><div><strong>{doc.name}</strong><span>{doc.attachments} file{doc.attachments===1?"":"s"} attached · {doc.date}</span></div></div>:<div className="panel-upload-empty"><p>No documents uploaded yet.</p><button className="secondary-btn" onClick={uploadDoc}><UploadCloud size={15}/>Upload Document</button></div>}
      </>}
      {tab==="Client Docs"&&(clientDocs.length?<div className="drawer-comment-list">{clientDocs.map(d=><div className="drawer-file" key={d.id}><FileText/><div><strong>{d.name}</strong><span>{d.date}</span></div></div>)}</div>:<div className="work-empty"><FolderOpen/><h3>No client documents</h3><p>No client-provided files in this category yet.</p></div>)}
      {tab==="Comments"&&<>{doc.comments.length===0?<p className="panel-empty-text">No comments yet.</p>:<div className="drawer-comment-list">{doc.comments.map((c,i)=><div className="drawer-comment" key={i}><strong>{c.author}</strong><p>{c.text}</p></div>)}</div>}<div className="comment-input"><input value={commentDraft} onChange={e=>setCommentDraft(e.target.value)} placeholder="Add a comment…" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addComment()}}}/><button className="icon-btn" disabled={!commentDraft.trim()} onClick={addComment}><Send size={15}/></button></div></>}
      {tab==="Activity"&&<><div className="activity-item"><i/><div><strong>Uploaded · {doc.type}</strong><span>{doc.date}</span></div></div><div className="activity-item"><i/><div><strong>Status set to {doc.due}</strong><span>Updated just now</span></div></div></>}
    </div>
  </div>;
}

function CreateCategoryModal({close,onCreate}:{close:()=>void;onCreate:(name:string)=>void}){
  const [name,setName]=useState("");
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>Create category</h2><p>Add a new folder to organize documents.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <Field label="Category name" required><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Tax workpapers"/></Field>
    <div className="modal-actions"><button className="secondary-btn" onClick={close}>Cancel</button><button className="primary-btn" disabled={!name.trim()} onClick={()=>onCreate(name.trim())}>Create</button></div>
  </div></div>;
}

function CreateRequestModalSimple({close,update,clientName,onCreate}:{close:()=>void;update:(p:Partial<DemoState>,m?:string)=>void;clientName:string;onCreate:(title:string,due:string)=>void}){
  const [title,setTitle]=useState("");
  const [dueDate,setDueDate]=useState("");
  const canCreate=title.trim().length>0&&dueDate.trim().length>0;
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>Create request</h2><p>Add a new document request for {clientName}.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <Field label="Request title" required><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Bank confirmations"/></Field>
    <Field label="Due date" required><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></Field>
    <div className="modal-actions"><button className="secondary-btn" onClick={close}>Cancel</button><button className="primary-btn" disabled={!canCreate} onClick={()=>{onCreate(title,dueDate);update({},`Request "${title}" sent to ${clientName}`);close()}}>Create</button></div>
  </div></div>;
}


const CLIENT_TAGS:Record<string,string[]>={
  bbawc:["Audit risk","Board relationship"],
  harbor:["Long-term client"],
  greenfield:["Audit risk","New client"],
  metro:["Needs setup"],
  horizon:["EBP specialist required"],
  cedar:["Long-term client","Low risk"],
};
const ENGAGEMENT_STAGE_TONE:Record<string,string>={Intake:"danger","Document Collection":"progress","Categorization & Reconciliation":"warning",Review:"warning",Complete:"approved"};
function engagementStageTone(stage:string){return ENGAGEMENT_STAGE_TONE[stage]||"neutral"}
type ClientEngagementRow={id:string;title:string;period:string;stage:string;due:string;assignee:string};
function engagementsForClient(client:ClientRecord):ClientEngagementRow[]{
  const team=CLIENT_TEAMS[client.slug];
  const senior=team.firm[team.firm.length-1]?.name||client.owner;
  const wf=clientToWorkflowStage(client.stage);
  const currentStage=wf==="Intake"?"Intake":wf==="Ingest"?"Document Collection":wf==="Review"?"Review":"Complete";
  const yearMatch=client.period.match(/(\d{4})/);
  const year=yearMatch?parseInt(yearMatch[1]):2025;
  const priorPeriod=client.period.replace(String(year),String(year-1));
  return [
    {id:`${client.slug}-cur`,title:`${client.auditType} — FY ${year}`,period:client.period,stage:currentStage,due:client.due,assignee:client.owner},
    {id:`${client.slug}-prior`,title:`${client.auditType} — FY ${year-1}`,period:priorPeriod,stage:"Complete",due:"Complete",assignee:senior},
  ];
}
type ClientInvoice={id:number;number:string;amount:number;status:"Paid"|"Overdue"|"Draft";dueDate:string};
function invoicesForClient(client:ClientRecord):ClientInvoice[]{
  const overdueCount=client.openItems>0?Math.min(3,client.openItems):0;
  const invoices:ClientInvoice[]=[
    {id:1,number:"INV-1042",amount:1200,status:"Paid",dueDate:"Jun 1, 2026"},
    {id:2,number:"INV-1058",amount:950,status:"Paid",dueDate:"Jul 1, 2026"},
  ];
  for(let i=0;i<overdueCount;i++)invoices.push({id:3+i,number:`INV-10${65+i}`,amount:300+i*150,status:"Overdue",dueDate:"Aug 5, 2026"});
  return invoices;
}
type SigningPackage={id:number;name:string;status:"Draft"|"Sent"|"Completed"|"Cancelled";sent:string;completed:string;signBy:string;validTill:string};
function signingPackagesForClient(client:ClientRecord):SigningPackage[]{
  const yearMatch=client.period.match(/(\d{4})/);
  const year=yearMatch?parseInt(yearMatch[1]):2025;
  return [
    {id:1,name:`${client.auditType} Engagement Letter — FY ${year}`,status:"Completed",sent:"Aug 4, 2025",completed:"Aug 4, 2025",signBy:"–",validTill:"–"},
    {id:2,name:`${client.auditType} Engagement Letter — FY ${year-1}`,status:"Completed",sent:"Aug 2, 2024",completed:"Aug 6, 2024",signBy:"–",validTill:"–"},
    {id:3,name:"Management Representation Letter",status:client.progress>=80?"Sent":"Draft",sent:client.progress>=80?"Aug 10, 2026":"–",completed:"–",signBy:"Aug 20, 2026",validTill:"Sep 1, 2026"},
  ];
}
type ClientCredential={id:number;name:string;category:string;username:string;lastRevealed:string};
function credentialsForClient(client:ClientRecord):ClientCredential[]{
  return [{id:1,name:"QuickBooks Online",category:"Accounting system",username:`${client.slug}.admin@qbo.com`,lastRevealed:"17d ago"}];
}
type ClientEmailLog={id:number;sentAt:string;type:string;to:string;subject:string;status:"Sent"|"Failed"|"Not sent"};
function emailsForClient(client:ClientRecord):ClientEmailLog[]{
  const contact=CLIENT_TEAMS[client.slug].client[0];
  const to=contact?`${contact.name.toLowerCase().replace(/ /g,".")}@${client.slug}.org`:"contact@client.org";
  return [
    {id:1,sentAt:"Aug 18, 2026, 2:45 PM",type:"Document request",to,subject:`${client.name} requested documents`,status:"Sent"},
    {id:2,sentAt:"Aug 12, 2026, 10:05 AM",type:"Client message",to,subject:"Your auditor is waiting for your reply",status:"Sent"},
    {id:3,sentAt:"Aug 4, 2026, 9:00 AM",type:"Engagement letter",to,subject:"Please sign your engagement letter",status:client.ready?"Sent":"Not sent"},
  ];
}
const CLIENT_DETAIL_TABS=["Overview","Info","Documents","Communications","Engagements","Billing","Engagement Letter","Credentials","Emails"] as const;
function ClientOverview({client,navigate,state,update}:{client:ClientRecord;navigate:(p:string)=>void;state:DemoState;update:(p:Partial<DemoState>,m?:string)=>void}) {
  const [tab,setTab]=useState<typeof CLIENT_DETAIL_TABS[number]>("Overview");
  const [editingName,setEditingName]=useState(false);
  const [nameDraft,setNameDraft]=useState(client.name);
  const [displayName,setDisplayName]=useState(client.name);
  const [openInOpen,setOpenInOpen]=useState(false);
  const openInRef=useDismiss(openInOpen,()=>setOpenInOpen(false));
  const [moreOpen,setMoreOpen]=useState(false);
  const moreRef=useDismiss(moreOpen,()=>setMoreOpen(false));
  const saveName=()=>{if(!nameDraft.trim())return;setDisplayName(nameDraft.trim());setEditingName(false);update({},"Client name updated")};
  if(!client.ready)return <div className="page client-overview-page"><div className="client-profile-head"><button className="back-client" onClick={()=>navigate("/clients")}><ArrowLeft/></button><i>{client.initials}</i><div><p className="eyebrow">Client audit workspace</p><h1>{client.name}</h1><span>{client.industry} · {client.subIndustry}</span></div></div><section className="setup-required"><AlertTriangle/><div><p className="eyebrow">Setup required</p><h2>Complete engagement details in AssurePro first</h2><p>Audit data is intentionally hidden until the signed engagement letter provides the period, audit type, reporting framework and responsible team.</p><ul><li>Signed engagement letter</li><li>Audit period and reporting deadline</li><li>Industry and sub-industry</li><li>Engagement partner and manager</li></ul><button className="primary-btn" onClick={()=>navigate("/clients")}>Return to clients</button></div></section><EngagementTeam client={client}/></div>;
  const engagements=engagementsForClient(client);
  const invoices=invoicesForClient(client);
  const overdueInvoices=invoices.filter(i=>i.status==="Overdue");
  const overdueAmount=overdueInvoices.reduce((s,i)=>s+i.amount,0);
  const overdueTasks=client.openItems*3;
  const attentionCount=(overdueInvoices.length>0?1:0)+(overdueTasks>0?1:0);
  return <div className="page client-overview-page">
    <div className="client-profile-head client-profile-head-v2"><button className="back-client" onClick={()=>navigate("/clients")}><ArrowLeft/></button><i>{client.initials}</i>
      <div className="client-head-name-row">
        {editingName?<div className="client-name-edit"><input value={nameDraft} onChange={e=>setNameDraft(e.target.value)} autoFocus/><button className="primary-btn" onClick={saveName}>Save</button><button className="secondary-btn" onClick={()=>{setNameDraft(displayName);setEditingName(false)}}>Cancel</button></div>
        :<><h1>{displayName}</h1><button className="icon-btn" title="Rename" onClick={()=>setEditingName(true)}><Pencil size={14}/></button><span className="chip neutral">Business</span><span className="status-pill approved">Active</span></>}
      </div>
      <div className="client-head-actions">
        {/* "Open in" is the cross-product jump within the Assure One suite — Documents and Billing
            are tabs on this very page now, so listing them here would just be a redundant tab switch. */}
        <div className="topbar-popover" ref={openInRef}><button className="secondary-btn" onClick={()=>setOpenInOpen(v=>!v)}>Open in <ChevronDown size={14}/></button>{openInOpen&&<div className="dropdown-menu"><div className="dropdown-head"><strong>Open this client in</strong><span>Jump across the Assure One suite</span></div><button className="dropdown-item" onClick={()=>{setOpenInOpen(false);update({},`Opening ${displayName} in AssurePro — practice management, billing and engagement letters live there.`)}}><BriefcaseBusiness size={14}/><span>AssurePro</span></button></div>}</div>
        <div className="topbar-popover" ref={moreRef}><button className="icon-btn" onClick={()=>setMoreOpen(v=>!v)}><MoreHorizontal/></button>{moreOpen&&<div className="dropdown-menu"><button className="dropdown-item" onClick={()=>{setMoreOpen(false);update({},"Compose email (simulated)")}}><Send size={14}/><span>Email</span></button><button className="dropdown-item" onClick={()=>{setMoreOpen(false);update({},"Compose SMS (simulated)")}}><MessageSquare size={14}/><span>SMS</span></button><button className="dropdown-item" onClick={()=>{setMoreOpen(false);update({},"Note added (simulated)")}}><FileText size={14}/><span>Note</span></button><button className="dropdown-item" onClick={()=>{setMoreOpen(false);update({},`${displayName} archived (simulated)`)}}><FolderOpen size={14}/><span>Archive</span></button><button className="dropdown-item danger" onClick={()=>{setMoreOpen(false);update({},"Delete not available in this prototype")}}><Trash2 size={14}/><span>Delete</span></button></div>}</div>
      </div>
    </div>
    <nav className="client-tabs">{CLIENT_DETAIL_TABS.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</nav>
    {tab==="Overview"&&<>
    {attentionCount>0&&<section className="client-attention"><div><AlertCircle/><strong>Needs attention</strong><span>{attentionCount}</span></div>
      {overdueInvoices.length>0&&<button onClick={()=>setTab("Billing")}><strong>{overdueInvoices.length} invoice{overdueInvoices.length===1?"":"s"} overdue</strong><span>{money(overdueAmount)}</span><ArrowRight/></button>}
      {overdueTasks>0&&<button onClick={()=>navigate(`/engagement/${client.slug}/ingest/validate`)}><strong>{overdueTasks} tasks past due</strong><span>earliest {client.due}</span><ArrowRight/></button>}
    </section>}
    <div className="client-overview-grid-v2">
      <section className="section-card client-engagements-card"><div className="section-title"><div><h2>Engagements</h2></div><button className="text-link" onClick={()=>setTab("Engagements")}>View all {engagements.length} <ArrowRight size={13}/></button></div>
        <div className="engagements-table"><div className="engagements-table-head"><span>Type</span><span>Period</span><span>Stage</span><span>Due Date</span><span>Assignee</span><span/></div>
        {engagements.map(e=><button className="engagements-table-row" key={e.id} onClick={()=>navigate(`/engagement/${client.slug}/planning`)}><span>{e.title}</span><span>{e.period||"–"}</span><span><span className={`status-pill ${engagementStageTone(e.stage)}`}>{e.stage}</span></span><span>{e.due}</span><span className="engagement-assignee">{e.assignee!=="Unassigned"&&<i className="person-avatar violet">{e.assignee.split(" ").map(n=>n[0]).join("").slice(0,2)}</i>}{e.assignee}</span><ChevronRight/></button>)}
        </div>
      </section>
      <aside className="client-stat-cards">
        <div className="stat-card"><span className="stat-card-icon"><DollarSign size={14}/></span><small>Outstanding</small><strong className={overdueAmount>0?"danger-text":""}>{money(overdueAmount)}</strong><span>{overdueInvoices.length>0?`${overdueInvoices.length} invoices overdue`:"No invoices overdue"}</span></div>
        <div className="stat-card"><span className="stat-card-icon"><CalendarDays size={14}/></span><small>Next deadline</small><strong>{client.due==="Not set"||client.due==="Complete"?"–":client.due}</strong><span>{client.due==="Not set"||client.due==="Complete"?"No upcoming deadlines":"Upcoming"}</span></div>
        <div className="stat-card-row"><button className="stat-card compact" onClick={()=>setTab("Engagements")}><strong>{engagements.length}</strong><span>Engagements</span></button><button className="stat-card compact" onClick={()=>setTab("Documents")}><strong>{client.documents}</strong><span>Documents</span></button></div>
        <div className="stat-card"><small>Client Pending Actions</small><p className="panel-empty-text">No pending actions.</p></div>
        <div className="stat-card"><div className="stat-card-head"><small>Recent communications</small><button className="text-link" onClick={()=>setTab("Communications")}>View all</button></div><p className="panel-empty-text">{CLIENT_TEAMS[client.slug].firm[0]?.name} sent a message 2d ago.</p></div>
      </aside>
    </div>
    </>}
    {tab==="Info"&&<ClientInfoTab client={client}/>}
    {tab==="Documents"&&<ClientDocumentsMain client={client} navigate={navigate} update={update} embedded/>}
    {tab==="Engagements"&&<section className="section-card client-engagements-card"><div className="section-title"><div><h2>Engagements</h2><p>Every engagement open for {displayName}.</p></div></div>
      <div className="engagements-table"><div className="engagements-table-head"><span>Type</span><span>Period</span><span>Stage</span><span>Due Date</span><span>Assignee</span><span/></div>
      {engagements.map(e=><button className="engagements-table-row" key={e.id} onClick={()=>navigate(`/engagement/${client.slug}/planning`)}><span>{e.title}</span><span>{e.period||"–"}</span><span><span className={`status-pill ${engagementStageTone(e.stage)}`}>{e.stage}</span></span><span>{e.due}</span><span className="engagement-assignee">{e.assignee!=="Unassigned"&&<i className="person-avatar violet">{e.assignee.split(" ").map(n=>n[0]).join("").slice(0,2)}</i>}{e.assignee}</span><ChevronRight/></button>)}
      </div>
    </section>}
    {tab==="Communications"&&<ClientCommunications client={client}/>}
    {tab==="Billing"&&<ClientBillingTab client={client} invoices={invoices} update={update}/>}
    {tab==="Engagement Letter"&&<ClientEngagementLetterTab client={client} update={update}/>}
    {tab==="Credentials"&&<ClientCredentialsTab client={client} update={update}/>}
    {tab==="Emails"&&<ClientEmailsTab client={client}/>}
  </div>;
}
function ClientInfoTab({client}:{client:ClientRecord}){
  const team=CLIENT_TEAMS[client.slug];
  const tags=CLIENT_TAGS[client.slug]||[];
  const [tagList,setTagList]=useState(tags);
  return <div className="client-overview-grid-v2">
    <section className="section-card"><div className="section-title"><div><h2>Contact Information</h2></div></div>
      <dl className="info-dl"><div><dt>Name</dt><dd>{client.name}</dd></div><div><dt>Email</dt><dd>info@{client.slug}.org</dd></div><div><dt>Phone</dt><dd className="info-add">Add phone</dd></div><div><dt>Address</dt><dd className="info-add">Add address</dd></div></dl>
    </section>
    <section className="section-card"><div className="section-title"><div><h2>Entity Details</h2></div></div>
      <dl className="info-dl"><div><dt>Entity Type</dt><dd>Business</dd></div><div><dt>Industry</dt><dd>{client.industry}</dd></div><div><dt>Sub-industry</dt><dd>{client.subIndustry}</dd></div><div><dt>Period end</dt><dd>{client.period}</dd></div><div><dt>Accounting system</dt><dd>QuickBooks Online</dd></div></dl>
    </section>
    <section className="section-card"><div className="section-title"><div><h2>Portal Access</h2></div></div>
      <div className="portal-access-list">{team.client.map((m,i)=><div className="portal-access-row" key={m.initials}><i className="person-avatar violet">{m.initials}</i><div><strong>{m.name}</strong><span>{m.role}</span></div><span className={`status-pill ${i===0?"approved":"warning"}`}>{i===0?"Activated":"Pending"}</span></div>)}</div>
    </section>
    <section className="section-card"><div className="section-title"><div><h2>Tags</h2></div></div>
      <div className="client-tag-row">{tagList.map(t=><span className="chip neutral" key={t}>{t}<button onClick={()=>setTagList(l=>l.filter(x=>x!==t))}><X size={11}/></button></span>)}{tagList.length===0&&<p className="panel-empty-text">No tags yet.</p>}</div>
    </section>
  </div>;
}
function ClientBillingTab({client,invoices,update}:{client:ClientRecord;invoices:ClientInvoice[];update:(p:Partial<DemoState>,m?:string)=>void}){
  const [sub,setSub]=useState<"Invoices"|"Software"|"Time Entries">("Invoices");
  return <section className="section-card">
    <div className="subtabs">{(["Invoices","Software","Time Entries"] as const).map(s=><button key={s} className={sub===s?"active":""} onClick={()=>setSub(s)}>{s}</button>)}</div>
    {sub==="Invoices"&&<div className="engagements-table"><div className="engagements-table-head" style={{gridTemplateColumns:"1fr 1fr 1fr 1fr"}}><span>Number</span><span>Amount</span><span>Status</span><span>Due Date</span></div>
      {invoices.map(inv=><div className="engagements-table-row" key={inv.id} style={{gridTemplateColumns:"1fr 1fr 1fr 1fr"}}><span>{inv.number}</span><span>{money(inv.amount)}</span><span><span className={`status-pill ${inv.status==="Paid"?"approved":inv.status==="Overdue"?"danger":"neutral"}`}>{inv.status}</span></span><span>{inv.dueDate}</span></div>)}
    </div>}
    {sub==="Software"&&<p className="panel-empty-text">Software subscriptions aren't tracked in this prototype.</p>}
    {sub==="Time Entries"&&<p className="panel-empty-text">Time entries aren't tracked in this prototype.</p>}
  </section>;
}
function ClientEngagementLetterTab({client,update}:{client:ClientRecord;update:(p:Partial<DemoState>,m?:string)=>void}){
  const packages=signingPackagesForClient(client);
  // Engagement letters are authored and sent for signature in AssurePro — AssureAudit only reads
  // the resulting signed letter — so this hands off rather than faking a local draft row.
  const newPackage=()=>update({},"Engagement letters are created in AssurePro — you'll be redirected there to build and send this package.");
  return <section className="section-card"><div className="section-title"><div><h2>Signing packages</h2><p>Engagement letters, intake requests, and other documents sent for signature. Created in AssurePro, read-only here.</p></div><button className="primary-btn" onClick={newPackage}><Plus size={15}/>New package</button></div>
    <div className="engagements-table"><div className="engagements-table-head" style={{gridTemplateColumns:"1.6fr 1fr 1fr 1fr 1fr 1fr"}}><span>Name</span><span>Status</span><span>Sent</span><span>Completed</span><span>Sign by</span><span>Valid till</span></div>
    {packages.map(p=><div className="engagements-table-row" key={p.id} style={{gridTemplateColumns:"1.6fr 1fr 1fr 1fr 1fr 1fr"}}><span>{p.name}</span><span><span className={`status-pill ${p.status==="Completed"?"approved":p.status==="Cancelled"?"danger":p.status==="Sent"?"warning":"neutral"}`}>{p.status}</span></span><span>{p.sent}</span><span>{p.completed}</span><span>{p.signBy}</span><span>{p.validTill}</span></div>)}
    </div>
  </section>;
}
function ClientCredentialsTab({client,update}:{client:ClientRecord;update:(p:Partial<DemoState>,m?:string)=>void}){
  const credentials=credentialsForClient(client);
  const [revealed,setRevealed]=useState<Record<number,boolean>>({});
  return <section className="section-card"><div className="section-title"><div><h2>{credentials.length} credential{credentials.length===1?"":"s"}</h2></div><button className="primary-btn" onClick={()=>update({},"Add credential not available in this prototype")}><Plus size={15}/>Add credential</button></div>
    <div className="credential-banner"><LockKeyhole size={14}/><span>Encrypted at rest with AES-256 · Only engagement owners can reveal secrets. Every reveal is logged.</span></div>
    {credentials.map(c=><div className="credential-card" key={c.id}>
      <div className="credential-card-head"><span className="credential-icon"><Building2 size={16}/></span><div><strong>{c.name}</strong><small>{c.category}</small></div></div>
      <div className="credential-fields">
        <div><small>USERNAME</small><span>{c.username}</span></div>
        <div><small>PASSWORD</small><span>{revealed[c.id]?"demo-password-123":"••••••••••"}<button className="icon-btn" onClick={()=>setRevealed(r=>({...r,[c.id]:!r[c.id]}))}>{revealed[c.id]?<X size={14}/>:<Search size={14}/>}</button></span></div>
      </div>
      <small className="credential-meta">Last revealed {c.lastRevealed}</small>
    </div>)}
  </section>;
}
function ClientEmailsTab({client}:{client:ClientRecord}){
  const emails=emailsForClient(client);
  const [filter,setFilter]=useState<"All"|"Sent"|"Failed"|"Not sent">("All");
  const visible=emails.filter(e=>filter==="All"||e.status===filter);
  return <section className="section-card">
    <div className="my-work-filters">{(["All","Sent","Failed","Not sent"] as const).map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f}</button>)}</div>
    <div className="engagements-table" style={{marginTop:12}}><div className="engagements-table-head" style={{gridTemplateColumns:"1.2fr 1fr 1.4fr 1.6fr .8fr"}}><span>Sent</span><span>Type</span><span>To</span><span>Subject</span><span>Status</span></div>
    {visible.map(e=><div className="engagements-table-row" key={e.id} style={{gridTemplateColumns:"1.2fr 1fr 1.4fr 1.6fr .8fr"}}><span>{e.sentAt}</span><span>{e.type}</span><span>{e.to}</span><span>{e.subject}</span><span><span className={`status-pill ${e.status==="Sent"?"approved":e.status==="Failed"?"danger":"neutral"}`}>{e.status}</span></span></div>)}
    {visible.length===0&&<p className="panel-empty-text">No emails match this filter.</p>}
    </div>
  </section>;
}
function ClientCommunications({client}:{client:ClientRecord}){
  const items=[
    {author:"Jasmine Alvarez",date:"Aug 15, 2026",text:`Reminder sent to ${client.owner==="Unassigned"?"the client team":client.owner} about the outstanding data-ingest exceptions.`},
    {author:"AssurePro",date:"Aug 12, 2026",text:"Engagement letter countersigned and filed automatically from AssurePro."},
    {author:"Meera Kapoor",date:"Aug 9, 2026",text:"Kicked off planning discussion with the engagement team; risk areas confirmed."},
  ];
  return <section className="client-facts-card"><div className="section-title"><div><p className="eyebrow">Client workspace</p><h2>Communications</h2><p>Recent notes and correspondence synced from AssurePro and the audit team.</p></div></div>
    <div className="drawer-comment-list">{items.map((c,i)=><div className="drawer-comment" key={i}><strong>{c.author}</strong><small style={{display:"block",color:"var(--muted)",fontSize:9,marginBottom:4}}>{c.date}</small><p style={{margin:0}}>{c.text}</p></div>)}</div>
  </section>;
}

function EngagementTeam({client}:{client:ClientRecord}){
  const team=CLIENT_TEAMS[client.slug];
  const approvals=[...team.firm].reverse().filter(m=>m.approval!=="Consulted");
  return <section className="engagement-team-card" id="team"><div className="section-title"><div><p className="eyebrow">People & approvals</p><h2>Engagement team</h2><p>Firm users and client contacts assigned to this client, including responsibility and review hierarchy.</p></div><span className="team-total"><Users/>{team.firm.length+team.client.length} people</span></div><div className="approval-chain">{approvals.map((m,i)=><div key={m.initials}><i>{m.initials}</i><span><strong>{m.name}</strong><small>{m.approval}</small></span>{i<approvals.length-1&&<ChevronRight/>}</div>)}</div><div className="team-columns"><div><h3>Firm team <span>{team.firm.length}</span></h3>{team.firm.map(m=><article key={m.initials}><i>{m.initials}</i><span><strong>{m.name}</strong><small>{m.role}</small></span><em>{m.approval}</em></article>)}</div><div><h3>Client team <span>{team.client.length}</span></h3>{team.client.map(m=><article key={m.initials}><i>{m.initials}</i><span><strong>{m.name}</strong><small>{m.role}</small></span><em>{m.approval}</em></article>)}</div></div></section>;
}

const INGEST_STEPS=[
  {id:"details",label:"Engagement details",short:"Details"},{id:"system",label:"Accounting system",short:"System"},{id:"trial-balance",label:"Trial balance",short:"TB"},{id:"general-ledger",label:"General ledger",short:"GL"},{id:"validate",label:"Transform & validate",short:"Validate"},{id:"map-accounts",label:"Map accounts",short:"Map"},{id:"reconcile",label:"Reconcile data",short:"Reconcile"},{id:"materiality",label:"Materiality & handoff",short:"Materiality"},
];

function IngestWorkspace({path,navigate,state,update}:{path:string;navigate:(p:string)=>void;state:DemoState;update:(p:Partial<DemoState>,m?:string)=>void}) {
  const requested=path.split("/").pop()||"details"; const active=Math.max(0,INGEST_STEPS.findIndex(s=>s.id===requested)); const step=INGEST_STEPS[active];
  const clientSlug=path.split("/")[2]||"bbawc"; const client=CLIENTS.find(c=>c.slug===clientSlug)||CLIENTS[0];
  const [system,setSystem]=useState("QuickBooks Online"); const [method,setMethod]=useState("Cloud connector"); const [mapping,setMapping]=useState("Reuse prior-year mapping");
  const [splitResolved,setSplitResolved]=useState(false);
  const [transformDetail,setTransformDetail]=useState<{n:string;s:string;d:string}|null>(null);
  const [mappingExceptionsOpen,setMappingExceptionsOpen]=useState(false);
  const [mappedExceptions,setMappedExceptions]=useState(0);
  const transformCards=[
    {n:"Unbalanced combinations",s:"Pass",d:"0 unresolved transaction groups"},
    {n:"Global concatenation",s:"Applied",d:"318 document lines combined"},
    {n:"Transaction splitting",s:splitResolved?"Approved":"Review",d:splitResolved?"3 batches approved by auditor":"3 batches require auditor review"},
    {n:"Identical transactions",s:"Pass",d:"No duplicate identifiers"},
  ];
  const next=()=>active<7&&navigate(`/engagement/${clientSlug}/ingest/${INGEST_STEPS[active+1].id}`); const back=()=>active>0&&navigate(`/engagement/${clientSlug}/ingest/${INGEST_STEPS[active-1].id}`);
  return <div className="ingest-workspace"><header className="ingest-header"><div><div className="breadcrumbs"><button onClick={()=>navigate(`/clients/${clientSlug}`)}>{client.name}</button><ChevronRight/><span>Data ingest</span></div><div className="title-line"><h1>{step.label}</h1><span className="status-pill progress">Step {active+1} of 8</span></div><p>{client.auditType} · {state.fiscalYear} · Period ended {client.period}</p></div><button className="secondary-btn" onClick={()=>navigate(`/clients/${clientSlug}`)}><X/>Close ingest</button></header>
    <div className="ingest-body"><aside className="ingest-stepper"><div><p className="eyebrow">Data ingest</p><strong>{client.progress}% complete</strong><i><b style={{width:`${client.progress}%`}}/></i></div>{INGEST_STEPS.map((s,i)=><button key={s.id} className={`${i===active?"active":""} ${i<active?"done":""}`} onClick={()=>navigate(`/engagement/${clientSlug}/ingest/${s.id}`)}><i>{i<active?<Check/>:i+1}</i><span><strong>{s.label}</strong><small>{i<active?"Complete":i===active?"In progress":"Not started"}</small></span></button>)}</aside>
      <main className="ingest-main"><section className="ingest-panel"><div className="ingest-panel-head"><div><p className="eyebrow">Step {active+1}</p><h2>{step.label}</h2><p>{["Confirm the period, client responsibility and phase settings before collecting data.","Choose the source system and the safest supported method of data collection.","Collect current-year and prior-year closing balances, then confirm the financial totals.","Collect transaction-level detail using the common data model required for analytics.","Review transformations and data-quality checks before the source data is used downstream.","Map every account to the firm chart of accounts and optional sub-categories.","Investigate control-total exceptions and document the auditor conclusion.","Set preliminary materiality and lock the ingestion package for Workpapers."][active]}</p></div><InfoTip title={step.label} text="Each completed step is retained in the audit trail. Changes to source data will mark dependent work as needing review." standard="AssureAudit data-ingest policy"/></div>
        {active===0&&<div className="ingest-form-grid"><div><Field label="Engagement period"><input value="Jan 1, 2025 – Dec 31, 2025" readOnly/></Field><Field label="Client data owner"><select defaultValue="Dana Collins — Controller"><option>Dana Collins — Controller</option><option>Jasmine Alvarez — Auditor</option></select></Field><Field label="Invite client team"><select defaultValue="Yes — secure request"><option>Yes — secure request</option><option>No — auditor uploads</option></select></Field></div><div className="ingest-summary"><h3>Source package</h3><span><CheckCircle2/><strong>Current-year TB</strong><small>Required</small></span><span><CheckCircle2/><strong>Prior-year closing TB</strong><small>Available</small></span><span><CheckCircle2/><strong>General ledger detail</strong><small>Required</small></span><span><Circle/><strong>Adjustments</strong><small>Optional</small></span></div></div>}
        {active===1&&<><div className="system-picker"><Field label="Accounting system" required><select value={system} onChange={e=>setSystem(e.target.value)}><option>QuickBooks Online</option><option>Xero</option><option>Sage Intacct</option><option>Microsoft Dynamics 365</option><option>Other</option></select></Field><span className="recommended-system"><Sparkles/>Recommended connection available</span></div><div className="method-cards">{[{n:"Cloud connector",d:"Secure, read-only connection with automated refresh.",tag:"Recommended"},{n:"Guided file upload",d:"Use system-specific TB and GL templates.",tag:"Supported"},{n:"System backup",d:"Upload a supported database backup for specialist processing.",tag:"Specialist review"}].map(x=><button key={x.n} className={method===x.n?"active":""} onClick={()=>setMethod(x.n)}><Cloud/><strong>{x.n}</strong><p>{x.d}</p><span>{x.tag}</span></button>)}</div></>}
        {active===2&&<div className="source-file-stack"><SourceFile name="Current-year Trial Balance.xlsx" detail="184 accounts · $9.6M revenue" status="Validated" update={update}/><SourceFile name="Prior-year Closing Trial Balance.xlsx" detail="176 accounts · rolled forward" status="Validated" update={update}/><div className="validation-note"><Info/><span><strong>Required columns</strong>Account code, account description and closing net balance.</span></div></div>}
        {active===3&&<div className="source-file-stack"><SourceFile name="General Ledger Detail.csv" detail="1,204 transactions · Jan 1–Dec 31" status="Processed" update={update}/><div className="cdm-grid"><span><Check/>Account code</span><span><Check/>Transaction ID</span><span><Check/>Net amount</span><span><Check/>Effective date</span><span><Check/>Created date</span><span><Check/>Document type</span><span><Check/>User ID</span><span><Check/>Reference</span><span><Check/>Journal description</span><span><Check/>Line description</span></div><p className="ingest-help">Account code, transaction ID and net amount are mandatory. Optional fields increase the quality of analytics and sampling.</p></div>}
        {active===4&&<><div className="transform-cards">{transformCards.map(x=><article key={x.n}><span className={`status-pill ${x.s==="Review"?"warning":"approved"}`}>{x.s}</span><strong>{x.n}</strong><p>{x.d}</p><button className="text-link" onClick={()=>setTransformDetail(x)}>View details <ArrowRight/></button></article>)}</div>{!splitResolved&&<Banner tone="warning" title="Auditor judgment required" text="Three batch-posting transformations must be reviewed before mapping. Source rows remain preserved." action="Review 3 items" onAction={()=>setTransformDetail(transformCards[2])}/>}</>}
        {active===5&&<><div className="mapping-choice">{["Reuse prior-year mapping","Drag-and-drop mapping","Excel mapping template"].map((x,i)=><button key={x} className={mapping===x?"active":""} onClick={()=>setMapping(x)}><i>{i+1}</i><span><strong>{x}</strong><small>{i===0?"176 codes matched automatically":i===1?"Best for remaining exceptions":"Best for high-volume remapping"}</small></span>{mapping===x&&<Check/>}</button>)}</div><div className="mapping-status"><div><span>Mapped accounts</span><strong>{180+mappedExceptions} / 184</strong></div><i><b style={{width:`${((180+mappedExceptions)/184*100).toFixed(1)}%`}}/></i>{mappedExceptions<4?<button className="secondary-btn" onClick={()=>setMappingExceptionsOpen(true)}>Review {4-mappedExceptions} exception{4-mappedExceptions===1?"":"s"}</button>:<span className="status-pill approved"><Check size={13}/> All accounts mapped</span>}</div></>}
        {active===6&&<><div className="reconcile-summary"><article><span>TB control total</span><strong>$2,210,480</strong><small className="pass"><Check/>Agrees to mapped accounts</small></article><article><span>GL movement</span><strong>$9,602,114</strong><small className="pass"><Check/>Agrees to transaction detail</small></article><article><span>Open exceptions</span><strong>2</strong><small className="warn"><AlertTriangle/>Explanation required</small></article></div><div className="reconcile-table"><div><strong>Issue</strong><strong>Result</strong><strong>Auditor conclusion</strong></div><div><span>2 accounts do not reconcile to closing TB</span><em>Investigate</em><input defaultValue="Timing differences traced to approved adjustments."/></div><div><span>Blank effective dates</span><em className="pass">Accepted</em><input defaultValue="Not used by the client's reporting system."/></div></div><Banner tone="info" title="Authorization" text="When enabled by firm policy, the engagement manager authorizes accepted reconciliation exceptions before completion."/></>}
        {active===7&&<Materiality state={state} update={update} embedded onBack={back} onComplete={()=>{update({materialityLocked:true},"Materiality locked and Data Ingest completed — Workpapers unlocked");navigate(`/engagement/${clientSlug}/planning`)}}/>}
      </section>{active<7&&<footer className="ingest-actions"><button className="secondary-btn" disabled={active===0} onClick={back}><ChevronLeft/>Back</button><span><Check/>Draft saved just now</span><button className="primary-btn" onClick={next}>Save & continue <ArrowRight/></button></footer>}</main>
    </div>
    {transformDetail&&<TransformDetailModal check={transformDetail} resolved={splitResolved} close={()=>setTransformDetail(null)} onResolve={()=>{setSplitResolved(true);update({},"3 batch-posting transformations approved");setTransformDetail(null)}}/>}
    {mappingExceptionsOpen&&<MappingExceptionsModal resolvedCount={mappedExceptions} close={()=>setMappingExceptionsOpen(false)} onResolve={n=>{setMappedExceptions(n);update({},`${n} account mapping${n===1?"":"s"} confirmed`);setMappingExceptionsOpen(false)}}/>}
    </div>;
}

function TransformDetailModal({check,resolved,close,onResolve}:{check:{n:string;s:string;d:string};resolved:boolean;close:()=>void;onResolve:()=>void}){
  const batches=[
    {id:"Batch #114",amount:"$42,180",reason:"Multi-line invoice split across 3 transaction IDs"},
    {id:"Batch #117",amount:"$18,960",reason:"Payroll journal split by department"},
    {id:"Batch #122",amount:"$65,410",reason:"Vendor payment batch split by remittance"},
  ];
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><span className={`status-pill ${check.s==="Review"?"warning":"approved"}`}>{check.s}</span><h2>{check.n}</h2><p>{check.d}</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    {check.n==="Transaction splitting"?<>
      <p className="panel-description">These transaction batches were split by the transformation engine because a single source document mapped to multiple journal lines. Confirm the split is appropriate before the data moves to account mapping.</p>
      <div className="drawer-comment-list">{batches.map(b=><div key={b.id} className="drawer-file"><FileText/><div><strong>{b.id} · {b.amount}</strong><span>{b.reason}</span></div></div>)}</div>
      <div className="modal-actions"><button className="secondary-btn" onClick={close}>Close</button>{!resolved&&<button className="primary-btn" onClick={onResolve}>Approve all 3 <Check size={15}/></button>}</div>
    </>:<>
      <p className="panel-description">This check ran automatically during transformation and requires no auditor action.</p>
      <div className="modal-actions"><button className="primary-btn" onClick={close}>Close</button></div>
    </>}
  </div></div>;
}

function MappingExceptionsModal({resolvedCount,close,onResolve}:{resolvedCount:number;close:()=>void;onResolve:(n:number)=>void}){
  const accounts=[
    {code:"6410",name:"Program Supplies — Youth Services",suggested:"Program Expenses"},
    {code:"6512",name:"Grant Writer Contract Fee",suggested:"Professional Fees"},
    {code:"7020",name:"In-Kind Facility Use",suggested:"Contributed Support"},
    {code:"8110",name:"Board Development Costs",suggested:"Governance Expenses"},
  ];
  const [choices,setChoices]=useState<Record<string,string>>({});
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>Account mapping exceptions</h2><p>4 accounts didn't match the firm chart of accounts automatically. Confirm or reassign each one.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <div className="drawer-comment-list">{accounts.map(a=><div key={a.code} className="drawer-file"><FileText/><div><strong>{a.code} · {a.name}</strong><span>Suggested: {choices[a.code]||a.suggested}</span></div></div>)}</div>
    <Field label="Apply suggested mapping to all 4"><select onChange={e=>{if(e.target.value==="yes")setChoices(Object.fromEntries(accounts.map(a=>[a.code,a.suggested])))}}><option value="">Choose an action</option><option value="yes">Accept all suggested mappings</option></select></Field>
    <div className="modal-actions"><button className="secondary-btn" onClick={close}>Cancel</button><button className="primary-btn" onClick={()=>onResolve(4)}>Confirm mappings <Check size={15}/></button></div>
  </div></div>;
}

function SourceFile({name,detail,status,update}:{name:string;detail:string;status:string;update:(p:Partial<DemoState>,m?:string)=>void}){
  const [open,setOpen]=useState(false);
  const menuRef=useDismiss<HTMLSpanElement>(open,()=>setOpen(false));
  return <article className="source-file"><span><FileSpreadsheet/></span><div><strong>{name}</strong><small>{detail}</small></div><em className="status-pill approved"><Check/>{status}</em>
    <span style={{position:"relative"}} ref={menuRef}>
      <button className="icon-btn" aria-label={`Open actions for ${name}`} aria-expanded={open} onClick={()=>setOpen(!open)}><MoreHorizontal/></button>
      {open&&<div className="dropdown-menu file-actions-menu">
        <button className="dropdown-item" onClick={()=>{setOpen(false);update({},`Upload a replacement for "${name}" (simulated)`)}}><UploadCloud size={14}/><span>Replace file</span></button>
        <button className="dropdown-item" onClick={()=>{setOpen(false);update({},`"${name}" downloaded (simulated)`)}}><Download size={14}/><span>Download</span></button>
        <button className="dropdown-item" onClick={()=>{setOpen(false);update({},`Audit history — "${name}" uploaded by Jasmine Alvarez, validated by Meera Kapoor`)}}><History size={14}/><span>View audit history</span></button>
      </div>}
    </span>
  </article>;
}

function EngagementHome({ navigate, state }: { navigate: (p: string) => void; state: DemoState }) {
  const phases = getPhases(state); const declined = state.acceptanceDecision === "decline"; const foundationDone = phases[0].status === "Complete"; const dataDone = phases[1].status === "Complete"; const pct=planningProgressPct(state); const blockers=attentionItems(state).length; const riskList=allRisks(state); const highRiskCount=riskList.filter(r=>r.level==="High").length;
  const journey=[
    {title:"Acceptance",detail:declined?"Engagement declined":foundationDone?"Accepted · Aug 4":"2 confirmations pending",date:"Aug 4",state:declined?"danger":foundationDone?"complete":"current",route:"setup",progress:foundationDone?100:75},
    {title:"Data foundation",detail:dataDone?"TB and GL reconciled":"4 accounts need mapping",date:"Aug 11",state:dataDone?"complete":foundationDone&&!declined?"current":"locked",route:"data",progress:dataDone?100:state.mapped},
    {title:"Planning",detail:state.locked?"Approved and locked":`${pct}% complete · ${blockers} open`,date:"Aug 20",state:state.locked?"complete":!declined?"current":"locked",route:"planning",progress:pct},
    {title:"Fieldwork",detail:state.locked?"Ready to begin":"Unlocks after approval",date:"Sep 2",state:state.locked?"current":"locked",route:"planning",progress:0},
    {title:"Reporting",detail:"Begins after fieldwork",date:"Apr 30",state:"locked",route:"planning",progress:0},
  ];
  return <div className="page engagement-overview"><div className="breadcrumbs"><button onClick={() => navigate("/dashboard")}>Dashboard</button><ChevronRight/><span>{engagement.displayType}</span></div>
    <div className="engagement-hero"><div><span className={`status-pill ${declined?"danger":"progress"}`}>{declined?"Declined":state.planningStatus}</span><h1>{engagement.clientName}</h1><p>{engagement.displayType} · Period ended {engagement.periodEnd} · {engagement.accountingSystem}</p></div><button className="primary-btn" onClick={() => navigate("/engagement/bbawc/planning")}>Open Planning <ArrowRight/></button></div>
    <div className="summary-grid"><Metric label="Planning progress" value={`${pct}%`} detail={blockers===0?"No blockers":`${blockers} blocker${blockers===1?"":"s"}`}/><Metric label="Client requests" value={`${state.completedRequests} / 6`} detail={`${Math.max(6-state.completedRequests,0)} outstanding`}/><Metric label="Assessed risks" value={String(riskList.length)} detail={`${highRiskCount} high risk`}/><Metric label="Fieldwork" value={state.locked ? "Unlocked" : "Locked"} detail={state.locked ? "Ready to begin" : "Approve Planning first"}/></div>
    <div className="engagement-overview-grid"><section className="section-card engagement-journey"><div className="section-title"><div><p className="eyebrow">Engagement lifecycle</p><h2>From acceptance to reporting</h2><p>Dates, current status and the next available action.</p></div><button className="text-link" onClick={() => navigate("/engagement/bbawc/planning/audit-trail")}>View audit trail <ArrowRight/></button></div><div className="journey-track">{journey.map((step,i)=><button key={step.title} className={`journey-step ${step.state}`} disabled={step.state==="locked"} onClick={()=>navigate(`/engagement/bbawc/${step.route==="planning"?"planning":`planning/${step.route}`}`)}><span className="journey-marker">{step.state==="complete"?<Check/>:step.state==="danger"?<AlertCircle/>:step.state==="locked"?<LockKeyhole/>:<span>{i+1}</span>}</span><span className="journey-copy"><small>{step.date}</small><strong>{step.title}</strong><em>{step.detail}</em><i><b style={{width:`${step.progress}%`}}/></i></span><ChevronRight/></button>)}</div></section>
      <section className="section-card engagement-facts"><div className="section-title"><div><p className="eyebrow">From signed engagement letter</p><h2>Engagement details</h2><p>Read-only facts synchronized from AssurePro.</p></div><span className="source-badge"><CheckCircle2/>Synced</span></div><dl><div><dt>Engagement type</dt><dd>{engagement.engagementType}</dd></div><div><dt>Reporting framework</dt><dd>{engagement.reportingFramework}</dd></div><div><dt>Entity type</dt><dd>{engagement.entityType}</dd></div><div><dt>Service scope</dt><dd>{engagement.serviceScope}</dd></div><div><dt>Period covered</dt><dd>{engagement.periodStart} – {engagement.periodEnd}</dd></div><div><dt>Reporting deadline</dt><dd>{engagement.reportingDeadline}</dd></div><div><dt>Engagement letter</dt><dd>{engagement.engagementLetter}</dd></div><div><dt>Locations in scope</dt><dd>{engagement.locations}</dd></div><div><dt>Engagement partner</dt><dd>{engagement.partner}</dd></div><div><dt>Engagement manager</dt><dd>{engagement.manager}</dd></div></dl><button className="secondary-btn full" onClick={()=>navigate("/engagement/bbawc/planning/setup")}>Review engagement terms <ArrowRight/></button></section></div>
  </div>;
}

function PlanningShell({ path, navigate, state, update, drawer, setDrawer, drawerOpen, setDrawerOpen, demoOpen, setDemoOpen }: any) {
  const view = path.split("/").pop() || "planning";
  const activeView = view === "planning" ? "overview" : view;
  return <div className="planning-layout">
    <section className={`planning-workspace ${drawerOpen ? "with-drawer" : ""}`}>
      <PlanningHeader state={state} update={update} navigate={navigate} activeView={activeView} demoOpen={demoOpen} setDemoOpen={setDemoOpen}/>
      <div className="workspace-scroll">
        {activeView === "overview" && <PlanningOverview state={state} update={update} navigate={navigate}/>} 
        {activeView === "setup" && <SetupView state={state} update={update}/>} 
        {activeView === "data" && <DataView state={state} update={update}/>} 
        {activeView === "entity-controls" && <EntityControls state={state} update={update}/>} 
        {activeView === "materiality" && <div className="content-pad"><Banner tone="info" title="Materiality is maintained in Data Ingest" text="Workpapers use the locked materiality version from the reconciled Trial Balance. There is no second materiality setup in Planning." action="Open materiality" onAction={()=>navigate("/engagement/bbawc/ingest/materiality")}/></div>} 
        {activeView === "risks" && <RisksView state={state} update={update} navigate={navigate}/>} 
        {activeView === "responses" && <ResponsesView state={state} update={update}/>} 
        {activeView === "publish" && <PublishView state={state} update={update} navigate={navigate}/>} 
        {activeView === "review" && <ReviewView state={state} update={update}/>} 
        {activeView === "audit-trail" && <AuditTrail update={update}/>}
      </div>
    </section>
    <ContextDrawer drawer={drawer} setDrawer={setDrawer} open={drawerOpen} setOpen={setDrawerOpen} update={update}/>
  </div>;
}

function PlanningHeader({ state, update, navigate, activeView, demoOpen, setDemoOpen }: any) {
  const titles: Record<string,string> = { overview:"Workpapers overview", setup:"Engagement Foundation", data:"Data Foundation", "entity-controls":"Entity & Controls", materiality:"Materiality from Data Ingest", risks:"Risk Assessment", responses:"Audit Response", publish:"Publish & Approval", review:"Review & approval", "audit-trail":"Audit trail" };
  const declined = state.acceptanceDecision === "decline";
  return <div className="planning-header"><div><div className="breadcrumbs"><button onClick={()=>navigate("/engagement/bbawc/planning")}>Workpapers</button>{activeView!=="overview"&&<><ChevronRight/><span>{titles[activeView]}</span></>}</div><div className="title-line"><h1>{titles[activeView]}</h1><span className={`status-pill ${declined ? "danger" : state.locked ? "approved" : "progress"}`}>{declined ? "Engagement declined" : state.locked ? "Approved & locked" : state.planningStatus}</span>{state.reopened && <span className="status-pill danger">Reopened</span>}</div><p>{state.fiscalYear} · Period ended {engagement.periodEnd}</p></div>
    <div className="header-actions"><span className="saved"><Check size={14}/>Saved 2:42 PM IST <i>· stored in UTC</i></span></div></div>;
}

function FieldworkShell({ path, navigate, state, update }: { path:string; navigate:(p:string)=>void; state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const [drawer,setDrawer]=useState("Comments"); const [drawerOpen,setDrawerOpen]=useState(false);
  return <div className="planning-layout">
    <section className={`planning-workspace ${drawerOpen?"with-drawer":""}`}>
      <div className="planning-header"><div><div className="breadcrumbs"><button onClick={()=>navigate("/engagement/bbawc/planning")}>Workpapers</button><ChevronRight/><span>Fieldwork</span></div><div className="title-line"><h1>Fieldwork</h1><span className={`status-pill ${state.fieldworkSynced?"progress":"neutral"}`}>{state.fieldworkSynced?`Testing · ${state.fieldworkPeriod}`:"Awaiting data sync"}</span></div><p>{state.fiscalYear} · Period ended {engagement.periodEnd}</p></div>
        <div className="header-actions"><span className="saved"><Check size={14}/>Saved 2:42 PM IST <i>· stored in UTC</i></span></div></div>
      <div className="workspace-scroll"><FieldworkWorkspace state={state} update={update}/></div>
    </section>
    <ContextDrawer drawer={drawer} setDrawer={setDrawer} open={drawerOpen} setOpen={setDrawerOpen} update={update}/>
  </div>;
}

function FieldworkWorkspace({ state, update }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const [tab,setTab]=useState<"Sync"|"Testing">(state.fieldworkSynced?"Testing":"Sync");
  return <div className="content-pad">
    <Banner tone="info" title="Fieldwork has its own Data Ingest sync" text="Planning TB answers 'where are the risks and what should we plan.' Fieldwork re-ingests an updated TB/GL — often an interim period such as 10 months — so testing is performed against current data, not preliminary planning figures. Data Ingest, Planning and Fieldwork all read from the same client data sources."/>
    <div className="subtabs"><button className={tab==="Sync"?"active":""} onClick={()=>setTab("Sync")}>Data sync{!state.fieldworkSynced&&<b className="warn">1</b>}</button><button className={tab==="Testing"?"active":""} onClick={()=>setTab("Testing")}>Testing procedures</button></div>
    {tab==="Sync"?<FieldworkSync state={state} update={update} onSynced={()=>setTab("Testing")}/>:<FieldworkTesting state={state} update={update} onGoToSync={()=>setTab("Sync")}/>}
  </div>;
}

const FIELDWORK_TB_COMPARE=[
  {area:"Cash",planning:612480,fieldwork:698340,reason:"Additional receipts posted through the interim period"},
  {area:"Contributions receivable",planning:486200,fieldwork:512900,reason:"New pledges recorded; allowance not yet updated for the period"},
  {area:"Investments",planning:742100,fieldwork:758600,reason:"Unrealized gains recognized at the interim mark"},
  {area:"Contribution revenue",planning:3840000,fieldwork:4106500,reason:"Year-end grant milestone revenue recognized"},
  {area:"Program service expenses",planning:5420000,fieldwork:5687200,reason:"Payroll accruals and program cost true-ups posted"},
];
function FieldworkSync({ state, update, onSynced }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void; onSynced:()=>void }) {
  const [period,setPeriod]=useState("10 months ended Oct 31, 2025");
  const [tbProgress,setTbProgress]=useState(state.fieldworkSynced?100:0);
  const [glProgress,setGlProgress]=useState(state.fieldworkSynced?100:0);
  const bothUploaded=tbProgress===100&&glProgress===100;
  const upload=(setter:(n:number)=>void)=>{setter(38);setTimeout(()=>setter(100),1000)};
  if(state.fieldworkSynced){
    return <>
      <div className="synced-detail-banner"><CheckCircle2/><span><strong>Fieldwork data synced</strong>{state.fieldworkPeriod} · source facts feed the testing procedures below</span></div>
      <div className="table-card"><table><thead><tr><th>Financial statement area</th><th>Planning TB</th><th>Fieldwork TB</th><th>Movement</th><th>Why it changed</th></tr></thead><tbody>{FIELDWORK_TB_COMPARE.map(r=><tr key={r.area}><td><strong>{r.area}</strong></td><td>{money(r.planning)}</td><td>{money(r.fieldwork)}</td><td className="variance">+{money(r.fieldwork-r.planning)}</td><td>{r.reason}</td></tr>)}</tbody></table></div>
      <button className="secondary-btn" onClick={()=>{setTbProgress(0);setGlProgress(0);update({fieldworkSynced:false},"Fieldwork data sync reopened — upload an updated TB/GL to re-sync")}}><RefreshCw size={15}/>Re-sync with a newer period</button>
    </>;
  }
  return <>
    <div className="connector-card"><div className="connector-logo">qb</div><div><span className="card-label">Accounting system</span><h3>{engagement.accountingSystem}</h3><p>Same connection used for Data Ingest and Planning</p></div><span className="status-pill approved">{state.connector}</span></div>
    <Field label="Fieldwork period" required><select value={period} onChange={e=>setPeriod(e.target.value)}><option>10 months ended Oct 31, 2025</option><option>11 months ended Nov 30, 2025</option><option>Final — 12 months ended Dec 31, 2025</option></select></Field>
    <div className="upload-grid">
      <UploadCard title="Fieldwork Trial Balance" file="BB-AWC_TB_Interim.xlsx" rows="184 accounts" status={tbProgress===100?"Ingested":"Not started"} progress={tbProgress} onUpload={()=>upload(setTbProgress)} update={update}/>
      <UploadCard title="Fieldwork General Ledger Detail" file="BB-AWC_GL_Interim.csv" rows="1,486 transactions" status={glProgress===100?"Ingested":"Not started"} progress={glProgress} onUpload={()=>upload(setGlProgress)} update={update}/>
    </div>
    <div className="modal-actions"><button className="primary-btn" disabled={!bothUploaded} onClick={()=>{update({fieldworkSynced:true,fieldworkPeriod:period},`Fieldwork data synced — ${period}`);onSynced()}}><Zap size={15}/>Confirm sync & compare to Planning</button></div>
  </>;
}

type FieldworkProcedure={id:number;title:string;area:string;risk:string;type:string;assignee:string;sampleSize:string;status:string;exceptions:string;evidenceCount:number};
const FIELDWORK_AREAS=["Cash & revenue","Expenses & payroll","Estimates & disclosures","Completion"];
const FIELDWORK_PROCEDURES:FieldworkProcedure[]=[
  {id:1,title:"Test contribution cutoff around year end",area:"Cash & revenue",risk:"Revenue cutoff",type:"Substantive",assignee:"J. Alvarez",sampleSize:"25 of 412 transactions",status:"In progress",exceptions:"",evidenceCount:2},
  {id:2,title:"Inspect restricted grant terms and performance conditions",area:"Cash & revenue",risk:"Revenue cutoff",type:"Substantive",assignee:"J. Alvarez",sampleSize:"6 of 6 grant agreements",status:"Not started",exceptions:"",evidenceCount:0},
  {id:3,title:"Confirm cash and investment balances",area:"Cash & revenue",risk:"Cash existence",type:"Substantive",assignee:"M. Kapoor",sampleSize:"3 of 3 institutions",status:"Signed off",exceptions:"No exceptions noted.",evidenceCount:3},
  {id:4,title:"Test payroll register for proper authorization",area:"Expenses & payroll",risk:"Payroll allocation",type:"Controls",assignee:"J. Alvarez",sampleSize:"15 of 260 pay periods",status:"Ready for review",exceptions:"One late approval noted; not considered an exception.",evidenceCount:4},
  {id:5,title:"Test journal entries using fraud-risk criteria",area:"Expenses & payroll",risk:"Management override",type:"Substantive",assignee:"M. Kapoor",sampleSize:"18 of 1,204 entries",status:"In progress",exceptions:"",evidenceCount:1},
  {id:6,title:"Evaluate allowance methodology and subsequent receipts",area:"Estimates & disclosures",risk:"Allowance for pledges",type:"Substantive",assignee:"J. Alvarez",sampleSize:"Full population",status:"Not started",exceptions:"",evidenceCount:0},
  {id:7,title:"Review related-party disclosures for completeness",area:"Estimates & disclosures",risk:"Related parties",type:"Substantive",assignee:"Oscar Owner",sampleSize:"All identified relationships",status:"Not started",exceptions:"",evidenceCount:0},
  {id:8,title:"Complete disclosure checklist and financial statement tie-out",area:"Completion",risk:"Presentation & disclosure",type:"Analytical",assignee:"M. Kapoor",sampleSize:"Full financial statements",status:"Not started",exceptions:"",evidenceCount:0},
];
function fieldworkTone(status:string){return status==="Signed off"?"approved":status==="Ready for review"?"warning":status==="In progress"?"progress":"neutral"}
function FieldworkTesting({ state, update, onGoToSync }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void; onGoToSync:()=>void }) {
  const [procedures,setProcedures]=useState<FieldworkProcedure[]>(FIELDWORK_PROCEDURES);
  const [selected,setSelected]=useState<FieldworkProcedure|null>(null);
  const [expanded,setExpanded]=useState<Record<string,boolean>>(Object.fromEntries(FIELDWORK_AREAS.map(a=>[a,true])));
  const signedOff=procedures.filter(p=>p.status==="Signed off").length;
  const inProgress=procedures.filter(p=>p.status==="In progress"||p.status==="Ready for review").length;
  const updateProcedure=(id:number,patch:Partial<FieldworkProcedure>)=>{setProcedures(ps=>ps.map(p=>p.id===id?{...p,...patch}:p));setSelected(s=>s&&s.id===id?{...s,...patch}:s)};
  return <>
    {!state.fieldworkSynced&&<Banner tone="warning" title="Testing against pre-sync data" text="Fieldwork data hasn't been synced yet — figures referenced below are still from the Planning trial balance." action="Sync Fieldwork data" onAction={onGoToSync}/>}
    <div className="risk-summary"><div><strong>{procedures.length}</strong><span>Procedures</span></div><div className="moderate"><strong>{inProgress}</strong><span>In progress</span></div><div className="high"><strong>{procedures.filter(p=>p.status==="Not started").length}</strong><span>Not started</span></div><div className="low"><strong>{signedOff}</strong><span>Signed off</span></div><div><strong>{Math.round(signedOff/procedures.length*100)}%</strong><span>Complete</span></div></div>
    <div className="planning-board-grid"><div className="workpaper-groups">{FIELDWORK_AREAS.map(area=>{
      const rows=procedures.filter(p=>p.area===area);
      const done=rows.filter(p=>p.status==="Signed off").length;
      const pct=rows.length?Math.round(done/rows.length*100):0;
      const isOpen=!!expanded[area];
      return <section className="workpaper-stage" key={area}><button className="stage-toggle" onClick={()=>setExpanded(v=>({...v,[area]:!isOpen}))}><span><strong>{area}</strong><small>{rows.length-done} active · {done} signed off</small></span><span className="stage-progress"><b>{pct}%</b><i><em style={{width:`${pct}%`}}/></i>{isOpen?<ChevronDown/>:<ChevronRight/>}</span></button>
        {isOpen&&<div className="stage-rows">{rows.map(row=><button className="workpaper-row-refined" key={row.id} onClick={()=>setSelected(row)}>
          <span className={`workpaper-state ${fieldworkTone(row.status)}`}>{row.status==="Signed off"?<Check/>:row.status==="Ready for review"?<Clock3/>:<Circle/>}</span>
          <span className="workpaper-title"><strong>{row.title}</strong><small>{row.status} · {row.sampleSize}</small></span>
          <span className="row-meter"><i><em style={{width:`${row.status==="Signed off"?100:row.status==="Ready for review"?90:row.status==="In progress"?45:0}%`}}/></i></span>
          <span className="review-count">{row.exceptions&&<><AlertTriangle size={13}/>1</>}</span>
          <i className="person-avatar violet">{row.assignee.split(" ").map(n=>n[0]).join("").slice(0,2)}</i>
          <span className="row-due"><small>Type</small>{row.type}</span>
          <ChevronRight/>
        </button>)}</div>}
      </section>;
    })}</div>
      <aside className="planning-insight-rail"><section><div className="rail-title"><h3>Key information</h3><InfoTip title="Key information" text="Figures flow from the synced Fieldwork trial balance once available; otherwise the Planning trial balance is shown." standard="AssureAudit data lineage"/></div><dl><div><dt>Fieldwork period</dt><dd>{state.fieldworkPeriod||"Not synced"}</dd></div><div><dt>Procedures signed off</dt><dd>{signedOff} of {procedures.length}</dd></div></dl></section><section><div className="rail-title"><h3>Needs attention</h3><span className="rail-count">{procedures.filter(p=>p.exceptions).length}</span></div>{procedures.filter(p=>p.exceptions).map(p=><button key={p.id} onClick={()=>setSelected(p)}><AlertTriangle/><span><strong>Exception noted</strong><small>{p.title}</small></span><ChevronRight/></button>)}{procedures.filter(p=>p.exceptions).length===0&&<p className="panel-empty-text">No exceptions noted yet.</p>}</section></aside>
    </div>
    {selected&&<FieldworkProcedureDrawer procedure={selected} close={()=>setSelected(null)} onUpdate={patch=>updateProcedure(selected.id,patch)} update={update}/>}
  </>;
}

function FieldworkProcedureDrawer({ procedure, close, onUpdate, update }: { procedure:FieldworkProcedure; close:()=>void; onUpdate:(p:Partial<FieldworkProcedure>)=>void; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const [statusMenuOpen,setStatusMenuOpen]=useState(false);
  const statusMenuRef=useDismiss(statusMenuOpen,()=>setStatusMenuOpen(false));
  const [exceptions,setExceptions]=useState(procedure.exceptions);
  const nextStatus:Record<string,string>={"Not started":"In progress","In progress":"Ready for review","Ready for review":"Signed off","Signed off":"Signed off"};
  return <div className="detail-drawer"><div className="drawer-head"><div><span className={`status-pill ${fieldworkTone(procedure.status)}`}>{procedure.status}</span><h2>{procedure.title}</h2><p>{procedure.type} · {procedure.assignee}</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <div className="drawer-body">
      <InfoBlock label="Relevant risk" text={procedure.risk}/>
      <div className="two-col"><InfoBlock label="Sample" text={procedure.sampleSize}/><InfoBlock label="Evidence attached" text={`${procedure.evidenceCount} file${procedure.evidenceCount===1?"":"s"}`}/></div>
      <span className="drawer-label">Exceptions & conclusion</span>
      <textarea value={exceptions} onChange={e=>setExceptions(e.target.value)} placeholder="Document what was tested, sample results and conclusion…" style={{marginBottom:14}}/>
      {procedure.evidenceCount===0?<div className="panel-upload-empty"><p>No evidence uploaded yet.</p><button className="secondary-btn" onClick={()=>{onUpdate({evidenceCount:1});update({},`Evidence attached to "${procedure.title}"`)}}><UploadCloud size={15}/>Upload evidence</button></div>:<div className="drawer-file"><FileText/><div><strong>{procedure.evidenceCount} evidence file{procedure.evidenceCount===1?"":"s"} attached</strong><span>Workpaper support · testing documentation</span></div></div>}
    </div>
    <div className="drawer-actions">
      <div className="topbar-popover" ref={statusMenuRef}><button className="secondary-btn" onClick={()=>setStatusMenuOpen(!statusMenuOpen)}><RefreshCw size={15}/>Change status</button>{statusMenuOpen&&<div className="dropdown-menu status-menu">{["Not started","In progress","Ready for review","Signed off"].map(s=><button key={s} className="dropdown-item" onClick={()=>{setStatusMenuOpen(false);onUpdate({status:s});update({},`"${procedure.title}" marked ${s}`)}}><span className={`tone-dot ${fieldworkTone(s)}`}/><span>{s}</span></button>)}</div>}</div>
      <button className="secondary-btn" onClick={()=>{onUpdate({exceptions});update({},"Conclusion saved to the workpaper")}}>Save conclusion</button>
      <button className="primary-btn" disabled={procedure.status==="Signed off"} onClick={()=>{onUpdate({exceptions,status:nextStatus[procedure.status]});update({},`"${procedure.title}" moved to ${nextStatus[procedure.status]}`)}}>{procedure.status==="Ready for review"?<>Sign off <Check size={15}/></>:<>Move to {nextStatus[procedure.status]} <ArrowRight size={15}/></>}</button>
    </div>
  </div>;
}

function PlanningOverview({ state, update, navigate }: { state: DemoState; update:(p:Partial<DemoState>,m?:string)=>void; navigate:(p:string)=>void }) {
  const declined = state.acceptanceDecision === "decline";
  return <div className="content-pad">
    {declined && <Banner tone="danger" title="Engagement declined" text="This engagement was declined during Acceptance & continuance. Planning does not proceed to Fieldwork while this decision stands."/>}
    {state.reopened && <Banner tone="danger" title="Planning was reopened after Fieldwork began" text="8 workpapers reference affected variables and require re-review. Prior approval history is preserved."/>}
    {state.rolledForward && <Banner tone="warning" title="Started from prior year" text="Structure and methodology were copied as editable drafts. Current-year evidence, financial data and dollar conclusions were not carried forward."/>}
    <PlanningManager state={state} update={update} navigate={navigate}/>
  </div>;
}

function SetupView({ state, update }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const [tab,setTab]=useState("Acceptance & continuance");
  const [tabsDone,setTabsDone]=useState<Record<string,boolean>>({});
  const tabs=["Acceptance & continuance","Independence","Engagement details","Strategy & resources"];
  const completeCurrentTab=()=>{
    setTabsDone(d=>({...d,[tab]:true}));
    if(tab==="Independence") update({independenceOutstanding:0},"All independence confirmations received");
    else update({},`${tab} marked complete and saved to the audit trail`);
  };
  return <div className="content-pad"><div className="subtabs">{tabs.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}{tabsDone[t]&&<Check size={13}/>}</button>)}</div>
    {tab==="Acceptance & continuance" && <FormSection update={update} title="Acceptance & continuance" subtitle="Document the engagement decision and safeguards before planning proceeds.">
      <div className="form-grid"><Field label="Engagement relationship"><select><option>Recurring client</option><option>First-year client</option></select></Field><Field label="Engagement risk classification"><select><option>Moderate</option><option>Low</option><option>High</option></select></Field></div>
      <Field label="Management integrity considerations" required><textarea defaultValue="Management has been responsive and transparent. No integrity concerns were identified through continuance procedures or prior-year communications."/></Field>
      <CheckRow title="Predecessor-auditor communication" detail="Not applicable — recurring engagement" checked/><CheckRow title="Conflicts and disqualifying conditions" detail="Search completed; no conflicts identified" checked/><CheckRow title="Engagement terms refreshed" detail="2025 engagement letter signed August 4, 2025" checked/>
      <div className="decision-row"><span>Conclusion</span>
        <button className={`decision ${state.acceptanceDecision==="accept"?"active":""}`} onClick={()=>update({acceptanceDecision:"accept",...(state.planningStatus==="Declined"?{planningStatus:"In Progress"}:{})},"Continuance decision recorded: Accept")}>{state.acceptanceDecision==="accept"&&<Check/>}Accept</button>
        <button className={`decision safeguards ${state.acceptanceDecision==="safeguards"?"active":""}`} onClick={()=>update({acceptanceDecision:"safeguards",...(state.planningStatus==="Declined"?{planningStatus:"In Progress"}:{})},"Continuance decision recorded: Accept with safeguards — safeguards rationale required before Planning can proceed")}>{state.acceptanceDecision==="safeguards"&&<Check/>}Accept with safeguards</button>
        <button className={`decision danger ${state.acceptanceDecision==="decline"?"active":""}`} onClick={()=>update({acceptanceDecision:"decline",locked:false,managerApproved:false,partnerApproved:false,planningStatus:"Declined"},"Continuance decision recorded: Decline — this engagement cannot proceed to Fieldwork")}>{state.acceptanceDecision==="decline"&&<Check/>}Decline</button>
      </div>
      {state.acceptanceDecision==="safeguards" && <Field label="Safeguards rationale — required before Planning can proceed" required><textarea value={state.acceptanceSafeguardsNote} onChange={e=>update({acceptanceSafeguardsNote:e.target.value})} placeholder="Describe the specific safeguards applied to address the threats to independence or objectivity identified…"/></Field>}
      {state.acceptanceDecision==="decline" && <Banner tone="danger" title="Engagement declined" text="This conclusion is recorded in the audit trail. Every other Planning step is blocked while this decision stands — change the decision above to resume."/>}
    </FormSection>}
    {tab==="Independence" && <FormSection update={update} title="Team independence" subtitle="All assigned team members must confirm before final approval.">
      <Banner tone={state.independenceOutstanding===0?"success":"warning"} title={state.independenceOutstanding===0?"All confirmations received":`${state.independenceOutstanding} confirmation${state.independenceOutstanding===1?"":"s"} outstanding`} text="A team change will reopen this conclusion and require reconfirmation."/>
      <Member update={update} name="Jasmine Alvarez" role="Senior / Preparer" status="Confirmed"/><Member update={update} name="Meera Kapoor" role="Manager" status="Confirmed"/><Member update={update} name="Oscar Owner" role="Engagement Partner" status={state.independenceOutstanding>=2?"Pending":"Confirmed"}/><Member update={update} name="Leo Chen" role="Tax specialist" status={state.independenceOutstanding>=1?"Pending":"Confirmed"}/>
    </FormSection>}
    {tab==="Engagement details" && <FormSection update={update} title="Engagement details & terms" subtitle="Read-only facts synchronized from the signed engagement letter in AssurePro."><div className="synced-detail-banner"><CheckCircle2/><span><strong>Engagement letter synchronized</strong>{engagement.engagementLetter} · source facts are controlled in AssurePro</span></div><div className="engagement-fact-grid"><InfoBlock label="Entity" text={engagement.clientName}/><InfoBlock label="Entity type" text={engagement.entityType}/><InfoBlock label="Engagement type" text={engagement.engagementType}/><InfoBlock label="Reporting framework" text={engagement.reportingFramework}/><InfoBlock label="Period covered" text={`${engagement.periodStart} – ${engagement.periodEnd}`}/><InfoBlock label="Reporting deadline" text={engagement.reportingDeadline}/><InfoBlock label="Industry" text={engagement.industry}/><InfoBlock label="Locations in scope" text={engagement.locations}/><InfoBlock label="Engagement partner" text={engagement.partner}/><InfoBlock label="Engagement manager" text={engagement.manager}/></div><CheckRow title="Group audit" detail="Not enabled — no components identified in the signed engagement scope" checked/></FormSection>}
    {tab==="Strategy & resources" && <FormSection update={update} title="Audit strategy & resources" subtitle="Set scope, timing, staffing and key planning milestones."><Field label="Overall strategy"><textarea defaultValue="Risk-based audit focused on contributions, revenue cutoff, management override and related-party disclosures. Controls reliance planned for cash receipts and payroll."/></Field><div className="form-grid"><Field label="Planned hours"><input type="number" defaultValue="386"/></Field><Field label="Fraud discussion"><input value="Completed Aug 9, 2025" readOnly/></Field></div><div className="allocation"><BarChart3/><div><strong>386 planned hours</strong><span>Preparer 248 · Manager 96 · Partner 32 · Specialist 10</span></div><div className="allocation-bar"><i style={{width:"64%"}}/><i style={{width:"25%"}}/><i style={{width:"8%"}}/><i style={{width:"3%"}}/></div></div></FormSection>}
    <StickyActions update={update} onComplete={completeCurrentTab} completed={!!tabsDone[tab]}/></div>;
}

const RECON_CYCLE: Record<string,string> = { "Accepted":"Investigate", "Investigate":"Resolved", "Resolved":"Accepted" };
function DataView({ state, update }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const [tab,setTab]=useState("Import"); const [upload,setUpload]=useState(100); const [unmappedOnly,setUnmappedOnly]=useState(true);
  const reconRows=state.reconciliationRows;
  const cycleRecon=(account:string)=>update({reconciliationRows:reconRows.map(r=>r.account===account?{...r,status:RECON_CYCLE[r.status]||"Accepted"}:r)});
  const postAdjustment=()=>{
    const n=reconRows.length+1;
    update({reconciliationRows:[...reconRows,{account:`Proposed adjustment #${n}`,tb:"—",gl:"—",variance:"$0",status:"Accepted",owner:"J. Alvarez"}]},"Proposed adjustment posted to the reconciliation log");
  };
  const mappingRows=[
    ["4015","Adoption fee income","$486,210","Program service revenue","Adoption services revenue","98%","Accepted"],
    ["4020","Restricted grant receipts","$1,122,000","Contributions & grants","Government grants","94%","Accepted"],
    ["4998","Misc rev - events","$84,200","Special events revenue","Fundraising event revenue","71%","Review"],
    ["6125","Vet outreach exp","$318,440","Program expenses","Veterinary services","68%","Review"],
    ["7142","Board retreat","$26,100","Management & general","Governance expenses","62%","Review"],
    ["8890","Net asset release","($210,000)","Net assets","Released from restrictions","58%","Review"],
  ];
  return <div className="content-pad"><div className="subtabs"><button className={tab==="Import"?"active":""} onClick={()=>setTab("Import")}>Import TB & GL</button><button className={tab==="Transformation"?"active":""} onClick={()=>setTab("Transformation")}>Transformation</button><button className={tab==="Mapping"?"active":""} onClick={()=>setTab("Mapping")}>Account mapping <span className="count">4</span></button><button className={tab==="Reconciliation"?"active":""} onClick={()=>setTab("Reconciliation")}>Reconciliation <span className="count">{reconRows.length}</span></button></div>
    {state.connector==="Expired" && <Banner tone="danger" title="QuickBooks connection expired" text="Previously ingested data is preserved. Re-authenticate to sync new data; no accounting credentials are displayed or stored in this prototype." action="Reconnect safely" onAction={()=>update({connector:"Connected"},"QuickBooks reconnected successfully")}/>}
    {tab==="Import" && <>
      <div className="connector-card"><div className="connector-logo">qb</div><div><span className="card-label">Accounting system</span><h3>{engagement.accountingSystem}</h3><p>Connected to {engagement.clientName}</p></div><span className={`status-pill ${state.connector==="Connected"?"approved":"danger"}`}>{state.connector}</span><button className="secondary-btn" onClick={()=>update({connector:"Connected"},"Connection test passed")}>Test connection</button></div>
      <div className="upload-grid"><UploadCard title="Trial Balance" file="BB-AWC_TB_2025.xlsx" rows="184 accounts" status="Validated" progress={100} onUpload={()=>setUpload(100)} update={update}/><UploadCard title="General Ledger Detail" file="BB-AWC_GL_2025.csv" rows="1,204 transactions" status={upload===100?"Ingested":"Uploading"} progress={upload} onUpload={()=>{setUpload(42);setTimeout(()=>setUpload(100),1200)}} update={update}/></div>
      <div className="source-summary"><div><Database/><span><strong>Period selected</strong>Jan 1 – Dec 31, 2025</span></div><div><Table2/><span><strong>Control totals</strong>Debits $12,886,420 · Credits $12,886,420</span></div><div><Clock3/><span><strong>Last synchronized</strong>Aug 11, 2025 · 2:31 PM IST</span></div></div>
    </>}
    {tab==="Transformation" && <><div className="section-title"><div><h2>Review transaction transformation</h2><p>Compare imported values with AssureAudit normalization rules.</p></div><span className={`control-status ${state.controlTotals==="Pass"?"pass":"fail"}`}>{state.controlTotals==="Pass"?<CheckCircle2/>:<AlertCircle/>}Control totals {state.controlTotals.toLowerCase()}</span></div>
      {state.controlTotals==="Fail" && <Banner tone="danger" title="Debit and credit totals differ by $18,420" text="Progression is blocked. A Firm Administrator may override with a mandatory rationale."/>}
      {state.flaggedForReview && <Banner tone="warning" title="Issue flagged for investigation" text="This dataset is flagged pending follow-up. Clear the flag once the issue is resolved." action="Clear flag" onAction={()=>update({flaggedForReview:false},"Flag cleared — issue resolved")}/>}
      <div className="table-card"><table><thead><tr><th>Field</th><th>Before import</th><th>Normalized result</th><th>Rule applied</th></tr></thead><tbody><tr><td>Date</td><td>12/31/25</td><td>2025-12-31</td><td>ISO date formatting</td></tr><tr><td>Debit / credit</td><td>CR 8,420.00</td><td>−8,420.00</td><td>Credit sign convention</td></tr><tr><td>Account number</td><td>4015.00</td><td>4015</td><td>Remove decimal suffix</td></tr><tr><td>Blank memo</td><td>—</td><td>Not provided</td><td>Null normalization</td></tr></tbody></table></div>{state.transformationConfirmed && <Banner tone="success" title="Transformation confirmed" text="This dataset is locked as the single source of truth for Mapping and Reconciliation."/>}<div className="inline-actions"><button className="secondary-btn" disabled={state.flaggedForReview} onClick={()=>update({flaggedForReview:true},"Issue flagged for investigation")}>{state.flaggedForReview?<><Check size={16}/>Flagged</>:"Flag issue"}</button><button className="primary-btn" disabled={state.controlTotals==="Fail"||state.transformationConfirmed} onClick={()=>update({transformationConfirmed:true},"Transformation confirmed and dataset locked")}>{state.transformationConfirmed?<><Check size={16}/>Confirmed</>:"Confirm transformation"}</button></div></>}
    {tab==="Mapping" && <><Banner tone="warning" title={`${state.mapped}% mapped automatically; ${state.mapped===100?0:4} accounts need review`} text="High-confidence matches use current-year account names and prior-year mappings. Every account must map exactly once."/>
      <div className="table-toolbar"><div className="search"><Search/><input placeholder="Search account or FSA"/></div><label className="switch-label"><input type="checkbox" checked={unmappedOnly} onChange={e=>setUnmappedOnly(e.target.checked)}/><i/>Needs review only</label><select><option>AssureAudit Nonprofit (US)</option><option>Commercial</option><option>EBP</option><option>Fund</option><option>Government</option></select><button className="secondary-btn" onClick={()=>update({mapped:100},"4 mappings accepted; all 184 accounts are mapped")}>Accept high confidence</button></div>
      <div className="table-card mapping-table"><table><thead><tr><th>Client account</th><th>Name</th><th>Balance</th><th>Suggested FSA</th><th>Standard account</th><th>Confidence</th><th>Status</th></tr></thead><tbody>{mappingRows.filter(r=>!unmappedOnly||r[6]==="Review").map(r=><tr key={r[0]}><td>{r[0]}</td><td><strong>{r[1]}</strong></td><td>{r[2]}</td><td><select defaultValue={r[3]}><option>{r[3]}</option><option>Other income</option><option>Program expenses</option><option>Net assets</option></select></td><td>{r[4]}</td><td><span className={`confidence ${parseInt(r[5])<75?"low":"high"}`}>{r[5]}</span></td><td><span className={`status-pill ${r[6]==="Accepted"?"approved":"warning"}`}>{state.mapped===100?"Accepted":r[6]}</span></td></tr>)}</tbody></table></div></>}
    {tab==="Reconciliation" && <><div className="section-title"><div><h2>Reconciliation & adjustments</h2><p>Resolve differences between the Trial Balance and GL-derived balances.</p></div><button className="secondary-btn" onClick={()=>update({},"Adjustment log downloaded as reconciliation-adjustments.csv")}><Download/>Adjustment log</button></div><div className="table-card"><table><thead><tr><th>Account</th><th>TB balance</th><th>GL balance</th><th>Variance</th><th>Status</th><th>Owner</th><th>Action</th></tr></thead><tbody>{reconRows.map(r=><tr key={r.account}><td><strong>{r.account}</strong><span>Rationale and evidence attached</span></td><td>{r.tb}</td><td>{r.gl}</td><td className="variance">{r.variance}</td><td><span className={`status-pill ${statusClass(r.status)}`}>{r.status}</span></td><td>{r.owner}</td><td><button className="icon-btn" title="Cycle status: Accept → Investigate → Resolve" onClick={()=>cycleRecon(r.account)}><MoreHorizontal/></button></td></tr>)}</tbody></table></div><button className="primary-btn" onClick={postAdjustment}><Plus/>Post proposed adjustment</button></>}
  </div>;
}

function EntityControls({ state, update }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const [section,setSection]=useState("Understanding the entity"); const [created,setCreated]=useState(false); const [collabOpen,setCollabOpen]=useState(false);
  const sections=["Understanding the entity","Internal control","Business process mapping","Fraud & JE risk","Estimates","Related parties"];
  return <div className="content-pad"><button className={`collaboration-summary ${collabOpen?"open":""}`} onClick={()=>setCollabOpen(!collabOpen)}><span className="summary-icon"><Users/></span><span><strong>Client forms & collaboration</strong><small>Understanding the Entity questionnaire · {state.questionnaireStatus}</small></span><span className={`status-pill ${statusClass(state.questionnaireStatus)}`}>{state.questionnaireStatus}</span>{collabOpen?<ChevronDown/>:<ChevronRight/>}</button>{collabOpen&&<QuestionnaireWorkspace state={state} update={update}/>}<div className="entity-layout"><aside className="entity-nav">{sections.map((s,i)=><button className={section===s?"active":""} onClick={()=>setSection(s)} key={s}><span>{i<3?<CheckCircle2/>:<Circle/>}</span><div><strong>{s}</strong><small>{i<3?"Validated":"In progress"}</small></div><ChevronRight/></button>)}</aside><div className="entity-content">
    <div className="section-title"><div><p className="eyebrow">Guided planning workspace</p><h2>{section}</h2><p>Structured conclusions remain traceable to source evidence and reviewer comments.</p></div><button className="secondary-btn" onClick={()=>{setCreated(true);update({},"Risk draft created from this planning answer")}}><AlertTriangle/>Create risk</button></div>
    {created && <Banner tone="success" title="Risk draft created" text="“Revenue concentration and conditional funding” is ready for assessment in the risk register."/>}
    {section==="Understanding the entity" && <><Question number="01" title="Describe the organization’s business model and primary revenue streams." tag="Validated"><textarea defaultValue="The organization provides youth development, family counseling and community support programs. Revenue is primarily derived from government contracts, restricted grants, program fees and public contributions."/><Evidence update={update}/><AiDraft/></Question><Question number="02" title="What significant contracts or unusual transactions occurred during the period?" tag="Needs validation"><textarea defaultValue="A new three-year city grant began in Q4 with performance conditions tied to participant outcomes and community outreach milestones."/><Evidence file="2025 Grant Agreement.pdf" pages="1–6" update={update}/></Question></>}
    {section==="Internal control" && <><Question number="01" title="Document the financial close and reporting process." tag="Validated"><textarea defaultValue="The Controller performs monthly closes within 12 business days. Bank reconciliations are prepared by the Staff Accountant and reviewed electronically by the Controller."/><Evidence pages="12–15" update={update}/></Question><div className="control-grid"><ControlCard title="Cash receipts" reliance="Rely" risk="Moderate" update={update}/><ControlCard title="Payroll" reliance="Rely" risk="Moderate" update={update}/><ControlCard title="Financial close" reliance="No reliance" risk="High" update={update}/></div></>}
    {section==="Business process mapping" && <><div className="process-map"><ProcessNode icon={<MailIcon/>} title="Donation received" detail="Online, check or stock"/><ArrowRight/><ProcessNode icon={<Database/>} title="Recorded in donor system" detail="Daily integration"/><ArrowRight/><ProcessNode icon={<FileSpreadsheet/>} title="Posted to QuickBooks" detail="Batch journal"/><ArrowRight/><ProcessNode icon={<ClipboardCheck/>} title="Monthly reconciliation" detail="Controller review"/></div><Banner tone="warning" title="One control gap identified" text="Manual journal entries from the donor system are not independently reviewed below the posting threshold."/></>}
    {section==="Fraud & JE risk" && <><div className="risk-factor-grid"><RiskFactor title="Incentives / pressures" level="Moderate" text="Grant renewal targets and fundraising commitments."/><RiskFactor title="Opportunities" level="High" text="Manual journals can be posted by the Controller."/><RiskFactor title="Attitudes / rationalization" level="Low" text="No indicators identified through interviews."/></div><CheckRow title="Management override is presumed fraud risk" detail="Significant risk linked to the JE testing program" checked/><CheckRow title="Revenue recognition fraud risk" detail="Revenue cutoff risk linked to contribution testing" checked/></>}
    {section==="Estimates" && <div className="table-card"><table><thead><tr><th>Estimate</th><th>Method</th><th>Uncertainty</th><th>Management bias</th><th>Risk</th></tr></thead><tbody><tr><td><strong>Allowance for pledges</strong></td><td>Aging and historical collection</td><td>Moderate</td><td>Low</td><td><span className="status-pill warning">Moderate</span></td></tr><tr><td><strong>Useful lives</strong></td><td>Straight-line policy</td><td>Low</td><td>Low</td><td><span className="status-pill approved">Low</span></td></tr></tbody></table></div>}
    {section==="Related parties" && <><Question number="01" title="Identify related parties and the nature of each relationship." tag="Validated"><textarea defaultValue="Board member Dana Liu owns Riverside Learning Supply. Purchases totaled $90,000 and were approved under the conflict-of-interest policy."/><Evidence file="Related Parties 2025.xlsx" pages="1" update={update}/></Question><Banner tone="warning" title="Disclosure risk linked" text="Completeness of related-party disclosures is assessed as Moderate / Moderate."/></>}
    <StickyActions update={update} onComplete={()=>update({questionnaireStatus:"Validated"},"Entity & Controls marked complete — all areas validated")} completed={state.questionnaireStatus==="Validated"}/></div></div></div>;
}

const TB_SOURCE_WEIGHTS = [
  { account: "4010 · Individual contributions", pct: 0.34 },
  { account: "4020 · Restricted grant receipts", pct: 0.29 },
  { account: "4200 · Program service fees", pct: 0.22 },
  { account: "4500 · Investment & other income", pct: 0.08 },
  { account: "4015 · Adoption fee income", pct: 0.05 },
  { account: "4998 · Special events revenue", pct: 0.02 },
];
function TbSourcesModal({ state, onClose }: { state: DemoState; onClose: () => void }) {
  const rows = TB_SOURCE_WEIGHTS.map(w => ({ ...w, amount: state.benchmark * w.pct }));
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>Trial Balance sources</h2><p>The {rows.length} accounts that sum to the {money(state.benchmark)} Total Revenue benchmark.</p></div><button className="icon-btn" onClick={onClose}><X/></button></div>
    <div className="table-card"><table><thead><tr><th>Account</th><th>Balance</th><th>% of benchmark</th></tr></thead><tbody>{rows.map(r => <tr key={r.account}><td><strong>{r.account}</strong></td><td>{money(r.amount)}</td><td>{(r.pct * 100).toFixed(0)}%</td></tr>)}</tbody></table></div>
    <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 12 }}>Total: {money(total)} · Source: mapped & reconciled Trial Balance, FY 2025</p>
    <div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Close</button></div>
  </div></div>;
}
function Materiality({ state, update, embedded=false, onComplete, onBack }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void; embedded?:boolean; onComplete?:()=>void; onBack?:()=>void }) {
  const [benchmarkBasis,setBenchmarkBasis]=useState("Current year"); const [specificOpen,setSpecificOpen]=useState(false); const [tbSourcesOpen,setTbSourcesOpen]=useState(false); const benchmarkType=state.materialityBenchmarkType; const override=state.materialityOverride; const rationale=state.materialityRationale;
  const calculated=state.benchmark*(state.materialityPct/100); const overall=override?240000:calculated; const performance=overall*(state.performancePct/100); const trivial=overall*(state.trivialPct/100);
  const chartData=[{name:"Prior",value:9100000},{name:"Preliminary",value:state.benchmark},{name:"Final",value:state.finalTb?9840000:0}];
  return <div className={`${embedded?"materiality-ingest":"content-pad"} materiality-page`}>
    {state.finalTb && <Banner tone="warning" title="A changed Final Trial Balance was ingested" text="Materiality must be explicitly re-performed and published as a new version. Downstream workpapers will not update silently."/>}
    {state.rolledForward && <Banner tone="warning" title="Prior-year benchmark choice carried forward — confirmation required" text="Only the benchmark methodology was copied. Prior-year dollar values are shown for comparison and are not current-year conclusions." action="Confirm benchmark" onAction={()=>update({},"Current-year benchmark actively confirmed")}/>} 
    <div className="standards-note"><ShieldCheck/><div><strong>Audit-standard context, at the point of judgment</strong><span>Materiality considers both amount and nature. Percentage ranges below are firm methodology—not statutory safe harbors—and require engagement-specific rationale.</span></div><a href="https://pcaobus.org/oversight/standards/auditing-standards/details/AS2105" target="_blank" rel="noreferrer">PCAOB AS 2105 <ArrowRight/></a></div>
    <section className="materiality-guide-grid">
      <article className="materiality-card benchmark-card"><MaterialityCardTitle title="Benchmark" help="The financial statement element used as the base for calculating materiality. Select the measure and period most relevant to the entity’s size, industry and users’ focus." standard="PCAOB AS 2105 · ISA 320"/><div className="benchmark-fields"><Field label="Benchmark measure" required><select value={benchmarkType} onChange={e=>update({materialityBenchmarkType:e.target.value,...(state.materialityLocked?{materialityLocked:false}:{})},state.materialityLocked?"Benchmark changed — Materiality conclusion reopened for reconfirmation":undefined)}><option>Total Revenue</option><option>Total Assets</option><option>Net Income Before Tax</option><option>Total Equity</option><option>Total Expenses</option><option>Custom benchmark</option></select><span className="recommendation"><Sparkles/>Recommended for nonprofit entities</span></Field><div className="field"><span>Benchmark basis <em>*</em></span><div className="segmented-options">{["Current year","Prior year","3-year average"].map(x=><button key={x} className={benchmarkBasis===x?"active":""} onClick={()=>setBenchmarkBasis(x)}>{x}</button>)}</div></div><Field label="Source data"><div className="read-only-source"><Database/>Mapped & reconciled Trial Balance</div></Field><Field label="Benchmark amount" required><div className="read-only-amount">{money(state.benchmark)}<button className="text-link" onClick={()=>setTbSourcesOpen(true)}><Link2/>6 accounts</button></div></Field></div><Field label="Benchmark rationale" required><textarea defaultValue="Total revenue reflects the scale of this nonprofit and the focus of donors, grantors and the Board. Current-year activity is stable and representative."/></Field></article>
      <article className="materiality-card specific-card"><MaterialityCardTitle title="Specific materialities" help="A lower materiality may be set for particular transaction classes, balances or disclosures where smaller misstatements could reasonably influence users, such as related parties or key management remuneration." standard="ISA 320 · engagement judgment"/>{specificOpen?<div className="specific-form"><Field label="Area"><input defaultValue="Related-party disclosures"/></Field><Field label="Amount"><input defaultValue="$90,000"/></Field><button className="primary-btn" onClick={()=>setSpecificOpen(false)}>Save specific materiality</button></div>:<div className="empty-specific"><ShieldCheck/><strong>No specific materialities set</strong><span>Add one only when a lower threshold is justified by user sensitivity or qualitative factors.</span><button className="secondary-btn" onClick={()=>setSpecificOpen(true)}><Plus/>Add specific materiality</button></div>}</article>
      <article className="materiality-card calculation-card"><MaterialityCardTitle title="Overall materiality" help="The level for the financial statements as a whole. Misstatements may be material because of their amount, nature or circumstances; the percentage is an input to professional judgment, not the conclusion itself." standard="PCAOB AS 2105 · ISA 320"/><div className="big-value">{money(overall)}</div><Field label="Benchmark percentage"><div className="suffix-input"><input type="number" step="0.1" min="0.1" value={state.materialityPct} onChange={e=>update({materialityPct:Number(e.target.value),...(state.materialityLocked?{materialityLocked:false}:{})},state.materialityLocked?"Benchmark percentage changed — Materiality conclusion reopened for reconfirmation":undefined)}/><span>%</span></div></Field><span className="method-range">Firm guidance: 0.5%–1.5% for revenue; document exceptions</span><label className="checkbox-row"><input type="checkbox" checked={override} onChange={e=>update({materialityOverride:e.target.checked})}/><span>Round down to {money(240000)}</span></label>{override&&<Field label="Mandatory override rationale" required><textarea value={rationale} onChange={e=>update({materialityRationale:e.target.value})} placeholder="Explain the audit judgment…"/></Field>}</article>
      <article className="materiality-card calculation-card"><MaterialityCardTitle title="Performance materiality" help="An amount set below overall materiality to reduce the probability that aggregate uncorrected and undetected misstatements exceed overall materiality." standard="ISA 320 · firm methodology"/><div className="big-value">{money(performance)}</div><div className="slider-control"><input aria-label="Performance materiality percentage" type="range" min="40" max="90" value={state.performancePct} onChange={e=>update({performancePct:Number(e.target.value)})}/><strong>{state.performancePct}%</strong></div><span className="method-range">Illustrative firm range: 50%–75%; lower percentages generally reflect higher aggregation or engagement risk.</span></article>
      <article className="materiality-card calculation-card"><MaterialityCardTitle title="Clearly trivial threshold" help="An amount below which misstatements need not be accumulated only when they are clearly inconsequential, individually and in aggregate. ‘Clearly trivial’ is not another expression for ‘not material.’" standard="PCAOB AS 2810.10–.11 · ISA 450"/><div className="big-value">{money(trivial)}</div><div className="slider-control"><input aria-label="Clearly trivial percentage" type="range" min="1" max="5" value={state.trivialPct} onChange={e=>update({trivialPct:Number(e.target.value)})}/><strong>{state.trivialPct}%</strong></div><span className="method-range">Firm cap: up to 5% of overall materiality. If there is uncertainty, accumulate the misstatement.</span></article>
    </section>
    <div className="materiality-support"><div className="chart-card"><div className="section-title"><div><h3>Benchmark trend</h3><p>Preliminary, final and prior-period data</p></div><button className="text-link" onClick={()=>setTbSourcesOpen(true)}><Link2/>View TB sources</button></div><ResponsiveContainer width="100%" height={190}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" axisLine={false}/><YAxis tickFormatter={v=>`$${v/1000000}m`} axisLine={false}/><Tooltip formatter={(v)=>money(Number(v))}/><Bar dataKey="value" radius={[8,8,0,0]} fill="#6d55dc"/></BarChart></ResponsiveContainer></div><div className="section-card judgment-card"><h3>Required judgment</h3><p>Who uses the financial statements, and what could influence their decisions?</p><textarea defaultValue="Donors, grantors and the Board assess stewardship, program efficiency, liquidity and compliance with donor restrictions."/><CheckRow title="Qualitative factors considered" detail="Restrictions, related parties, compliance and sensitive disclosures" checked/><CheckRow title="Final TB change will trigger reassessment" detail="Materiality and downstream scopes become stale until reviewed" checked={state.finalTb}/></div></div>
    {state.groupAudit && <FormSection update={update} title="Component materiality" subtitle="Allocate materiality for this group audit."><div className="table-card"><table><thead><tr><th>Component</th><th>Allocation</th><th>Performance</th><th>Scope</th></tr></thead><tbody><tr><td>Brooklyn Youth Center</td><td>$132,000</td><td>$99,000</td><td>Full scope</td></tr><tr><td>Queens Family Services Program</td><td>$84,000</td><td>$63,000</td><td>Specified procedures</td></tr></tbody></table></div></FormSection>}
    {state.materialityLocked && <Banner tone="success" title="Materiality conclusion locked" text="Overall, Performance and Clearly Trivial materiality are locked for reference by Risk Assessment and Publish. Changing any input above will reopen this conclusion."/>}
    <div className={embedded?"materiality-handoff-actions":"sticky-action-bar"}><span>{state.materialityLocked?<><LockKeyhole size={16}/>Materiality locked</>:<><CheckCircle2/>All materiality validations pass</>}</span>{embedded&&<button className="secondary-btn" onClick={onBack}><ChevronLeft/>Back</button>}<button className="secondary-btn" onClick={()=>update({},"Materiality draft saved in Data Ingest")}>Save draft</button><button className="primary-btn" disabled={(override&&!rationale)} onClick={()=>onComplete?onComplete():update({materialityLocked:true},"Materiality conclusion completed and locked — downstream steps refreshed")}>{embedded?"Complete ingest & open Workpapers":state.materialityLocked?<><Check size={16}/>Completed</>:"Complete materiality"}</button></div>
    {tbSourcesOpen && <TbSourcesModal state={state} onClose={()=>setTbSourcesOpen(false)}/>}
  </div>;
}

function RisksView({ state, update, navigate }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void; navigate:(p:string)=>void }) {
  const [cell,setCell]=useState<string|null>(null); const [selected,setSelected]=useState<any>(null); const [query,setQuery]=useState("");
  const [filterOpen,setFilterOpen]=useState(false); const [sigOnly,setSigOnly]=useState(false); const [fraudOnly,setFraudOnly]=useState(false);
  const filterRef=useDismiss(filterOpen,()=>setFilterOpen(false));
  const [addOpen,setAddOpen]=useState(false); const [newTitle,setNewTitle]=useState(""); const [newFsa,setNewFsa]=useState(""); const [newLikelihood,setNewLikelihood]=useState("Moderate"); const [newMagnitude,setNewMagnitude]=useState("Moderate");
  const riskList=allRisks(state);
  const filtered=riskList.filter(r=>(!cell||`${r.likelihood}-${r.magnitude}`===cell)&&(`${r.title} ${r.fsa}`.toLowerCase().includes(query.toLowerCase()))&&(!sigOnly||r.significant)&&(!fraudOnly||r.fraud));
  const cells=["High-High","Moderate-High","Low-High","High-Moderate","Moderate-Moderate","Low-Moderate","High-Low","Moderate-Low","Low-Low"];
  const counts=Object.fromEntries(cells.map(c=>[c,riskList.filter(r=>`${r.likelihood}-${r.magnitude}`===c).length]));
  const highCount=riskList.filter(r=>r.level==="High").length; const moderateCount=riskList.filter(r=>r.level==="Moderate").length; const lowCount=riskList.filter(r=>r.level==="Low").length;
  const coveredCount=riskList.filter(r=>!r.response.includes("Needs")).length; const coveragePct=riskList.length?Math.round(coveredCount/riskList.length*100):100;
  const activeFilterCount=(sigOnly?1:0)+(fraudOnly?1:0);
  const addRisk=()=>{
    const risk:RiskItem={id:1000+riskList.length,title:newTitle.trim(),fsa:newFsa.trim()||"Unassigned",assertion:"To be determined",likelihood:newLikelihood,magnitude:newMagnitude,level:newLikelihood==="High"&&newMagnitude==="High"?"High":newLikelihood==="Low"&&newMagnitude==="Low"?"Low":"Moderate",significant:false,fraud:false,balance:"N/A",driver:"Auditor-added risk",response:"Needs response"};
    update({customRisks:[...state.customRisks,risk]},`Risk "${risk.title}" added to the register`);
    setAddOpen(false);setNewTitle("");setNewFsa("");setNewLikelihood("Moderate");setNewMagnitude("Moderate");
  };
  return <div className="content-pad risks-page"><div className="risk-summary"><div><strong>{riskList.length}</strong><span>Assessed risks</span></div><div className="high"><strong>{highCount}</strong><span>High</span></div><div className="moderate"><strong>{moderateCount}</strong><span>Moderate</span></div><div className="low"><strong>{lowCount}</strong><span>Low</span></div><div><strong>{coveragePct}%</strong><span>Response coverage</span></div><button className="primary-btn" onClick={()=>setAddOpen(true)}><Plus/>Add risk</button></div>
    <FluxAnalytics state={state} update={update} navigate={navigate}/>
    <div className="risk-top-grid"><div className="heatmap-card"><div className="section-title"><div><h3>Inherent risk heat map</h3><p>Click a cell to filter the register.</p></div>{cell&&<button className="text-link" onClick={()=>setCell(null)}>Clear filter</button>}</div><div className="heatmap"><span className="axis y">Magnitude</span><div className="axis-labels y-labels"><span>High</span><span>Moderate</span><span>Low</span></div><div className="heat-grid">{cells.map(c=><button key={c} className={`${heatClass(c)} ${cell===c?"selected":""}`} onClick={()=>setCell(cell===c?null:c)}><strong>{counts[c]}</strong><span>{c.replace("-"," / ")}</span></button>)}</div><div className="axis-labels x-labels"><span>High</span><span>Moderate</span><span>Low</span></div><span className="axis x">Likelihood</span></div></div>
      <div className="risk-insights"><div className="section-title"><div><h3>Analytics-driven indicators</h3><p>Signals from GL analytics and planning evidence.</p></div><Sparkles/></div><Insight tone="danger" title="14 late-posted revenue entries" text="$386,200 posted in the first 5 days after period end."/><Insight tone="warning" title="3 unusual weekend journals" text="Posted by privileged users without approval evidence."/><Insight tone="info" title="Contribution concentration increased" text="Top five donors represent 41% of annual contributions."/></div></div>
    <div className="section-title"><div><h2>Risk register</h2><p>All non-zero FSAs have a documented risk conclusion.</p></div><div className="table-tools"><div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search risks"/></div><div className="topbar-popover" ref={filterRef}><button className={`filter-btn ${activeFilterCount>0?"active":""}`} onClick={()=>setFilterOpen(!filterOpen)}><Filter/>Filters{activeFilterCount>0&&<i className="filter-badge"/>}</button>{filterOpen&&<div className="dropdown-menu filter-menu">
        <div className="dropdown-head"><strong>Filter register</strong></div>
        <label className="dropdown-check"><input type="checkbox" checked={sigOnly} onChange={e=>setSigOnly(e.target.checked)}/><span>Significant only</span></label>
        <label className="dropdown-check"><input type="checkbox" checked={fraudOnly} onChange={e=>setFraudOnly(e.target.checked)}/><span>Fraud only</span></label>
        {activeFilterCount>0&&<button className="dropdown-item" onClick={()=>{setSigOnly(false);setFraudOnly(false)}}><X size={14}/><span>Clear filters</span></button>}
      </div>}</div></div></div>
    <div className="table-card risk-table"><table><thead><tr><th>Risk</th><th>FSA / assertion</th><th>Inherent risk</th><th>Flags</th><th>Driven by</th><th>Planned response</th><th></th></tr></thead><tbody>
      {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:"center",color:"var(--muted)"}}>No risks match the current search and filters.</td></tr>}
      {filtered.map(r=><tr key={r.id} onClick={()=>setSelected(r)}><td><strong>{r.title}</strong><span>{r.balance} current balance</span></td><td>{r.fsa}<span>{r.assertion}</span></td><td><span className={`risk-badge ${r.level.toLowerCase()}`}>{r.likelihood} / {r.magnitude}</span></td><td><div className="flag-list">{r.significant&&<span>Significant</span>}{r.fraud&&<span>Fraud</span>}</div></td><td><button className="driver-link" onClick={e=>{e.stopPropagation();navigate("/engagement/bbawc/planning/entity-controls")}}><Link2/>{r.driver}</button></td><td><span className={r.response.includes("Needs")?"text-danger":"text-success"}>{r.response}</span></td><td><ChevronRight/></td></tr>)}
    </tbody></table></div>
    {selected&&<div className="detail-drawer"><div className="drawer-head"><div><span className="status-pill danger">{selected.level} inherent risk</span><h2>{selected.title}</h2><p>{selected.fsa} · {selected.assertion}</p></div><button className="icon-btn" onClick={()=>setSelected(null)}><X/></button></div><div className="drawer-body"><InfoBlock label="Description" text="Risk that transactions near period end are recorded in an incorrect reporting period, affecting contribution revenue and related receivables."/><div className="two-col"><InfoBlock label="Likelihood" text={selected.likelihood}/><InfoBlock label="Magnitude" text={selected.magnitude}/></div><InfoBlock label="Inherent-risk factors" text="Change · Complexity · Susceptibility to management bias or fraud"/><InfoBlock label="Driven by" text={selected.driver}/><InfoBlock label="Linked control" text="Monthly restricted revenue reconciliation — design effective"/><InfoBlock label="Rationale" text="Q4 grant activity and conditional contribution terms increase the risk of premature recognition around year end."/></div><div className="drawer-actions"><button className="secondary-btn" onClick={()=>update({},`Opening evidence linked to "${selected.driver}"`)}>Open source evidence</button><button className="primary-btn" onClick={()=>{setSelected(null);navigate("/engagement/bbawc/planning/responses")}}>Create response</button></div></div>}
    {addOpen&&<div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><h2>Add risk</h2><p>Manually add a risk to the register for this engagement.</p></div><button className="icon-btn" onClick={()=>setAddOpen(false)}><X/></button></div>
      <Field label="Risk title" required><input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. Deferred revenue cutoff"/></Field>
      <Field label="Financial statement area" required><input value={newFsa} onChange={e=>setNewFsa(e.target.value)} placeholder="e.g. Deferred revenue"/></Field>
      <div className="form-grid"><Field label="Likelihood"><select value={newLikelihood} onChange={e=>setNewLikelihood(e.target.value)}><option>High</option><option>Moderate</option><option>Low</option></select></Field><Field label="Magnitude"><select value={newMagnitude} onChange={e=>setNewMagnitude(e.target.value)}><option>High</option><option>Moderate</option><option>Low</option></select></Field></div>
      <div className="modal-actions"><button className="secondary-btn" onClick={()=>setAddOpen(false)}>Cancel</button><button className="primary-btn" disabled={!newTitle.trim()||!newFsa.trim()} onClick={addRisk}>Add to register</button></div>
    </div></div>}
  </div>;
}

const SEEDED_PROCEDURES: ProcedureItem[] = [
  { title: "Test contribution cutoff around year end", risk: "Revenue cutoff", type: "Substantive", assignee: "J. Alvarez", due: "Mar 12", status: "Planned" },
  { title: "Inspect restricted grant terms and performance conditions", risk: "Revenue cutoff", type: "Substantive", assignee: "J. Alvarez", due: "Mar 13", status: "Planned" },
  { title: "Test journal entries using fraud-risk criteria", risk: "Management override", type: "Substantive", assignee: "M. Kapoor", due: "Mar 15", status: "Draft" },
  { title: "Evaluate allowance methodology and subsequent receipts", risk: "Allowance for pledges", type: "Substantive", assignee: "J. Alvarez", due: "Mar 18", status: "Planned" },
];
function ResponsesView({ state, update }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const gap=state.responseGap;
  const procedures=[...SEEDED_PROCEDURES,...state.customProcedures];
  const [selected,setSelected]=useState<ProcedureItem|null>(null);
  const [workloadOpen,setWorkloadOpen]=useState(false);
  const [addOpen,setAddOpen]=useState(false); const [title,setTitle]=useState(""); const [assertion,setAssertion]=useState(""); const [nature,setNature]=useState("Substantive"); const [assignee,setAssignee]=useState("J. Alvarez");
  const workload=Object.entries(procedures.reduce((acc:Record<string,number>,p)=>{acc[p.assignee]=(acc[p.assignee]||0)+1;return acc},{}));
  const addProcedure=()=>{
    const proc:ProcedureItem={title:title.trim(),risk:assertion.trim()||"Unassigned",type:nature,assignee,due:"TBD",status:"Draft"};
    update({customProcedures:[...state.customProcedures,proc]},`Procedure "${proc.title}" added to the audit response plan`);
    setAddOpen(false);setTitle("");setAssertion("");setNature("Substantive");setAssignee("J. Alvarez");
  };
  return <div className="content-pad"><RiskResponseQc gap={gap}/>{gap?<Banner tone="danger" title="One significant risk has no responsive procedure" text="Conditional contribution recognition must be covered before Planning can be submitted." action="Accept suggested procedure" onAction={()=>update({responseGap:false},"Suggested procedure added; all significant risks now covered")}/>:<Banner tone="success" title="All significant risks have responsive procedures" text="Risk and assertion coverage validation is complete."/>}
    <div className="response-stats"><Metric label="Risk coverage" value={gap?"91%":"100%"} detail={`${gap?1:0} significant risk gap`}/><Metric label="Planned procedures" value={String(procedures.length)} detail="12 substantive · 6 controls"/><Metric label="Team capacity" value="82%" detail="54 hours available"/><Metric label="Fieldwork start" value="Mar 9" detail="Planning approval required"/></div>
    <div className="section-title"><div><h2>Risk-to-program linkage</h2><p>Every procedure is tied to a risk, assertion, owner and expected evidence.</p></div><button className="primary-btn" onClick={()=>setAddOpen(true)}><Plus/>Add procedure</button></div>
    <div className="table-card"><table><thead><tr><th>Procedure</th><th>Relevant risk</th><th>Type</th><th>Assignee</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>{procedures.map((r,i)=><tr key={i} onClick={()=>setSelected(r)} style={{cursor:"pointer"}}><td><strong>{r.title}</strong><span>Nature, timing and extent documented</span></td><td><Link2 size={14}/>{r.risk}</td><td>{r.type}</td><td>{r.assignee}</td><td>{r.due}</td><td><span className="status-pill progress">{r.status}</span></td><td><button className="icon-btn" onClick={e=>{e.stopPropagation();setSelected(r)}}><ChevronRight/></button></td></tr>)}</tbody></table></div>
    <div className="section-card"><div className="section-title"><div><h2>Workplan timeline</h2><p>Automatic proposed Fieldwork program based on risk coverage.</p></div><button className="secondary-btn" onClick={()=>setWorkloadOpen(!workloadOpen)}><Users/>Team workload</button></div>
      {workloadOpen && <div className="workload-panel">{workload.map(([name,count])=><div key={name}><span>{name}</span><i style={{width:`${Math.min(count/procedures.length*100,100)}%`}}/><strong>{count} procedure{count===1?"":"s"}</strong></div>)}</div>}
      <div className="workplan"><div className="date-head"><span>Mar 9</span><span>Mar 16</span><span>Mar 23</span><span>Mar 30</span></div><TimelineBar label="Cash & revenue" start="4%" width="36%" color="#6b58dc"/><TimelineBar label="Expenses & payroll" start="20%" width="40%" color="#2f85d1"/><TimelineBar label="Estimates & disclosures" start="48%" width="30%" color="#d49a28"/><TimelineBar label="Completion" start="78%" width="18%" color="#2aa66f"/></div></div>
    {selected && <div className="detail-drawer"><div className="drawer-head"><div><span className="status-pill progress">{selected.status}</span><h2>{selected.title}</h2><p>{selected.type} · {selected.assignee}</p></div><button className="icon-btn" onClick={()=>setSelected(null)}><X/></button></div><div className="drawer-body"><InfoBlock label="Relevant risk" text={selected.risk}/><div className="two-col"><InfoBlock label="Assignee" text={selected.assignee}/><InfoBlock label="Due" text={selected.due}/></div><InfoBlock label="Nature, timing and extent" text="Documented per firm methodology; evidence and workpaper references are attached during Fieldwork."/></div></div>}
    {addOpen && <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><h2>Add procedure</h2><p>Link a new procedure into the audit response plan.</p></div><button className="icon-btn" onClick={()=>setAddOpen(false)}><X/></button></div>
      <Field label="Procedure title" required><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Confirm year-end investment balances"/></Field>
      <Field label="Relevant risk / assertion" required><input value={assertion} onChange={e=>setAssertion(e.target.value)} placeholder="e.g. Investment valuation"/></Field>
      <div className="form-grid"><Field label="Nature"><select value={nature} onChange={e=>setNature(e.target.value)}><option>Substantive</option><option>Controls</option><option>Analytical</option></select></Field><Field label="Assigned to"><select value={assignee} onChange={e=>setAssignee(e.target.value)}><option>J. Alvarez</option><option>M. Kapoor</option><option>Oscar Owner</option></select></Field></div>
      <div className="modal-actions"><button className="secondary-btn" onClick={()=>setAddOpen(false)}>Cancel</button><button className="primary-btn" disabled={!title.trim()||!assertion.trim()} onClick={addProcedure}>Add procedure</button></div>
    </div></div>}
  </div>;
}

function PublishPreviewModal({ title, state, onClose }: { title:string; state:DemoState; onClose:()=>void }) {
  const overall=state.materialityOverride?240000:state.benchmark*(state.materialityPct/100);
  const performance=overall*(state.performancePct/100); const trivial=overall*(state.trivialPct/100);
  const riskList=allRisks(state);
  const cells=["High-High","Moderate-High","Low-High","High-Moderate","Moderate-Moderate","Low-Moderate","High-Low","Moderate-Low","Low-Low"];
  const counts=Object.fromEntries(cells.map(c=>[c,riskList.filter(r=>`${r.likelihood}-${r.magnitude}`===c).length]));
  const coveredCount=riskList.filter(r=>!r.response.includes("Needs")).length;
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>{title}</h2><p>Browser-ready preview, generated from current Planning data</p></div><button className="icon-btn" onClick={onClose}><X/></button></div>
    {title==="Planning memo" && <div className="preview-body">
      <InfoBlock label="Entity" text={`${engagement.clientName} · ${engagement.displayType} · Period ended ${engagement.periodEnd}`}/>
      <InfoBlock label="Acceptance & continuance" text={state.acceptanceDecision==="decline"?"Declined":state.acceptanceDecision==="safeguards"?"Accepted with safeguards":"Accepted"}/>
      <InfoBlock label="Planning status" text={state.locked?"Approved & locked":state.planningStatus}/>
      <InfoBlock label="Overall materiality" text={money(overall)}/>
      <InfoBlock label="Risks assessed" text={`${riskList.length} risks · ${riskList.filter(r=>r.level==="High").length} high`}/>
      <InfoBlock label="Response coverage" text={`${coveredCount} of ${riskList.length} risks covered`}/>
    </div>}
    {title==="Materiality summary" && <div className="preview-body">
      <InfoBlock label="Benchmark" text={`${state.materialityBenchmarkType} · ${money(state.benchmark)} (${state.materialityPct}%)`}/>
      <div className="two-col"><InfoBlock label="Overall materiality" text={money(overall)}/><InfoBlock label="Performance materiality" text={money(performance)}/></div>
      <InfoBlock label="Clearly trivial threshold" text={money(trivial)}/>
      <InfoBlock label="Status" text={state.materialityLocked?"Locked":"Draft"}/>
    </div>}
    {title==="Risk heat map" && <div className="heat-grid" style={{marginTop:6}}>{cells.map(c=><div key={c} className={heatClass(c)} style={{padding:"12px 6px",borderRadius:9,textAlign:"center"}}><strong style={{fontSize:20}}>{counts[c]}</strong><div style={{fontSize:9,opacity:.75,marginTop:3}}>{c.replace("-"," / ")}</div></div>)}</div>}
    {title==="Adjustments & overrides" && <div className="preview-body">
      <InfoBlock label="Materiality override" text={state.materialityOverride?`Applied — rounded down to ${money(240000)}`:"Not applied"}/>
      <InfoBlock label="Final Trial Balance reingested" text={state.finalTb?"Yes — reassessment required before publish":"No"}/>
      <InfoBlock label="Data issue flagged for investigation" text={state.flaggedForReview?"Yes — pending resolution":"None outstanding"}/>
    </div>}
    {title==="Reconciliation issues" && <div className="table-card" style={{marginTop:2}}><table><thead><tr><th>Account</th><th>Variance</th><th>Status</th><th>Owner</th></tr></thead><tbody>{state.reconciliationRows.map(r=><tr key={r.account}><td><strong>{r.account}</strong></td><td className="variance">{r.variance}</td><td><span className={`status-pill ${statusClass(r.status)}`}>{r.status}</span></td><td>{r.owner}</td></tr>)}</tbody></table></div>}
    {title==="Audit strategy" && <div className="preview-body">
      <InfoBlock label="Strategy" text="Risk-based audit focused on contributions, revenue cutoff, management override and related-party disclosures. Controls reliance planned for cash receipts and payroll."/>
      <InfoBlock label="Planned hours" text="386 hours · Preparer 248 · Manager 96 · Partner 32 · Specialist 10"/>
    </div>}
    {title==="Audit response plan" && <div className="preview-body">
      <InfoBlock label="Response coverage" text={state.responseGap?"91% — 1 significant risk gap remains":"100% — all significant risks covered"}/>
      <InfoBlock label="Fieldwork start" text="Mar 9, 2026 (pending Planning approval)"/>
    </div>}
    <div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Close</button></div>
  </div></div>;
}
function PublishView({ state, update, navigate }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void; navigate:(p:string)=>void }) {
  const [preview,setPreview]=useState<string|null>(null);
  const vars=[["@OverallMateriality","$240,000","Materiality"],["@PerformanceMateriality","$180,000","Materiality"],["@ClearlyTrivialThreshold","$12,000","Materiality"],["@Risk.RevenueCutoff","High / High","Risk register"],["@Risk.ManagementOverride","High / High","Risk register"]];
  const blockers=[state.acceptanceDecision==="decline"&&"Engagement was declined during Acceptance & continuance",state.acceptanceDecision==="safeguards"&&!state.acceptanceSafeguardsNote.trim()&&"Safeguards rationale required for Accept with safeguards decision",state.controlTotals==="Fail"&&"Control totals do not balance",state.responseGap&&"One significant risk has no responsive procedure"].filter(Boolean) as string[];
  const validationsPass=8-blockers.length; const submitBlocked=blockers.length>0;
  return <div className="content-pad"><div className="publish-header"><div><p className="eyebrow">Publish preview</p><h2>Engagement Variables</h2><p>Version {state.publishVersion} · Effective Dec 31, 2025 · Draft</p></div><button className="primary-btn" onClick={()=>update({publishVersion:state.publishVersion+1},`Engagement Variables published as version ${state.publishVersion+1}`)}><Zap/>Publish to engagement</button></div>
    <Banner tone="info" title="Downstream impact is version-controlled" text="Re-publishing never silently overwrites locked or validated workpaper cells. Referencing workpapers are flagged for re-review."/>
    {submitBlocked&&<Banner tone="danger" title="Planning cannot be submitted yet" text={blockers.join(" · ")}/>}
    <div className="table-card"><table><thead><tr><th>Variable</th><th>Value</th><th>Source</th><th>Referenced by</th><th>Status</th></tr></thead><tbody>{vars.map((r,i)=><tr key={r[0]}><td><code>{r[0]}</code></td><td><strong>{r[1]}</strong></td><td>{r[2]}</td><td>{i<3?`${3+i} workpapers`:"Audit program"}</td><td><span className="status-pill approved">Validated</span></td></tr>)}</tbody></table></div>
    <div className="outputs-grid">{[[FileText,"Planning memo"],[Gauge,"Materiality summary"],[BarChart3,"Risk heat map"],[RefreshCw,"Adjustments & overrides"],[ListChecks,"Reconciliation issues"],[BriefcaseBusiness,"Audit strategy"],[ClipboardCheck,"Audit response plan"],[History,"Audit trail"]].map(([Icon,title]:any)=><button key={title} onClick={()=>title==="Audit trail"?navigate("/engagement/bbawc/planning/audit-trail"):setPreview(title)}><Icon/><span><strong>{title}</strong><small>Browser-ready preview</small></span><Download/></button>)}</div>
    <div className="section-card submit-card"><div><ShieldCheck/><span><strong>{submitBlocked?"Not ready for Manager review":"Ready for Manager review"}</strong><small>{validationsPass} of 8 publish validations pass{submitBlocked?` · ${blockers.join(" · ")}`:" · 1 client-request warning does not block submission"}</small></span></div><button className="secondary-btn" onClick={()=>navigate("/engagement/bbawc/planning/review")}>Preview roll-up</button><button className="primary-btn" disabled={submitBlocked} onClick={()=>update({planningStatus:"Pending Manager Approval"},"Planning submitted to Meera Kapoor for Manager review")}>Submit for review <Send/></button></div>
    {preview && <PublishPreviewModal title={preview} state={state} onClose={()=>setPreview(null)}/>}
  </div>;
}

function ReviewView({ state, update }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const declined=state.acceptanceDecision==="decline";
  const [approved,setApproved]=useState<string[]>(state.managerApproved?["Acceptance & independence","Audit strategy & scope","Entity understanding","Internal controls","Materiality","Risk assessment","Audit responses","Adjustments & overrides"]:[]); const [note,setNote]=useState(""); const [reopen,setReopen]=useState(false);
  const materialityOverall=state.materialityOverride?240000:state.benchmark*(state.materialityPct/100);
  const performanceOverall=materialityOverall*(state.performancePct/100);
  const trivialOverall=materialityOverall*(state.trivialPct/100);
  const riskList=allRisks(state); const highRiskCount=riskList.filter(r=>r.level==="High").length; const topRisk=riskList[0]?.title||"—";
  const cards=[
    ["Acceptance & independence", declined?"Engagement declined during Acceptance & continuance":`${state.acceptanceDecision==="safeguards"?"Accepted with safeguards":"Continuance accepted"} · ${state.independenceOutstanding} team confirmation${state.independenceOutstanding===1?"":"s"} outstanding`, declined?"danger":"warning"],
    ["Audit strategy & scope","Standalone financial audit · 386 planned hours","good"],
    ["Entity understanding","Validated narrative · 6 source documents","good"],
    ["Internal controls","2 controls reliance planned · 1 design gap","warning"],
    ["Materiality",`Overall ${money(materialityOverall)} · Performance ${money(performanceOverall)} · Trivial ${money(trivialOverall)}`,"good"],
    ["Risk assessment",`${riskList.length} risks · ${highRiskCount} High · ${topRisk} is top risk`,"good"],
    ["Audit responses",state.responseGap?"91% coverage · 1 significant risk gap":"100% coverage · all significant risks covered",state.responseGap?"danger":"good"],
    ["Adjustments & overrides",`${state.reconciliationRows.length} reconciliation issue${state.reconciliationRows.length===1?"":"s"} tracked · largest variance ${state.reconciliationRows[0]?.variance||"$0"}`,"warning"],
  ];
  const canApprove=state.role==="Manager"||state.role==="Partner"||state.role==="Firm Administrator";
  const approve=(title:string)=>{
    if(declined){update({},"This engagement was declined and cannot be approved");return;}
    if(!canApprove){update({},"Switch to Manager or Partner to approve conclusions");return;}
    setApproved(a=>[...new Set([...a,title])]);update({},`${title} approved at ${state.role} level`)
  };
  const all=approved.length===cards.length;
  return <div className="content-pad review-page"><div className="review-banner"><div><span className={`status-pill ${declined?"danger":"progress"}`}>{declined?"Declined":state.locked?"Approved & locked":state.planningStatus}</span><h2>Manager / Partner roll-up</h2><p>Review each significant planning conclusion independently before locking Planning.</p></div><div className="reviewers"><span className={state.managerApproved?"done":"active"}><CheckCircle2/>Manager</span><i/><span className={state.partnerApproved?"done":state.managerApproved?"active":""}><ShieldCheck/>Partner</span></div></div>
    {declined&&<Banner tone="danger" title="Engagement declined" text="This engagement cannot be approved or locked. Resolve the Acceptance & continuance decision in Engagement Foundation before requesting review."/>}
    {!canApprove&&!declined&&<Banner tone="info" title="Read-only preparer view" text="Switch the prototype role to Manager or Partner to demonstrate approval actions."/>}
    {cards.map(([title,detail,tone])=><article className={`review-card ${approved.includes(title)?"approved-card":""}`} key={title}><div className={`review-icon ${tone}`}>{approved.includes(title)?<Check/>:tone==="danger"?<AlertCircle/>:tone==="warning"?<AlertTriangle/>:<FileCheck2/>}</div><div><h3>{title}</h3><p>{detail}</p>{title==="Materiality"&&<small>Benchmark: Total Revenue (2.5%) · Source: reconciled Trial Balance</small>}{title==="Risk assessment"&&<small>{riskList.filter(r=>r.significant).length} significant · {riskList.filter(r=>r.fraud).length} fraud risks · all non-zero FSAs concluded</small>}</div><div className="review-actions">{approved.includes(title)?<span className="approved-by"><CheckCircle2/>Approved by {state.role}</span>:<><button className="secondary-btn" onClick={()=>{setNote(title);update({},"Review note opened — type a comment before returning")}}>Return</button><button className="primary-btn" onClick={()=>approve(title)}>Approve</button></>}</div></article>)}
    {note&&<div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><h2>Return {note}</h2><p>Your comment is retained in the audit trail.</p></div><button className="icon-btn" onClick={()=>setNote("")}><X/></button></div><Field label="Reviewer comment" required><textarea autoFocus placeholder="Describe the required change…"/></Field><div className="modal-actions"><button className="secondary-btn" onClick={()=>setNote("")}>Cancel</button><button className="primary-btn" onClick={()=>{setNote("");update({planningStatus:"Returned for Changes"},"Section returned to the preparer with a review note")}}>Return for changes</button></div></div></div>}
    <div className="approval-footer"><div>{all?<CheckCircle2/>:<AlertCircle/>}<span><strong>{approved.length} of {cards.length} cards approved</strong><small>{all?"All conclusions are ready for final approval.":"Final approval remains disabled until every card is reviewed."}</small></span></div>{state.locked?<button className="danger-btn" onClick={()=>setReopen(true)}><RotateCcw/>Reopen Planning</button>:<><button className="primary-btn" disabled={!all||declined||(state.role==="Partner"&&!state.managerApproved)} onClick={()=>state.role==="Partner"?update({partnerApproved:true,locked:true,planningStatus:"Approved & Locked"},"Partner approval recorded. Planning locked and Fieldwork unlocked."):update({managerApproved:true,planningStatus:"Pending Partner Approval"},"Manager approval recorded. Sent to Partner for final approval.")}><LockKeyhole/>{state.role==="Partner"?"Approve all & lock Planning":"Approve all as Manager"}</button>{declined&&<small style={{color:"var(--red)"}}>This engagement was declined and cannot be locked.</small>}{!declined&&state.role==="Partner"&&!state.managerApproved&&<small style={{color:"var(--red)"}}>Manager approval is required before Partner approval.</small>}</>}</div>
    {reopen&&<ReopenModal update={update} close={()=>setReopen(false)}/>} 
  </div>;
}

function AuditTrail({ update }: { update:(p:Partial<DemoState>,m?:string)=>void }) { const events=[["2:42 PM","Jasmine Alvarez","Updated materiality percentage","2.0% → 2.5%","Aligned to nonprofit firm guidance"],["2:31 PM","AssureAudit Connector","Synchronized General Ledger","1,204 transactions","QuickBooks Online"],["1:58 PM","Meera Kapoor","Resolved review note","Entity understanding","Source evidence linked"],["11:16 AM","Jasmine Alvarez","Accepted reconciliation variance","$12,000","Timing difference in restricted grant receipt"],["Aug 10","System","Published Engagement Variables","Version 1","5 variables created"],["Aug 9","Oscar Owner","Completed fraud discussion","4 participants","Meeting record attached"]]; return <div className="content-pad"><div className="section-title"><div><h2>Complete audit trail</h2><p>UTC storage with firm-local display. Every override, acceptance and approval is retained.</p></div><button className="secondary-btn" onClick={()=>update({},"Audit trail exported as audit-trail.pdf")}><Download/>Export log</button></div><div className="audit-timeline">{events.map((e,i)=><div key={i}><i className={i<2?"current":""}/><span>{e[0]}</span><div><strong>{e[2]}</strong><p><b>{e[1]}</b> · {e[3]}</p><small>Rationale: {e[4]}</small></div></div>)}</div></div> }

function PlanningManager({state,update,navigate}:{state:DemoState;update:(p:Partial<DemoState>,m?:string)=>void;navigate:(p:string)=>void}) {
  const [selected,setSelected]=useState<string|null>(null);
  const [showCompleted,setShowCompleted]=useState(false);
  const planningPct=planningProgressPct(state);
  const [expanded,setExpanded]=useState<Record<string,boolean>>({"Commence":true,"Understand":true,"Identify & assess":true,"Respond":true});
  const workpapers=[
    {stage:"Commence",title:"Acceptance & continuance",status:"Complete",owner:"JA",points:0,due:"Aug 12",progress:100,route:"setup"},
    {stage:"Commence",title:"Independence",status:"In Review",owner:"MK",points:2,due:"Aug 12",progress:85,route:"setup"},
    {stage:"Understand",title:"Understanding the entity",status:"In Progress",owner:"JA",points:1,due:"Aug 14",progress:70,route:"entity-controls"},
    {stage:"Understand",title:"Internal control & IT",status:"In Progress",owner:"JA",points:0,due:"Aug 15",progress:62,route:"entity-controls"},
    {stage:"Identify & assess",title:"Flux analytics & automatic scoping",status:"Complete",owner:"JA",points:0,due:"Aug 15",progress:100,route:"risks"},
    {stage:"Identify & assess",title:"Risk assessment",status:"In Review",owner:"MK",points:1,due:"Aug 16",progress:78,route:"risks"},
    {stage:"Respond",title:"Audit plan",status:"Needs Attention",owner:"JA",points:1,due:"Aug 18",progress:58,route:"responses"},
    {stage:"Approve",title:"Planning communications",status:"Not Started",owner:"OO",points:0,due:"Aug 20",progress:0,route:"publish"},
  ];
  const stages=["Commence","Understand","Identify & assess","Respond","Approve"];
  const completedCount=workpapers.filter(w=>w.status==="Complete").length;
  const current=workpapers.find(w=>w.title===selected);
  if(current)return <section className="workpaper-detail"><div className="workpaper-detail-head"><button className="back-link" onClick={()=>setSelected(null)}><ArrowLeft/>Planning workpapers</button><div><span className="eyebrow">{current.stage}</span><h2>{current.title}</h2><p>Prepared by {current.owner} · Due {current.due}</p></div><div><span className={`status-pill ${statusClass(current.status)}`}>{current.status}</span><button className="secondary-btn" onClick={()=>navigate(`/engagement/bbawc/planning/${current.route}`)}>Open full workpaper <ArrowRight/></button></div></div><div className="workpaper-detail-progress"><span><strong>{current.progress}%</strong> complete</span><i><em style={{width:`${current.progress}%`}}/></i></div><div className="workpaper-detail-grid"><div className="procedure-panel"><div className="section-title"><div><p className="eyebrow">Procedure 01</p><h3>Document and evaluate the planning conclusion</h3></div><span className="status-pill progress">In progress</span></div><p>Perform the required procedure, cross-reference supporting evidence and document a clear conclusion. Client responses are inputs only; the auditor owns the conclusion.</p><div className="procedure-checks"><CheckRow title="Objective and relevant assertion documented" detail="Linked to the engagement-level planning objective" checked/><CheckRow title="Evidence cross-referenced" detail="Two supporting files linked" checked={current.progress===100}/><CheckRow title="Reviewer point resolved" detail={current.points?`${current.points} open review point${current.points===1?"":"s"}`:"No open review points"} checked={current.points===0}/></div><Field label="Auditor response and conclusion"><textarea defaultValue="Procedure performed. Evidence inspected and the conclusion is consistent with the planning record. Any exceptions are documented in the review notes."/></Field><div className="workpaper-actions"><button className="secondary-btn" onClick={()=>update({},`${current.title} response saved as draft`)}>Save draft</button><button className="primary-btn" onClick={()=>update({},`${current.title} sent for review`)}>Send for review <Send/></button></div></div><aside className="workpaper-evidence"><h3>Evidence & review</h3><button><FileText/><span><strong>Planning support.pdf</strong><small>Evidence · 1.8 MB</small></span><ChevronRight/></button><button><MessageSquare/><span><strong>{current.points} review points</strong><small>{current.points?"Requires auditor response":"Nothing outstanding"}</small></span><ChevronRight/></button><button><History/><span><strong>Activity history</strong><small>Last updated 18 min ago</small></span><ChevronRight/></button></aside></div></section>;
  return <section className="planning-board">
    <div className="planning-board-head"><div><p className="eyebrow">Planning workpapers</p><h2>Complete the work, then send it for review</h2><p>Active work is shown first. Completed work stays available without competing for attention.</p></div><div className="board-head-actions"><button className={`secondary-btn completed-toggle ${showCompleted?"active":""}`} onClick={()=>setShowCompleted(!showCompleted)}>{showCompleted?<><Circle/>Hide completed</>:<><CheckCircle2/>Show completed ({completedCount})</>}</button><button className="primary-btn" onClick={()=>update({},"New workpaper draft created (simulated)")}><Plus/>Add workpaper</button></div></div>
    <div className="planning-phase-strip"><div><span>Planning</span><strong>{planningPct}%</strong><i><em style={{width:`${planningPct}%`}}/></i></div><div><span>Response</span><strong>29%</strong><i><em style={{width:"29%"}}/></i></div><div><span>Completion</span><strong>7%</strong><i><em style={{width:"7%"}}/></i></div></div>
    <div className="planning-board-grid"><div className="workpaper-groups">{stages.map(stage=>{const allRows=workpapers.filter(w=>w.stage===stage);const rows=showCompleted?allRows:allRows.filter(w=>w.status!=="Complete");if(rows.length===0)return null;const pct=Math.round(allRows.reduce((sum,w)=>sum+w.progress,0)/allRows.length);const activeCount=allRows.filter(r=>r.status!=="Complete").length;const isOpen=!!expanded[stage];return <section className="workpaper-stage" key={stage}><button className="stage-toggle" onClick={()=>setExpanded(v=>({...v,[stage]:!isOpen}))}><span><strong>{stage}</strong><small>{activeCount} active · {allRows.length-activeCount} complete</small></span><span className="stage-progress"><b>{pct}%</b><i><em style={{width:`${pct}%`}}/></i>{isOpen?<ChevronDown/>:<ChevronRight/>}</span></button>{isOpen&&<div className="stage-rows">{rows.map(row=><button className="workpaper-row-refined" key={row.title} onClick={()=>setSelected(row.title)}><span className={`workpaper-state ${statusClass(row.status)}`}>{row.status==="Complete"?<Check/>:row.status==="Needs Attention"?<AlertCircle/>:<Circle/>}</span><span className="workpaper-title"><strong>{row.title}</strong><small>{row.status} · {row.progress}% complete</small></span><span className="row-meter"><i><em style={{width:`${row.progress}%`}}/></i></span><span className="review-count">{row.points>0&&<><MessageSquare/>{row.points}</>}</span><i className="person-avatar violet">{row.owner}</i><span className="row-due"><small>Due</small>{row.due}</span><ChevronRight/></button>)}</div>}</section>})}</div>
      <aside className="planning-insight-rail"><section><div className="rail-title"><h3>Key information</h3><InfoTip title="Key information" text="Figures flow from the reconciled Data Ingest package and the engagement record." standard="AssureAudit data lineage"/></div><dl><div><dt>Revenue</dt><dd>$9.6M</dd></div><div><dt>Net assets</dt><dd>$2.21M</dd></div><div><dt>Overall materiality</dt><dd>{money(state.materialityOverride?240000:state.benchmark*(state.materialityPct/100))}</dd></div><div><dt>Performance materiality</dt><dd>{money((state.materialityOverride?240000:state.benchmark*(state.materialityPct/100))*state.performancePct/100)}</dd></div></dl><label>Entity risk<select value={state.entityRisk} onChange={e=>update({entityRisk:e.target.value as DemoState["entityRisk"]},`Entity risk updated to ${e.target.value}`)}><option>Normal</option><option>Elevated</option><option>High</option></select></label></section><section><div className="rail-title"><h3>Needs attention</h3><span className="rail-count">3</span></div><button onClick={()=>setSelected("Independence")}><AlertCircle/><span><strong>2 confirmations pending</strong><small>Independence · due today</small></span><ChevronRight/></button><button onClick={()=>setSelected("Audit plan")}><MessageSquare/><span><strong>Response gap remains</strong><small>Audit plan · 1 review point</small></span><ChevronRight/></button><button onClick={()=>navigate("/engagement/bbawc/planning/materiality")}><Clock3/><span><strong>Lock materiality</strong><small>Required before approval</small></span><ChevronRight/></button></section></aside>
    </div>
  </section>
}

function QuestionnaireWorkspace({state,update}:{state:DemoState;update:(p:Partial<DemoState>,m?:string)=>void}) {
  const [view,setView]=useState<"Template library"|"Active client request"|"Auditor review">("Template library");
  const [editing,setEditing]=useState(false);
  const [prompt,setPrompt]=useState(state.questionnairePrompt);
  const templates=[
    ["Understanding the Entity","12 questions","Business, governance, industry, contracts and reporting"],
    ["Understanding Internal Control","18 questions","Control environment, five components, IT and monitoring"],
    ["Business Process Mapping","8 process templates","Revenue, purchasing, payroll, close and donor restrictions"],
    ["Fraud & Journal Entry Risk","14 questions","Incentives, opportunities, override and unusual journals"],
    ["Estimates & Related Parties","10 questions","Methods, uncertainty, bias, relationships and disclosures"],
  ];
  return <section className="questionnaire-workspace"><div className="questionnaire-head"><div><p className="eyebrow">Reusable methodology</p><h2>Planning forms & client collaboration</h2><p>Firm-owned templates become engagement questionnaires; client responses remain drafts until an auditor validates them.</p></div><span className={`status-pill ${statusClass(state.questionnaireStatus)}`}>{state.questionnaireStatus}</span></div><div className="subtabs compact">{(["Template library","Active client request","Auditor review"] as const).map(v=><button key={v} className={view===v?"active":""} onClick={()=>setView(v)}>{v}{v==="Auditor review"&&state.questionnaireStatus==="Client Responded"?<span className="count">1</span>:null}</button>)}</div>
    {view==="Template library"&&<div className="template-grid">{templates.map((t,i)=><article key={t[0]} className={i===0?"selected":""}><div className="template-icon">{i===0?<Building2/>:i===1?<ShieldCheck/>:i===2?<RefreshCw/>:i===3?<AlertTriangle/>:<FileText/>}</div><div><strong>{t[0]}</strong><span>{t[1]}</span><small>{t[2]}</small></div><button className="icon-btn" onClick={()=>{if(i===0){setEditing(true);setView("Active client request")}}}><Pencil/></button></article>)}</div>}
    {view==="Active client request"&&<div className="active-questionnaire"><div className="questionnaire-meta"><div><span>Form</span><strong>Understanding the Entity — FY 2025</strong></div><div><span>Assigned client contact</span><strong>Dana Collins · Controller</strong></div><div><span>Firm reviewer</span><strong>Jasmine Alvarez</strong></div><div><span>Due</span><strong>August 13, 2025</strong></div></div><div className="editable-question"><div className="question-head"><span>01</span><div><strong>Business model, revenue and change</strong><small>Required · Long text · Client-facing</small></div><button className="secondary-btn" onClick={()=>setEditing(!editing)}><Pencil/>{editing?"Finish editing":"Edit question"}</button></div>{editing?<Field label="Question wording"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)}/></Field>:<p>{state.questionnairePrompt}</p>}<div className="question-options"><label><input type="checkbox" defaultChecked/>Require evidence attachment</label><label><input type="checkbox" defaultChecked/>Allow auditor follow-up</label><label><input type="checkbox" defaultChecked/>Create risk from answer</label></div></div><div className="questionnaire-actions"><span><Info/>The client never sees internal risk scores, materiality or audit responses.</span>{editing?<button className="primary-btn" onClick={()=>{update({questionnairePrompt:prompt},"Question template updated and versioned");setEditing(false)}}>Save template change</button>:<button className="primary-btn" onClick={()=>update({questionnaireStatus:"Sent to Client"},"Understanding the Entity questionnaire sent to Dana Collins")}>{state.questionnaireStatus==="Draft"?"Send to client":"Resend reminder"}<Send/></button>}</div></div>}
    {view==="Auditor review"&&<div className="auditor-review"><div className="response-comparison"><div><span>Auditor question</span><p>{state.questionnairePrompt}</p></div><div><span>Client response</span><p>{state.clientAnswer||"No client response received yet. Switch to Client Contact to complete the questionnaire."}</p></div></div>{state.clientAnswer&&<><Field label="Auditor cross-check and conclusion"><textarea defaultValue="Response agrees to the policy handbook and current-year revenue analytics. The new conditional city grant requires a separate revenue-cutoff risk and contract inspection."/></Field><div className="review-evidence"><CheckCircle2/><span><strong>Cross-check completed</strong>Policy handbook · Grant agreement · TB revenue mapping · Flux analytics</span></div></>}<div className="questionnaire-actions"><button className="secondary-btn" disabled={!state.clientAnswer} onClick={()=>update({questionnaireStatus:"Clarification Needed"},"Clarification request returned to the client")}>Request clarification</button><button className="secondary-btn" disabled={!state.clientAnswer} onClick={()=>{const risk:RiskItem={id:2000+state.customRisks.length,title:"Revenue concentration and conditional funding",fsa:"Contributions",assertion:"Completeness",likelihood:"Moderate",magnitude:"Moderate",level:"Moderate",significant:false,fraud:false,balance:"N/A",driver:"Client questionnaire response",response:"Needs response"};update({customRisks:[...state.customRisks,risk]},"Risk draft created from the client response — added to the risk register")}}><AlertTriangle/>Create risk</button><button className="primary-btn" disabled={!state.clientAnswer} onClick={()=>update({questionnaireStatus:"Validated"},"Client response validated by the auditor")}>Validate response <Check/></button></div></div>}
  </section>
}

const FLUX_SEED=[
  {area:"Contribution revenue",current:3840000,prior:3420000,risk:"Revenue cutoff",qualitative:true},
  {area:"Program service expenses",current:5420000,prior:4880000,risk:"Payroll allocation",qualitative:false},
  {area:"Cash",current:612480,prior:820300,risk:"Cash existence",qualitative:false},
  {area:"Contributions receivable",current:486200,prior:310400,risk:"Allowance for pledges",qualitative:true},
  {area:"Investments",current:742100,prior:785000,risk:"Investment valuation",qualitative:false},
  {area:"Property & equipment",current:384000,prior:345000,risk:"Fixed asset additions",qualitative:false},
];
function FluxAnalytics({state,update,navigate}:{state:DemoState;update:(p:Partial<DemoState>,m?:string)=>void;navigate:(p:string)=>void}) {
  const [view,setView]=useState<"Flux analysis"|"Automatic scoping"|"Benchmark guidance">("Flux analysis");
  const [thresholdOpen,setThresholdOpen]=useState(false);
  const thresholdRef=useDismiss(thresholdOpen,()=>setThresholdOpen(false));
  const [thresholdType,setThresholdType]=useState<"pm"|"value"|"percent">("pm");
  const [thresholdValue,setThresholdValue]=useState(100000);
  const [thresholdPercent,setThresholdPercent]=useState(10);
  const [commentary,setCommentary]=useState<Record<string,{status:"none"|"requested"|"received";text:string}>>({
    "Contribution revenue":{status:"received",text:"The increase reflects a new multi-year city grant awarded in Q4, plus stronger year-end individual giving from our December appeal."},
    "Cash":{status:"received",text:"Cash declined due to the timing of payroll funding and a planned transfer of $150,000 to the board-designated reserve in November."},
  });
  const [commentaryRow,setCommentaryRow]=useState<string|null>(null);
  const [reportOpen,setReportOpen]=useState(false);
  const overall=state.materialityOverride?240000:state.benchmark*state.materialityPct/100;
  const performance=overall*state.performancePct/100;
  const trivial=overall*state.trivialPct/100;
  const rows=FLUX_SEED.map(r=>{
    const movement=r.current-r.prior;
    const movePct=r.prior?(movement/r.prior*100):0;
    const threshold=thresholdType==="pm"?performance:thresholdType==="value"?thresholdValue:Math.abs(r.prior)*(thresholdPercent/100);
    const ratio=threshold?Math.abs(movement)/threshold:0;
    const severity:"danger"|"warning"|"neutral"=r.qualitative||ratio>=2?"danger":ratio>=1?"warning":"neutral";
    return {...r,movement,movePct,threshold,ratio,severity,scoped:Math.abs(r.current)>=overall||Math.abs(movement)>=performance||r.qualitative};
  });
  const requestCommentary=(area:string)=>{setCommentary(c=>({...c,[area]:{status:"requested",text:""}}));update({},`Management commentary requested from Dana Collins for "${area}"`);setCommentaryRow(null)};
  return <section className="flux-workspace"><div className="flux-head"><div><p className="eyebrow">Planning analytics</p><h2>Flux, materiality & scoping</h2><p>Analytics identify patterns and exceptions for auditor evaluation; they never create a risk conclusion automatically.</p></div><div className="threshold-chips"><span>OM <strong>{money(overall)}</strong></span><span>PM <strong>{money(performance)}</strong></span><span>Trivial <strong>{money(trivial)}</strong></span></div></div><div className="subtabs compact">{(["Flux analysis","Automatic scoping","Benchmark guidance"] as const).map(v=><button key={v} className={view===v?"active":""} onClick={()=>setView(v)}>{v}</button>)}</div>
    {view==="Flux analysis"&&<><div className="analytics-chain"><span>TB / GL</span><ArrowRight/><span>Pattern or exception</span><ArrowRight/><span>Auditor evaluation</span><ArrowRight/><span>Risk</span><ArrowRight/><span>Response</span></div>
      <div className="documents-toolbar-row" style={{borderRadius:0,borderLeft:0,borderRight:0}}>
        <div className="topbar-popover" ref={thresholdRef}><button className="secondary-btn" onClick={()=>setThresholdOpen(!thresholdOpen)}><Settings size={15}/>Unusual movement threshold</button>{thresholdOpen&&<div className="dropdown-menu threshold-menu"><div className="dropdown-head"><strong>Flag movements exceeding</strong><span>Applies to every row below</span></div>
          <label className="dropdown-check"><input type="radio" name="fluxThreshold" checked={thresholdType==="pm"} onChange={()=>setThresholdType("pm")}/><span>Performance materiality ({money(performance)})</span></label>
          <label className="dropdown-check"><input type="radio" name="fluxThreshold" checked={thresholdType==="value"} onChange={()=>setThresholdType("value")}/><span>Custom dollar amount</span></label>
          {thresholdType==="value"&&<div style={{padding:"2px 12px 8px"}}><input type="number" value={thresholdValue} onChange={e=>setThresholdValue(Number(e.target.value))}/></div>}
          <label className="dropdown-check"><input type="radio" name="fluxThreshold" checked={thresholdType==="percent"} onChange={()=>setThresholdType("percent")}/><span>% change from prior period</span></label>
          {thresholdType==="percent"&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"2px 12px 8px"}}><input type="number" value={thresholdPercent} onChange={e=>setThresholdPercent(Number(e.target.value))}/><span>%</span></div>}
        </div>}</div>
        <button className="secondary-btn" onClick={()=>setReportOpen(true)}><Download size={15}/>Download flux report</button>
      </div>
      <div className="table-card flux-table"><table><thead><tr><th>Financial statement area</th><th>Current</th><th>Prior</th><th>Movement</th><th>% change</th><th>Severity</th><th>Management commentary</th><th>Auditor action</th></tr></thead><tbody>{rows.map(r=>{const c=commentary[r.area]||{status:"none",text:""};return <tr key={r.area}><td><strong>{r.area}</strong><span>{r.qualitative?"Qualitative risk indicator present":"Standard flux rule"}</span></td><td>{money(r.current)}</td><td>{money(r.prior)}</td><td className={r.severity!=="neutral"?"variance":""}>{r.movement<0?"−":"+"}{money(Math.abs(r.movement))}</td><td>{r.movePct>0?"+":""}{r.movePct.toFixed(1)}%</td><td><span className={`status-pill ${r.severity}`}>{r.severity==="danger"?<AlertCircle size={13}/>:r.severity==="warning"?<AlertTriangle size={13}/>:<Circle size={13}/>}{r.severity==="danger"?"Red":r.severity==="warning"?"Amber":"Grey"}</span></td><td>{c.status==="none"?<button className="text-link" onClick={()=>setCommentaryRow(r.area)}>Request <Send size={13}/></button>:c.status==="requested"?<span className="status-pill neutral">Awaiting reply</span>:<button className="text-link" onClick={()=>setCommentaryRow(r.area)}>View reply <ArrowRight size={13}/></button>}</td><td><button className="text-link" onClick={()=>{update({},`Analytics indicator linked to ${r.risk} — opening Risk Assessment`);navigate("/engagement/bbawc/planning/risks")}}>{r.risk?<><Link2/>{r.risk}</>:"Evaluate"}</button></td></tr>})}</tbody></table></div></>}
    {view==="Automatic scoping"&&<><Banner tone="info" title="Scoping recommendation, not an automatic conclusion" text="An area is proposed in scope when its balance exceeds Overall Materiality, its movement exceeds Performance Materiality, or a qualitative/significant-risk indicator exists. Auditor rationale is required for overrides."/><div className="scoping-grid">{rows.map(r=><article key={r.area} className={r.scoped?"scoped":"out"}><div><strong>{r.area}</strong><span>{money(r.current)} balance · {money(Math.abs(r.movement))} movement</span></div><span className={`status-pill ${r.scoped?"progress":"neutral"}`}>{r.scoped?"Proposed in scope":"Proposed out"}</span><small>{Math.abs(r.current)>=overall?"Balance exceeds OM":Math.abs(r.movement)>=performance?"Movement exceeds PM":r.qualitative?"Qualitative risk indicator":"Below quantitative thresholds"}</small><select defaultValue={r.scoped?"In scope":"Out of scope"}><option>In scope</option><option>Limited scope</option><option>Out of scope</option></select></article>)}</div></>}
    {view==="Benchmark guidance"&&<div className="benchmark-guidance"><Banner tone="warning" title="Professional judgment is required" text="Audit standards require a benchmark and materiality supported by the entity’s circumstances; they do not prescribe universal percentages. The ranges below are illustrative firm methodology and must be configurable."/><div className="benchmark-cards"><article className="recommended"><Sparkles/><strong>Total revenue</strong><span>Recommended for this nonprofit</span><b>Illustrative range: 0.5%–3%</b><small>Stable revenue and donor stewardship are key user considerations.</small></article><article><Building2/><strong>Total assets / net assets</strong><span>Alternative for asset-focused entities</span><b>Illustrative range: 1%–2%</b><small>Consider when financial position drives user decisions.</small></article><article><BarChart3/><strong>Income before tax</strong><span>Alternative for profit-oriented entities</span><b>Illustrative range: 5%–10%</b><small>Use normalized results where earnings fluctuate.</small></article></div></div>}
    {commentaryRow&&<FluxCommentaryModal area={commentaryRow} entry={commentary[commentaryRow]||{status:"none",text:""}} close={()=>setCommentaryRow(null)} onRequest={()=>requestCommentary(commentaryRow)} onAccept={()=>{update({},`Commentary for "${commentaryRow}" accepted and linked to the workpaper`);setCommentaryRow(null)}}/>}
    {reportOpen&&<FluxReportModal rows={rows} close={()=>setReportOpen(false)} update={update}/>}
  </section>
}
function FluxCommentaryModal({area,entry,close,onRequest,onAccept}:{area:string;entry:{status:string;text:string};close:()=>void;onRequest:()=>void;onAccept:()=>void}){
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>Management commentary</h2><p>{area}</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    {entry.status==="received"?<><p className="panel-description">{entry.text}</p><div className="modal-actions"><button className="secondary-btn" onClick={close}>Close</button><button className="primary-btn" onClick={onAccept}>Accept & link to workpaper <Check size={15}/></button></div></>
    :entry.status==="requested"?<><Banner tone="info" title="Awaiting client response" text="Dana Collins has been asked to explain this movement. You'll be notified when a response is received."/><div className="modal-actions"><button className="secondary-btn" onClick={close}>Close</button></div></>
    :<><p className="panel-description">No commentary has been requested for this movement yet.</p><div className="modal-actions"><button className="secondary-btn" onClick={close}>Cancel</button><button className="primary-btn" onClick={onRequest}>Request from client <Send size={15}/></button></div></>}
  </div></div>;
}
function FluxReportModal({rows,close,update}:{rows:any[];close:()=>void;update:(p:Partial<DemoState>,m?:string)=>void}){
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>Flux analysis report</h2><p>Browser-ready preview, generated from current Planning data</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <div className="table-card" style={{marginTop:2}}><table><thead><tr><th>Area</th><th>Current</th><th>Prior</th><th>Movement</th><th>Severity</th></tr></thead><tbody>{rows.map(r=><tr key={r.area}><td><strong>{r.area}</strong></td><td>{money(r.current)}</td><td>{money(r.prior)}</td><td>{r.movement<0?"−":"+"}{money(Math.abs(r.movement))}</td><td><span className={`status-pill ${r.severity}`}>{r.severity==="danger"?"Red":r.severity==="warning"?"Amber":"Grey"}</span></td></tr>)}</tbody></table></div>
    <div className="modal-actions"><button className="secondary-btn" onClick={close}>Close</button><button className="primary-btn" onClick={()=>{update({},"Flux analysis report downloaded as flux-analysis-report.pdf");close()}}>Download <Download size={15}/></button></div>
  </div></div>;
}

function RiskResponseQc({gap}:{gap:boolean}) {
  const [open,setOpen]=useState(false);
  return <section className="response-qc"><div className="response-qc-head"><div><p className="eyebrow">Auditor-only methodology</p><h2>Risk → response quality check</h2><p>Each significant risk must drive assertion-specific procedures and evidence.</p></div><button className="secondary-btn" onClick={()=>setOpen(!open)}>{open?"Hide QC detail":"Show QC detail"}<ChevronDown/></button></div><div className="risk-response-chain">{["Understand client","Identify risk","Assess risk","Design response","Select procedure","Evaluate evidence","Conclude"].map((s,i)=><div key={s}><span className={gap&&i>3?"pending":"done"}>{i<4||!gap?<Check/>:<Circle/>}</span><strong>{s}</strong>{i<6&&<ArrowRight/>}</div>)}</div>{open&&<div className="qc-detail"><div className="procedure-anatomy">{[["Objective","What are we trying to establish?"],["Risk","Why is the procedure necessary?"],["Assertion","Which assertion is addressed?"],["Population","What data is being tested?"],["Nature / timing / extent","What will be performed, when and how much?"],["Sample","Which items and why?"],["Evidence","What support is required?"],["Exceptions & conclusion","What was found and what does it mean?"]].map(x=><div key={x[0]}><strong>{x[0]}</strong><span>{x[1]}</span></div>)}</div><div className="qc-checks"><CheckRow title="Significant and fraud risks are clearly flagged" detail="3 significant · 2 fraud risks" checked/><CheckRow title="Relevant assertions are documented" detail="Coverage shown by risk and financial statement area" checked/><CheckRow title="Every significant risk has a specifically responsive procedure" detail={gap?"1 gap remains — blocks completion":"All significant risks covered"} checked={!gap}/><CheckRow title="Control reliance is supported by control testing" detail="Controls and substantive responses are separated" checked/></div></div>}</section>
}

function GlobalGuide({path,open,setOpen}:{path:string;open:boolean;setOpen:(v:boolean)=>void;navigate:(p:string)=>void}){
  const [step,setStep]=useState(0);
  const clientPath=path.startsWith("/clients/");
  const guide=path==="/dashboard"?{title:"Firm dashboard",steps:[
    ["Choose the reporting period","Use the Financial year selector in the top bar. Portfolio counts, engagement labels and due work stay scoped to that year."],
    ["Read the portfolio","Start with engagement stage and due-date charts to see where the firm needs attention."],
    ["Open a client","Select a client row to move from the firm-wide view into that client’s overview, documents, team and audit workflow."],
  ]}:path==="/clients"?{title:"Client portfolio",steps:[
    ["Find the right client","Search by client, industry or audit type, then use the industry filter to narrow the list."],
    ["Review ownership","Each card shows the current stage, assigned firm and client team, documents and open items."],
    ["Start an engagement","New engagement collects workflow, industry, risk and accountability before anything enters Data Ingest."],
  ]}:path==="/documents"||(clientPath&&path.endsWith("/documents"))?{title:"Documents",steps:[
    ["Switch clients from one place","One document center serves every client — use the list on the left to move between libraries without leaving the page."],
    ["Files vs. Requests","Files groups documents by category with status and comment counts. Requests tracks what's still outstanding from the client — the pending count on the tab always matches what's in the list."],
    ["Trace back to the source workpaper","The numbered chips (201–205) link each document category to the Data Ingest or Workpapers step that produced it — click one to jump straight there."],
  ]}:clientPath?{title:"Client overview",steps:[
    ["Review the client first","This page combines engagement details, attention items, documents and the approval hierarchy for one client."],
    ["Continue the workflow","The current-stage card opens the next available Data Ingest or Workpapers action."],
    ["Trace responsibility","People & approvals separates firm and client roles and shows who prepares, reviews and approves."],
  ]}:path.includes("/ingest")?{title:"Data Ingest",steps:[
    ["Follow the eight steps","The left rail keeps collection, transformation, mapping, reconciliation and Materiality in one traceable sequence."],
    ["Resolve exceptions","Warnings must be reviewed before source data can be locked for Workpapers."],
    ["Complete the handoff","Materiality & handoff locks the reconciled ingest package and opens downstream Workpapers."],
  ]}:path.includes("/planning")?{title:"Workpapers",steps:[
    ["Work by phase","Open the Workpapers branch to move through Commence, Understand, Risk assessment and response work."],
    ["Use contextual support","The Context rail contains comments, review notes, activity and attachments. This Guide remains the single product tour."],
    ["Submit with evidence","Completion and approval remain blocked until the required conclusions, review points and dependencies are cleared."],
  ]}:path==="/my-work"?{title:"My work",steps:[
    ["Start with priority","Urgent work appears first, followed by due-soon and review items."],
    ["Filter the queue","Use the tabs to focus on priorities, deadlines, review work or every assignment."],
    ["Open the source task","Each row returns to the relevant client and workpaper so status is never updated without context."],
  ]}:{title:"AssureAudit",steps:[
    ["Select a client","Open Clients to choose the audit workspace you need."],
    ["Follow the workflow","Data Ingest prepares source data before Workpapers, Fieldwork and Reporting."],
    ["Keep work traceable","Notifications, review notes and the audit log preserve responsibility and evidence."],
  ]};
  useEffect(()=>{setStep(0)},[path,open]);
  useEffect(()=>{if(!open)return;const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[open,setOpen]);
  const current=guide.steps[step];
  return <><button className="tour-fab" aria-label="Open AssureAudit Guide" aria-expanded={open} onClick={()=>setOpen(!open)}><BookOpen/><span>Guide</span></button>{open&&<div className="guide-backdrop" onClick={()=>setOpen(false)}><section className="guide-tour" role="dialog" aria-modal="true" aria-label={`${guide.title} guide`} onClick={e=>e.stopPropagation()}><div className="guide-tour-head"><span><BookOpen/></span><div><p className="eyebrow">AssureAudit guide</p><h2>{guide.title}</h2></div><button className="icon-btn" aria-label="Close Guide" onClick={()=>setOpen(false)}><X/></button></div><div className="guide-progress"><span>Step {step+1} of {guide.steps.length}</span><i>{guide.steps.map((_,i)=><b key={i} className={i<=step?"active":""}/>)}</i></div><div className="guide-tour-copy"><span className="guide-step-number">{step+1}</span><h3>{current[0]}</h3><p>{current[1]}</p></div><div className="guide-tour-actions"><button className="secondary-btn" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ChevronLeft/>Back</button>{step<guide.steps.length-1?<button className="primary-btn" onClick={()=>setStep(s=>s+1)}>Next <ArrowRight/></button>:<button className="primary-btn" onClick={()=>setOpen(false)}>Done <Check/></button>}</div></section></div>}</>;
}

function ContextDrawer({ drawer,setDrawer,open,setOpen,update }: any) {
  const [comments,setComments]=useState<{author:string;text:string}[]>([]);
  const [commentDraft,setCommentDraft]=useState("");
  const [notes,setNotes]=useState([
    {title:"Explain related-party controls",author:"Meera Kapoor",status:"Open"},
    {title:"Link the new grant agreement",author:"Oscar Owner",status:"Cleared"},
  ]);
  const [noteDraft,setNoteDraft]=useState("");
  if(!open)return <button className="drawer-restore" onClick={()=>setOpen(true)}><MessageSquare/><span>Context</span></button>;
  const tabs=["Comments","Review notes","Activity","Attachments"];
  const openNotes=notes.filter(n=>n.status==="Open").length;
  const addComment=()=>{ if(!commentDraft.trim())return; setComments(c=>[...c,{author:"Oscar Owner",text:commentDraft.trim()}]); setCommentDraft(""); };
  const addNote=()=>{ if(!noteDraft.trim())return; setNotes(n=>[{title:noteDraft.trim(),author:"Oscar Owner",status:"Open"},...n]); setNoteDraft(""); };
  return <aside className="context-drawer"><div className="context-top"><h3>Planning context</h3><button className="icon-btn" onClick={()=>setOpen(false)}><ChevronRight/></button></div><div className="drawer-tabs">{tabs.map(t=><button key={t} className={drawer===t?"active":""} onClick={()=>setDrawer(t)}>{t==="Comments"?<MessageSquare/>:t==="Review notes"?<ClipboardCheck/>:t==="Activity"?<Activity/>:<Paperclip/>}<span>{t}</span>{t==="Review notes"&&openNotes>0&&<i>{openNotes}</i>}</button>)}</div><div className="drawer-content">
    {drawer==="Comments"&&<>{comments.length===0?<EmptyIcon icon={<MessageSquare/>} title="No comments yet" text="Start a step-level discussion with the engagement team."/>:<div className="drawer-comment-list">{comments.map((c,i)=><div key={i} className="drawer-comment"><strong>{c.author}</strong><p>{c.text}</p></div>)}</div>}<Field label="Comment"><textarea value={commentDraft} onChange={(e:any)=>setCommentDraft(e.target.value)} placeholder="Add a comment for the engagement team…"/></Field><button className="primary-btn full" disabled={!commentDraft.trim()} onClick={addComment}><Plus/>Add comment</button></>}
    {drawer==="Review notes"&&<>{notes.map((n,i)=><DrawerNote key={i} title={n.title} author={n.author} status={n.status}/>)}<Field label="Review note"><textarea value={noteDraft} onChange={(e:any)=>setNoteDraft(e.target.value)} placeholder="Describe what needs to change before this section can be approved…"/></Field><button className="secondary-btn full" disabled={!noteDraft.trim()} onClick={addNote}><Plus/>Create review note</button></>}
    {drawer==="Activity"&&<><ActivityItem title="Materiality updated" detail="Jasmine · 2 min ago"/><ActivityItem title="GL sync completed" detail="System · 11 min ago"/><ActivityItem title="Review note resolved" detail="Meera · 44 min ago"/></>}
    {drawer==="Attachments"&&<><DrawerFile update={update} name="2025 Grant Agreement.pdf" meta="1.8 MB · Linked to entity understanding"/><DrawerFile update={update} name="Accounting Policy Handbook.pdf" meta="Client upload · In review"/><button className="secondary-btn full" onClick={()=>update({},"policy-handbook-addendum.pdf attached (simulated)")}><UploadCloud/>Attach evidence</button></>}
  </div></aside> }

function DemoControls({ state,update,close }: {state:DemoState;update:(p:Partial<DemoState>,m?:string)=>void;close:()=>void}) { const action=(label:string,patch:Partial<DemoState>)=>update(patch,label); return <div className="demo-panel"><div className="demo-head"><div><span>Prototype only</span><h3>Demo controls</h3><p>Change the engagement state to test validations and transitions.</p></div><button className="icon-btn" onClick={close}><X/></button></div><label className="demo-role"><span>Preview experience as</span><select aria-label="Prototype role" value={state.role} onChange={e=>update({role:e.target.value as Role},`Viewing as ${e.target.value}`)}>{roleNames.map(r=><option key={r}>{r}</option>)}</select></label><div className="demo-actions"><button onClick={()=>action("All outstanding blockers cleared for the current phase",{independenceOutstanding:0,mapped:100,controlTotals:"Pass",transformationConfirmed:true,questionnaireStatus:"Validated",materialityLocked:true,responseGap:false})}><CheckCircle2/>Complete current step</button><button onClick={()=>action("Connector token expired — ingested data preserved",{connector:"Expired"})}><Cloud/>Simulate connector expiry</button><button onClick={()=>action("Control totals forced to failed state",{controlTotals:"Fail",transformationConfirmed:false})}><AlertCircle/>Force failed control totals</button><button onClick={()=>action("Prior-year structure loaded as editable drafts",{rolledForward:true})}><History/>Load rolled-forward engagement</button><button onClick={()=>action("Group-audit fields enabled",{groupAudit:true})}><Building2/>Switch to group audit</button><button onClick={()=>action("Preliminary materiality published",{publishVersion:state.publishVersion+1})}><Zap/>Publish preliminary materiality</button><button onClick={()=>action("Changed Final TB ingested — downstream steps stale",{finalTb:true,reopened:true,locked:false,managerApproved:false,partnerApproved:false,materialityLocked:false})}><FileSpreadsheet/>Ingest changed Final TB</button><button onClick={()=>action("Planning submitted for Manager review",{planningStatus:"Pending Manager Approval"})}><Send/>Submit for review</button><button onClick={()=>action("Manager approval recorded",{managerApproved:true,planningStatus:"Pending Partner Approval"})}><UserRound/>Approve as Manager</button><button disabled={!state.managerApproved} onClick={()=>state.managerApproved?action("Partner approval recorded — Fieldwork unlocked",{partnerApproved:true,locked:true,planningStatus:"Approved & Locked"}):update({},"Manager approval is required before Partner approval")}><ShieldCheck/>Approve as Partner</button><button onClick={()=>action("Planning reopened — 8 workpapers require re-review",{reopened:true,locked:false,managerApproved:false,partnerApproved:false,planningStatus:"Reopened"})}><RotateCcw/>Reopen Planning</button></div><button className="reset-demo" onClick={()=>{localStorage.removeItem("assureaudit-planning-demo");update(defaultState,"Demo engagement reset")}}><RefreshCw/>Reset engagement</button></div> }

function ClientPortal({ state,update,onExit }: {state:DemoState;update:(p:Partial<DemoState>,m?:string)=>void;onExit:()=>void}) {
  const [selectedTitle,setSelectedTitle]=useState<string|null>(null); const [answer,setAnswer]=useState(state.clientAnswer);
  const [notifOpen,setNotifOpen]=useState(false); const [commentDraft,setCommentDraft]=useState("");
  const [statusFilter,setStatusFilter]=useState<"All"|"To do"|"Submitted"|"Done">("All");
  const [requests,setRequests]=useState([
  {title:"Understanding the Entity Questionnaire",type:"Questionnaire",due:"Aug 13",status:state.questionnaireStatus==="Draft"?"To Do":state.questionnaireStatus,file:"",comments:[] as {author:string;text:string}[]},{title:"Internal Control Questionnaire",type:"Questionnaire",due:"Aug 15",status:"To Do",file:"",comments:[] as {author:string;text:string}[]},{title:"Accounting Policy Handbook",type:"File upload",due:"Aug 14",status:"In Review",file:"Accounting Policy Handbook.pdf",comments:[] as {author:string;text:string}[]},{title:"Organizational Chart",type:"File upload",due:"Aug 14",status:"To Do",file:"",comments:[] as {author:string;text:string}[]},{title:"Related-Party Transactions Listing",type:"Questionnaire",due:"Aug 16",status:"Done",file:"Related Parties 2025.xlsx",comments:[] as {author:string;text:string}[]},{title:"Significant Contracts",type:"File upload",due:"Aug 18",status:"Clarification Needed",file:"",comments:[] as {author:string;text:string}[]},{title:"Prior-Year Planning Workpapers",type:"Information only",due:"—",status:"Done",file:"Reference provided by firm",comments:[] as {author:string;text:string}[]},{title:"QuickBooks Online Access Grant",type:"OAuth access consent",due:"Aug 12",status:"Access Not Granted",file:"",comments:[] as {author:string;text:string}[]},
  ]); const setStatus=(title:string,status:string,file?:string)=>setRequests(rs=>rs.map(r=>r.title===title?{...r,status,file:file??r.file}:r));
  const selected=requests.find(r=>r.title===selectedTitle)||null;
  const openRequest=(title:string)=>{setSelectedTitle(title);setCommentDraft("")};
  const addComment=()=>{ if(!commentDraft.trim()||!selected)return; setRequests(rs=>rs.map(r=>r.title===selected.title?{...r,comments:[...r.comments,{author:"Dana Collins",text:commentDraft.trim()}]}:r)); setCommentDraft(""); };
  const bucketOf=(status:string)=>status==="Done"?"Done":(status==="Submitted"||status==="In Review")?"Submitted":"To do";
  const counts={All:requests.length,"To do":requests.filter(r=>bucketOf(r.status)==="To do").length,Submitted:requests.filter(r=>bucketOf(r.status)==="Submitted").length,Done:requests.filter(r=>bucketOf(r.status)==="Done").length};
  const visibleRequests=requests.filter(r=>statusFilter==="All"||bucketOf(r.status)===statusFilter);
  const dueSoon=requests.filter(r=>bucketOf(r.status)==="To do");
  return <div className="client-portal"><header className="client-top"><div className="brand white"><img className="brand-logo" src="/assureaudit-logo.png" alt="AssureAudit"/><em>Client Portal</em></div><div className="client-actions"><button onClick={()=>update({},"Help center opened (simulated) — support articles for the Client Portal")}><BookOpen/>Help</button><div className="topbar-popover"><button onClick={()=>setNotifOpen(!notifOpen)}><Bell/>{dueSoon.length>0&&<i className="portal-notif-dot"/>}</button>{notifOpen&&<div className="dropdown-menu notif-menu">
        <div className="dropdown-head"><strong>Notifications</strong><span>{dueSoon.length} request{dueSoon.length===1?"":"s"} need action</span></div>
        {dueSoon.length===0?<div className="dropdown-empty">Nothing needs action right now.</div>:dueSoon.map(r=><button key={r.title} className="dropdown-item" onClick={()=>{setNotifOpen(false);openRequest(r.title)}}><AlertCircle size={14}/><span>{r.title} · Due {r.due}</span></button>)}
      </div>}</div><div className="avatar">DC</div><button className="secondary-btn" onClick={onExit}>Return to firm demo</button></div></header><main><div className="client-welcome"><div><p className="eyebrow">{engagement.displayType} · {engagement.fiscalYear}</p><h1>Planning Requests</h1><p>{engagement.clientName} · Requested by CF Joseph CPA PC</p></div><div className="portal-progress"><div><strong>{requests.filter(r=>r.status==="Done").length} of {requests.length}</strong><span>requests complete</span></div><div className="progress-line"><i style={{width:`${requests.filter(r=>r.status==="Done").length/requests.length*100}%`}}/></div></div></div>
    <Banner tone="info" title="Help your audit team understand your organization" text="Upload requested documents or securely grant access. Never enter accounting-system credentials into AssureAudit; QuickBooks authorization opens a simulated consent flow."/>
    <div className="request-layout"><section><div className="request-filters">{(["All","To do","Submitted","Done"] as const).map(f=><button key={f} className={statusFilter===f?"active":""} onClick={()=>setStatusFilter(f)}>{f} <i>{counts[f]}</i></button>)}</div><div className="request-list">{visibleRequests.length===0&&<div className="empty-state"><strong>No requests in this view</strong><p>Try a different filter.</p></div>}{visibleRequests.map(r=><button key={r.title} onClick={()=>openRequest(r.title)}><div className={`request-icon ${r.status==="Done"?"done":""}`}>{r.status==="Done"?<Check/>:r.type==="OAuth access consent"?<Link2/>:<FileText/>}</div><div><strong>{r.title}</strong><span>{r.type} · {r.due==="—"?"No action required":`Due ${r.due}`}</span>{r.file&&<small><Paperclip/>{r.file}</small>}</div><span className={`status-pill ${statusClass(r.status)}`}>{r.status}</span><ChevronRight/></button>)}</div></section><aside className="portal-help"><MessageSquare/><h3>Questions?</h3><p>Comment on any request and your audit team will respond here.</p><button className="secondary-btn full" onClick={()=>update({},"Message sent to Jasmine Alvarez — she typically replies within one business day")}>Message audit team</button><hr/><small>Firm reviewer</small><strong>Jasmine Alvarez</strong><span>Usually replies within one business day</span></aside></div>
    {selected&&<div className="modal-backdrop"><div className="modal request-modal"><div className="modal-head"><div><span className={`status-pill ${statusClass(selected.status)}`}>{selected.status}</span><h2>{selected.title}</h2><p>{selected.type} · Due {selected.due}</p></div><button className="icon-btn" onClick={()=>setSelectedTitle(null)}><X/></button></div><p>Please provide the requested information for the FY 2025 financial audit. Your response is visible only to your organization and the audit firm.</p>{selected.type==="Questionnaire"?<div className="client-questionnaire"><div className="question-guidance"><Info/><span><strong>Auditor question</strong>{selected.title.includes("Entity")?state.questionnairePrompt:"Describe the key transaction cycles, who performs and reviews each control, system dependencies, changes during the year, and any known control deficiencies."}</span></div><Field label="Your response" required><textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Provide the current-year facts, responsible people and supporting context…"/></Field><div className="modal-actions"><button className="secondary-btn" onClick={()=>{update({clientAnswer:answer},"Draft saved");setSelectedTitle(null)}}>Save draft</button><button className="primary-btn" disabled={!answer.trim()} onClick={()=>{setStatus(selected.title,"Client Responded");setSelectedTitle(null);update({clientAnswer:answer,questionnaireStatus:"Client Responded",completedRequests:state.completedRequests+1},"Questionnaire response sent to the audit team")}}>Submit response <Send/></button></div></div>:selected.type==="OAuth access consent"?<div className="oauth-box"><div className="connector-logo">qb</div><div><strong>QuickBooks Online</strong><span>Read-only access to Trial Balance and General Ledger for FY 2025</span></div><button className="primary-btn" onClick={()=>{setStatus(selected.title,"Submitted");setSelectedTitle(null);update({completedRequests:state.completedRequests+1},"QuickBooks consent submitted securely")}}>Review access request</button></div>:selected.status==="In Review"?<Banner tone="info" title="Firm review has started" text="Your file is locked from replacement. You can continue to add comments."/>:<div className="drop-zone"><UploadCloud/><strong>Drag and drop a file here</strong><span>or choose a file · Excel, CSV, PDF, Word up to 50 MB</span><button className="secondary-btn" onClick={()=>{setStatus(selected.title,"Submitted","Uploaded document.pdf");setSelectedTitle(null);update({completedRequests:state.completedRequests+1},"File uploaded and submitted for firm review")}}>Choose file</button></div>}<div className="comment-thread"><h3>Comments</h3>{selected.comments.length>0&&<div className="drawer-comment-list">{selected.comments.map((c,i)=><div key={i} className="drawer-comment"><strong>{c.author}</strong><p>{c.text}</p></div>)}</div>}<div className="comment-input"><div className="avatar">DC</div><input value={commentDraft} onChange={e=>setCommentDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addComment()}}} placeholder="Ask a question or add context…"/><button className="icon-btn" disabled={!commentDraft.trim()} onClick={addComment}><Send/></button></div></div></div></div>}</main></div> }

type WizardAssignment = { role: string; user: string; clientUser: string; due: string };
const CLIENT_CONTACT_ROSTER = ["Dana Collins", "Rina Morris", "Andre Price"];
const ENGAGEMENT_PHASES = ["Data ingest", "Planning workpapers", "Fieldwork", "Reporting & completion"];
function WizardToggle({checked,onChange,label}:{checked:boolean;onChange:(next:boolean)=>void;label:string}) {
  return <button type="button" className={`wizard-toggle ${checked?"on":""}`} role="switch" aria-checked={checked} aria-label={label} onClick={()=>onChange(!checked)}><i><span/></i><strong>{checked?"Yes":"No"}</strong></button>;
}
function WizardSteps({step}:{step:1|2|3}) {
  return <div className="wizard-steps">
    <div className={`wizard-step ${step===1?"active":step>1?"done":""}`}><div className="wizard-step-circle">{step>1?<Check size={15}/>:"1"}</div><div className="wizard-step-label"><strong>Engagement details</strong><span>Step 1</span></div></div>
    <div className="wizard-connector"/>
    <div className={`wizard-step ${step===2?"active":step>2?"done":""}`}><div className="wizard-step-circle">{step>2?<Check size={15}/>:"2"}</div><div className="wizard-step-label"><strong>Team & workflow</strong><span>Step 2</span></div></div>
    <div className="wizard-connector"/>
    <div className={`wizard-step ${step===3?"active":""}`}><div className="wizard-step-circle">3</div><div className="wizard-step-label"><strong>Review & create</strong><span>Step 3</span></div></div>
  </div>;
}
function NewEngagementWizard({ onClose, update }: { onClose: () => void; update: (p: Partial<DemoState>, m?: string) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [client, setClient] = useState("");
  const [engagementType, setEngagementType] = useState("Financial Audit");
  const [periodStart, setPeriodStart] = useState("2025-01-01");
  const [periodEnd, setPeriodEnd] = useState("2025-12-31");
  const [currency, setCurrency] = useState("USD");
  const [lineOfService, setLineOfService] = useState("Assurance");
  const [firmOffice, setFirmOffice] = useState("New York");
  const [priorEngagement, setPriorEngagement] = useState("No prior engagement");
  const [industry, setIndustry] = useState("Nonprofit");
  const [subIndustry, setSubIndustry] = useState(INDUSTRY_OPTIONS.Nonprofit[0]);
  const [contentPack, setContentPack] = useState(CONTENT_PACKS[0]);
  const [entityRiskLevel, setEntityRiskLevel] = useState("Normal");
  const [initialEngagement, setInitialEngagement] = useState("No");
  const [coaTemplate, setCoaTemplate] = useState(COA_TEMPLATES[0]);
  const [partner, setPartner] = useState("Oscar Owner");
  const [manager, setManager] = useState("Meera Kapoor");
  const [senior, setSenior] = useState("Jasmine Alvarez");
  const [clientLead, setClientLead] = useState("Dana Collins");
  const [clientApprover, setClientApprover] = useState("Rina Morris");
  const [enableMfa, setEnableMfa] = useState(true);
  const [autoSubmitPlanning, setAutoSubmitPlanning] = useState(false);
  const [autoSubmitPlanningDate, setAutoSubmitPlanningDate] = useState(addDays(new Date(), 28));
  const [autoSubmitFieldwork, setAutoSubmitFieldwork] = useState(false);
  const [autoSubmitFieldworkDate, setAutoSubmitFieldworkDate] = useState(addDays(new Date(), 84));
  const [archiveDate, setArchiveDate] = useState(addDays(new Date(), 180));
  const [assignments, setAssignments] = useState<WizardAssignment[]>(() => ENGAGEMENT_PHASES.map((role, i) => ({
    role, user: DEFAULT_ASSIGNEES[Math.min(i,DEFAULT_ASSIGNEES.length-1)], clientUser: CLIENT_CONTACT_ROSTER[Math.min(i,CLIENT_CONTACT_ROSTER.length-1)], due: addDays(new Date(), DEFAULT_DUE_WEEKS[Math.min(i,DEFAULT_DUE_WEEKS.length-1)] * 7),
  })));
  const setAssignment = (i: number, patch: Partial<WizardAssignment>) => setAssignments(a => a.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  const canContinue = client.trim().length > 0 && periodStart.trim().length > 0 && periodEnd.trim().length > 0 && !!industry && !!subIndustry;
  const teamReady = !!partner && !!manager && !!senior && !!clientLead && assignments.every(row=>row.user&&row.clientUser&&row.due);
  const create = () => { onClose(); update({}, `"${client}" created — this demo scopes fully wired functionality to ${engagement.clientName}.`); };
  return <div className="modal-backdrop"><div className="modal wizard-modal">
    <div className="modal-head"><div><p className="eyebrow">Engagement setup</p><h2>New engagement</h2><p>Define the audit, assign accountable teams and confirm phase deadlines.</p></div><button className="icon-btn" aria-label="Close new engagement" onClick={onClose}><X/></button></div>
    <WizardSteps step={step}/>
    {step === 1 ? <>
      <div className="wizard-grid">
        <div className="wizard-panel">
          <div className="wizard-panel-title"><span><Building2/></span><div><h3>Engagement basics</h3><p>Client, service, period and workflow.</p></div></div>
          <Field label="Client / company" required info={<InfoTip title="Client / company" text="Select the legal entity synchronized from AssurePro. Engagement-letter details remain the source of truth." standard="AssurePro client record"/>}><input value={client} onChange={e => setClient(e.target.value)} placeholder="Search or enter a client name"/></Field>
          <div className="form-grid"><Field label="Financial period start" required><input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}/></Field><Field label="Financial period end" required><input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}/></Field></div>
          <div className="form-grid"><Field label="Currency" required><select value={currency} onChange={e=>setCurrency(e.target.value)}><option>USD</option><option>CAD</option><option>GBP</option><option>EUR</option></select></Field><Field label="Firm office" required><select value={firmOffice} onChange={e=>setFirmOffice(e.target.value)}><option>New York</option><option>Binghamton</option><option>Remote</option></select></Field></div>
          <div className="form-grid"><Field label="Line of service" required><select value={lineOfService} onChange={e=>setLineOfService(e.target.value)}><option>Assurance</option><option>Review</option><option>Compilation</option></select></Field><Field label="Select workflow" required info={<InfoTip title="Select workflow" text="The workflow determines the workpaper library, approval path and downstream audit stages." standard="Firm workflow library"/>}><select value={engagementType} onChange={e => setEngagementType(e.target.value)}><option>Financial Audit</option><option>EBP Audit</option><option>Fund Audit</option><option>NFP Audit</option><option>Government Audit</option></select></Field></div>
          <Field label="Link prior engagement" info={<InfoTip title="Link prior engagement" text="Linking a prior engagement makes approved roll-forward content available as editable current-year drafts." standard="Firm roll-forward policy"/>}><select value={priorEngagement} onChange={e=>setPriorEngagement(e.target.value)}><option>No prior engagement</option><option>FY 2024 Financial Audit · Dec 31, 2024</option><option>FY 2023 Financial Audit · Dec 31, 2023</option></select></Field>
        </div>
        <div className="wizard-panel">
          <div className="wizard-panel-title"><span><SlidersHorizontal/></span><div><h3>Methodology & classification</h3><p>Templates, risk and account mapping.</p></div></div>
          <div className="form-grid industry-fields"><Field label="Industry" required><select value={industry} onChange={e=>{const next=e.target.value;setIndustry(next);setSubIndustry(INDUSTRY_OPTIONS[next][0])}}>{Object.keys(INDUSTRY_OPTIONS).map(x=><option key={x}>{x}</option>)}</select><small>Sets methodology and benchmark guidance.</small></Field><Field label="Sub-industry" required><select value={subIndustry} onChange={e=>setSubIndustry(e.target.value)}>{INDUSTRY_OPTIONS[industry].map(x=><option key={x}>{x}</option>)}</select><small>Refines templates, risks and mapping.</small></Field></div>
          <Field label="Workpapers Content Pack" info={<InfoTip title="Workpapers Content Pack" text="Content packs bundle firm methodology, questionnaires and standard workprograms for the selected workflow." standard="Firm methodology library"/>}>
            <select value={contentPack} onChange={e => setContentPack(e.target.value)}>{CONTENT_PACKS.map(p => <option key={p}>{p}</option>)}</select>
          </Field>
          <div className="form-grid"><Field label="Entity Risk Level" info={<InfoTip title="Entity Risk Level" text="Entity risk guides staffing, supervision and the persuasiveness of evidence required across the engagement." standard="Firm risk methodology"/>}><select value={entityRiskLevel} onChange={e => setEntityRiskLevel(e.target.value)}>{["Low", "Normal", "Elevated", "High"].map(l => <option key={l}>{l}</option>)}</select></Field><Field label="Initial engagement"><select value={initialEngagement} onChange={e => setInitialEngagement(e.target.value)}><option>No</option><option>Yes</option></select></Field></div>
          <Field label="Chart of Accounts" info={<InfoTip title="Chart of Accounts" text="The template maps client accounts to standard financial-statement areas during Data Ingest." standard="AssureAudit mapping policy"/>}>
            <select value={coaTemplate} onChange={e => setCoaTemplate(e.target.value)}>{COA_TEMPLATES.map(c => <option key={c}>{c}</option>)}</select>
          </Field>
          <div className="wizard-method-note"><Info/><span><strong>What happens next</strong>Data Ingest opens first. Workpapers unlock only after source data, reconciliation and preliminary materiality are complete.</span></div>
        </div>
      </div>
      <div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={!canContinue} onClick={() => setStep(2)}>Continue <ArrowRight size={16}/></button></div>
    </> : step===2 ? <>
      <div className="wizard-grid wizard-team-grid">
        <div className="wizard-panel">
          <div className="wizard-panel-title"><span><Users/></span><div><h3>Engagement team</h3><p>Assign the firm-side review hierarchy.</p></div></div>
          <Field label="Engagement partner" required><select value={partner} onChange={e=>setPartner(e.target.value)}>{TEAM_ROSTER.map(m=><option key={m.initials}>{m.name}</option>)}</select></Field>
          <Field label="Engagement manager" required><select value={manager} onChange={e=>setManager(e.target.value)}>{TEAM_ROSTER.map(m=><option key={m.initials}>{m.name}</option>)}</select></Field>
          <Field label="Audit senior / preparer" required><select value={senior} onChange={e=>setSenior(e.target.value)}>{TEAM_ROSTER.map(m=><option key={m.initials}>{m.name}</option>)}</select></Field>
          <div className="approval-preview"><span>Approval hierarchy</span><strong>{senior}</strong><ChevronRight/><strong>{manager}</strong><ChevronRight/><strong>{partner}</strong></div>
        </div>
        <div className="wizard-panel">
          <div className="wizard-panel-title"><span><ShieldCheck/></span><div><h3>Client team & security</h3><p>Set client responders and access requirements.</p></div></div>
          <Field label="Primary client contact" required><select value={clientLead} onChange={e=>setClientLead(e.target.value)}>{CLIENT_CONTACT_ROSTER.map(name=><option key={name}>{name}</option>)}</select></Field>
          <Field label="Management approver" required><select value={clientApprover} onChange={e=>setClientApprover(e.target.value)}>{CLIENT_CONTACT_ROSTER.map(name=><option key={name}>{name}</option>)}</select></Field>
          <div className="wizard-control-row"><span><strong>Require MFA</strong><small>Applies to invited client users.</small></span><WizardToggle checked={enableMfa} onChange={setEnableMfa} label="Require multi-factor authentication"/></div>
        </div>
      </div>
      <div className="wizard-panel wizard-automation-panel">
        <div className="wizard-panel-title"><span><Clock3/></span><div><h3>Automation & retention</h3><p>Optional submission controls and required archive date.</p></div></div>
        <div className="wizard-automation-grid"><div className="wizard-control-row"><span><strong>Auto-submit Planning<InfoTip title="Auto-submit Planning" text="Applies only to engagements that use Ingest to collect client data. For Collaborate-only engagements (file-sharing with the client, no Ingest module), leave this toggled to No. For Ingest engagements, the date below sets Step 1 of Ingest and notifies the client on your behalf to upload their data on that date — this is how the client gets set up." standard="Ingest handoff policy"/></strong><small>Submit when all Planning gates pass.</small></span><WizardToggle checked={autoSubmitPlanning} onChange={setAutoSubmitPlanning} label="Auto-submit Planning"/></div><Field label="Planning submission date"><input type="date" disabled={!autoSubmitPlanning} value={autoSubmitPlanningDate} onChange={e=>setAutoSubmitPlanningDate(e.target.value)}/></Field><div className="wizard-control-row"><span><strong>Auto-submit Fieldwork<InfoTip title="Auto-submit Fieldwork" text="Applies only to engagements that use Ingest to collect client data. For Collaborate-only engagements (file-sharing with the client, no Ingest module), leave this toggled to No. For Ingest engagements, the date below sets Step 1 of Ingest and notifies the client on your behalf to upload their data on that date." standard="Ingest handoff policy"/></strong><small>Submit when all Fieldwork gates pass.</small></span><WizardToggle checked={autoSubmitFieldwork} onChange={setAutoSubmitFieldwork} label="Auto-submit Fieldwork"/></div><Field label="Fieldwork submission date"><input type="date" disabled={!autoSubmitFieldwork} value={autoSubmitFieldworkDate} onChange={e=>setAutoSubmitFieldworkDate(e.target.value)}/></Field><div className="wizard-retention-copy"><small>Required retention milestone for the engagement file.</small></div><Field label="Archive date" required><input type="date" value={archiveDate} onChange={e=>setArchiveDate(e.target.value)}/></Field></div>
      </div>
      <div className="wizard-panel wizard-phase-panel">
        <div className="wizard-panel-title"><span><ListChecks/></span><div><h3>Assign engagement phases</h3><p>Set the accountable firm owner, client contact and due date for each stage.</p></div></div>
        <div className="table-card"><table className="accountability-table phase-assignment-table"><thead><tr><th>Phase</th><th>Firm owner</th><th>Client owner</th><th>Due date</th></tr></thead><tbody>{assignments.map((row,i)=><tr key={row.role}><td><strong>{i+1}</strong><span>{row.role}</span></td><td><select aria-label={`${row.role} firm owner`} value={row.user} onChange={e=>setAssignment(i,{user:e.target.value})}>{TEAM_ROSTER.map(m=><option key={m.initials} value={m.name}>{m.name}</option>)}</select></td><td><select aria-label={`${row.role} client owner`} value={row.clientUser} onChange={e=>setAssignment(i,{clientUser:e.target.value})}>{CLIENT_CONTACT_ROSTER.map(name=><option key={name}>{name}</option>)}</select></td><td><input aria-label={`${row.role} due date`} type="date" value={row.due} onChange={e=>setAssignment(i,{due:e.target.value})}/></td></tr>)}</tbody></table></div>
      </div>
      <div className="modal-actions"><button className="secondary-btn" onClick={()=>setStep(1)}>Back</button><button className="primary-btn" disabled={!teamReady||!archiveDate} onClick={()=>setStep(3)}>Review engagement <ArrowRight size={16}/></button></div>
    </> : <>
      <div className="review-summary-grid">
        <div className="review-summary-block">
          <h3>Engagement details</h3>
          <div className="review-row"><span>Client</span><strong>{client}</strong></div>
          <div className="review-row"><span>Service</span><strong>{lineOfService}</strong></div>
          <div className="review-row"><span>Workflow</span><strong>{engagementType}</strong></div>
          <div className="review-row"><span>Financial period</span><strong>{periodStart} — {periodEnd} ({currency})</strong></div>
          <div className="review-row"><span>Firm office</span><strong>{firmOffice}</strong></div>
          <div className="review-row"><span>Prior engagement</span><strong>{priorEngagement}</strong></div>
          <div className="review-row"><span>Industry</span><strong>{industry}</strong></div>
          <div className="review-row"><span>Sub-industry</span><strong>{subIndustry}</strong></div>
          <div className="review-row"><span>Workpapers Content Pack</span><strong>{contentPack}</strong></div>
          <div className="review-row"><span>Entity Risk Level</span><strong>{entityRiskLevel}</strong></div>
          <div className="review-row"><span>Initial Engagement</span><strong>{initialEngagement}</strong></div>
          <div className="review-row"><span>Chart of Accounts</span><strong>{coaTemplate}</strong></div>
        </div>
        <div className="review-summary-block">
          <h3>People, security & automation</h3>
          <div className="review-row"><span>Firm hierarchy</span><strong>{senior} → {manager} → {partner}</strong></div>
          <div className="review-row"><span>Client contacts</span><strong>{clientLead} · {clientApprover}</strong></div>
          <div className="review-row"><span>Client MFA</span><strong>{enableMfa?"Required":"Not required"}</strong></div>
          <div className="review-row"><span>Auto-submit Planning</span><strong>{autoSubmitPlanning?autoSubmitPlanningDate:"Off"}</strong></div>
          <div className="review-row"><span>Auto-submit Fieldwork</span><strong>{autoSubmitFieldwork?autoSubmitFieldworkDate:"Off"}</strong></div>
          <div className="review-row"><span>Archive date</span><strong>{archiveDate}</strong></div>
        </div>
      </div>
      <div className="review-summary-block review-phases"><h3>Phase ownership & due dates</h3>{assignments.map(row=><div className="review-row" key={row.role}><span>{row.role}</span><strong>{row.user} · {row.clientUser} · {row.due}</strong></div>)}</div>
      <Banner tone="info" title="Data Ingest will open first" text="The new engagement starts with source collection, validation, account mapping, reconciliation and materiality. Workpapers unlock after the ingest handoff is complete."/>
      <div className="modal-actions"><button className="secondary-btn" onClick={() => setStep(2)}>Back</button><button className="primary-btn" onClick={create}><CheckCircle2/>Create engagement</button></div>
    </>}
  </div></div>;
}
// Reusable red/amber/green status-count badge row — always driven by phaseStatusCounts(state),
// never hardcoded, so it can't drift from getPhases() as the underlying engagement state changes.
function StatusCountBadges({ complete, inProgress, attention, compact }: { complete: number; inProgress: number; attention: number; compact?: boolean }) {
  return <div className={`status-count-badges ${compact ? "compact" : ""}`}>
    <span className="count-dot red" title={`${attention} needs attention`}><i/>{attention}{!compact && " needs attention"}</span>
    <span className="count-dot amber" title={`${inProgress} in progress`}><i/>{inProgress}{!compact && " in progress"}</span>
    <span className="count-dot green" title={`${complete} complete`}><i/>{complete}{!compact && " complete"}</span>
  </div>;
}
function ReopenModal({update,close}:{update:(p:Partial<DemoState>,m?:string)=>void;close:()=>void}) { const [reason,setReason]=useState(""); const [confirm,setConfirm]=useState(false); return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><span className="status-pill danger">High-impact action</span><h2>Reopen Planning?</h2><p>Earlier approvals remain in history, but affected conclusions become editable.</p></div><button className="icon-btn" onClick={close}><X/></button></div><Banner tone="danger" title="8 Fieldwork workpapers will require re-review" text="3 workpapers reference Materiality v1 and 5 reference risk-register variables."/><Field label="Reason for reopening" required><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Describe the issue discovered in Fieldwork…"/></Field><label className="checkbox-row"><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/><span>I understand that downstream workpapers will be flagged for re-review.</span></label><div className="modal-actions"><button className="secondary-btn" onClick={close}>Cancel</button><button className="danger-btn" disabled={!reason||!confirm} onClick={()=>{update({reopened:true,locked:false,managerApproved:false,partnerApproved:false,planningStatus:"Reopened"},"Planning reopened; 8 workpapers flagged for re-review");close()}}>Confirm reopen</button></div></div></div> }

function statusClass(s:string){ if(["Complete","Approved","Done","Validated","Resolved"].includes(s))return"approved";if(["Needs Attention","In Progress","In Review","Clarification Needed","Review","Client Responded","Investigate"].includes(s))return s==="In Progress"||s==="Client Responded"?"progress":"warning";if(["Access Not Granted","Returned","Stale","Declined"].includes(s))return"danger";if(s==="Sent to Client")return"progress";return"neutral" }
function Metric({label,value,detail}:{label:string;value:string;detail:string}){return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>}
function Banner({tone,title,text,action,onAction}:{tone:string;title:string;text:string;action?:string;onAction?:()=>void}){return <div className={`banner ${tone}`}>{tone==="danger"?<AlertCircle/>:tone==="warning"?<AlertTriangle/>:tone==="success"?<CheckCircle2/>:<Info/>}<div><strong>{title}</strong><span>{text}</span></div>{action&&<button onClick={onAction}>{action}<ArrowRight/></button>}</div>}
function Field({label,required,info,children}:{label:string;required?:boolean;info?:React.ReactNode;children:React.ReactNode}){return <label className="field"><span className="field-label">{label}{required&&<em>*</em>}{info}</span>{children}</label>}
function FormSection({title,subtitle,children,update}:{title:string;subtitle:string;children:React.ReactNode;update?:(p:Partial<DemoState>,m?:string)=>void}){return <section className="form-section"><div className="section-title"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-btn" onClick={()=>update?.({},`More options for "${title}" (history, print, and export)`)}><MoreHorizontal/></button></div>{children}</section>}
function MaterialityCardTitle({title,help,standard}:{title:string;help:string;standard:string}){return <div className="materiality-card-title"><h2>{title}</h2><InfoTip title={title} text={help} standard={standard}/></div>}
function InfoTip({title,text,standard}:{title:string;text:string;standard:string}){return <span className="info-tip" tabIndex={0} aria-label={`${title}. ${text} Reference: ${standard}`}><Info aria-hidden="true"/><span className="info-popover" role="tooltip"><strong>Audit perspective</strong><p>{text}</p><small>{standard}</small></span></span>}
function StickyActions({update,onComplete,completed}:{update:(p:Partial<DemoState>,m?:string)=>void;onComplete?:()=>void;completed?:boolean}){return <div className="sticky-action-bar"><span><Check size={16}/>Autosaved just now</span><button className="secondary-btn" onClick={()=>update({},"Draft saved")}>Save draft</button><button className="primary-btn" disabled={!!completed} onClick={()=>onComplete?onComplete():update({},"Step completed and saved to the audit trail")}>{completed?<><Check size={16}/>Completed</>:"Complete step"}</button></div>}
function CheckRow({title,detail,checked=false}:{title:string;detail:string;checked?:boolean}){const [on,setOn]=useState(checked);return <label className="check-row"><input type="checkbox" checked={on} onChange={e=>setOn(e.target.checked)}/><i>{on&&<Check/>}</i><span><strong>{title}</strong><small>{detail}</small></span>{on&&<span className="status-pill approved">Complete</span>}</label>}
function Member({name,role,status,update}:{name:string;role:string;status:string;update?:(p:Partial<DemoState>,m?:string)=>void}){return <div className="member-row"><div className="person-avatar violet">{name.split(" ").map(n=>n[0]).join("")}</div><div><strong>{name}</strong><span>{role}</span></div><span className={`status-pill ${status==="Confirmed"?"approved":"warning"}`}>{status}</span>{status==="Pending"&&<button className="secondary-btn" onClick={()=>update?.({},`Independence confirmation reminder sent to ${name}`)}>Send reminder</button>}</div>}
function UploadCard({title,file,rows,status,progress,onUpload,update}:{title:string;file:string;rows:string;status:string;progress:number;onUpload:()=>void;update:(p:Partial<DemoState>,m?:string)=>void}){
  const [menuOpen,setMenuOpen]=useState(false);
  const menuRef=useDismiss(menuOpen,()=>setMenuOpen(false));
  return <div className="upload-card"><div className="upload-title"><div className="file-icon"><FileSpreadsheet/></div><div><span className="card-label">Data source</span><h3>{title}</h3></div><span className="status-pill approved">{status}</span></div><div className="file-detail"><FileCheck2/><div><strong>{file}</strong><span>{rows} · Excel/CSV · FY 2025</span></div><div className="topbar-popover" ref={menuRef}><button className="icon-btn" onClick={()=>setMenuOpen(!menuOpen)}><MoreHorizontal/></button>{menuOpen && <div className="dropdown-menu file-menu"><button className="dropdown-item" onClick={()=>{setMenuOpen(false);onUpload();update({},`${file} replacement started`)}}><UploadCloud size={14}/><span>Replace file</span></button><button className="dropdown-item danger-item" onClick={()=>{setMenuOpen(false);update({},`${file} removed from this engagement (simulated)`)}}><X size={14}/><span>Remove</span></button></div>}</div></div><div className="upload-progress"><i style={{width:`${progress}%`}}/></div><div className="upload-actions"><button className="text-link" onClick={()=>update({},`${title} import template downloaded`)}><Download/>Download template</button><button className="secondary-btn" onClick={onUpload}><UploadCloud/>Replace file</button></div></div>}
function Question({number,title,tag,children}:{number:string;title:string;tag:string;children:React.ReactNode}){return <article className="question"><div className="question-head"><span>{number}</span><h3>{title}</h3><span className={`status-pill ${statusClass(tag)}`}>{tag}</span></div>{children}</article>}
function Evidence({file="Accounting Policy Handbook.pdf",pages="4–7",update}:{file?:string;pages?:string;update?:(p:Partial<DemoState>,m?:string)=>void}){return <div className="evidence"><Paperclip/><span><strong>Source evidence</strong>{file} · Pages {pages}</span><button onClick={()=>update?.({},`Opening ${file} (pages ${pages}) — simulated document viewer`)}>Open source <ArrowRight/></button></div>}
function AiDraft(){return <div className="ai-draft"><Sparkles/><span><strong>AI-assisted draft</strong>Generated from cited evidence · Human validation required</span></div>}
function ControlCard({title,reliance,risk,update}:{title:string;reliance:string;risk:string;update?:(p:Partial<DemoState>,m?:string)=>void}){return <div className="control-card"><div><ShieldCheck/><span><strong>{title}</strong><small>Walkthrough complete</small></span></div><span>Planned reliance <b>{reliance}</b></span><span>Control risk <b>{risk}</b></span><button className="text-link" onClick={()=>update?.({},`Opening the "${title}" control record — walkthrough and reliance conclusion`)}>View control <ArrowRight/></button></div>}
function ProcessNode({icon,title,detail}:{icon:React.ReactNode;title:string;detail:string}){return <div className="process-node">{icon}<strong>{title}</strong><span>{detail}</span></div>}
function MailIcon(){return <FileText/>}
function RiskFactor({title,level,text}:{title:string;level:string;text:string}){return <div className="risk-factor"><div><span>{title}</span><span className={`risk-badge ${level.toLowerCase()}`}>{level}</span></div><p>{text}</p></div>}
function Insight({tone,title,text}:{tone:string;title:string;text:string}){return <div className={`insight ${tone}`}><i/ ><div><strong>{title}</strong><span>{text}</span></div><ChevronRight/></div>}
function InfoBlock({label,text}:{label:string;text:string}){return <div className="info-block"><span>{label}</span><p>{text}</p></div>}
function TimelineBar({label,start,width,color}:{label:string;start:string;width:string;color:string}){return <div className="timeline-row"><span>{label}</span><div><i style={{marginLeft:start,width,background:color}}/></div></div>}
function GuideItem({title,text}:{title:string;text:string}){return <div className="guide-item"><strong>{title}</strong><p>{text}</p></div>}
function EmptyIcon({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="empty-state">{icon}<strong>{title}</strong><p>{text}</p></div>}
function DrawerNote({title,author,status}:{title:string;author:string;status:string}){return <div className="drawer-note"><div><strong>{title}</strong><span>{author} · 36 min ago</span></div><span className={`status-pill ${status==="Open"?"warning":"approved"}`}>{status}</span></div>}
function ActivityItem({title,detail}:{title:string;detail:string}){return <div className="activity-item"><i/><div><strong>{title}</strong><span>{detail}</span></div></div>}
function DrawerFile({name,meta,update}:{name:string;meta:string;update?:(p:Partial<DemoState>,m?:string)=>void}){
  const [menuOpen,setMenuOpen]=useState(false);
  const menuRef=useDismiss(menuOpen,()=>setMenuOpen(false));
  return <div className="drawer-file"><FileText/><div><strong>{name}</strong><span>{meta}</span></div><div className="topbar-popover" ref={menuRef}><button className="icon-btn" onClick={()=>setMenuOpen(!menuOpen)}><MoreHorizontal/></button>{menuOpen&&<div className="dropdown-menu file-menu"><button className="dropdown-item" onClick={()=>{setMenuOpen(false);update?.({},`${name} downloaded`)}}><Download size={14}/><span>Download</span></button><button className="dropdown-item danger-item" onClick={()=>{setMenuOpen(false);update?.({},`${name} removed from Attachments (simulated)`)}}><X size={14}/><span>Remove</span></button></div>}</div></div>}
function heatClass(cell:string){const [l,m]=cell.split("-");if(l==="High"&&m==="High")return"critical";if(l==="High"||m==="High")return"high-cell";if(l==="Moderate"||m==="Moderate")return"medium-cell";return"low-cell"}
