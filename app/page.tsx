"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Bell,
  BookOpen, BriefcaseBusiness, Building2, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, Circle, ClipboardCheck, Clock3,
  Cloud, Database, Download, FileCheck2, FileSpreadsheet, FileText, Filter,
  FolderOpen, Gauge, History, Home as HomeIcon, Info, LayoutDashboard, Link2, ListChecks,
  LockKeyhole, Menu, MessageSquare, MoreHorizontal, Paperclip, Pencil, Plus,
  RefreshCw, RotateCcw, Search, Send, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, Table2, UploadCloud, UserRound, Users, X, Zap
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
type EngagementTeamRole = "Junior" | "Senior" | "Manager" | "Engagement Leader" | "Engagement Quality Reviewer";
type TeamMember = { id: string; name: string; initials: string; email: string; role: EngagementTeamRole; specialty?: string; status: "Active" | "Pending" | "Guest" };
type ClientContact = { name: string; email: string; role: string; lastLogin: string; twoFA: boolean };

type DemoState = {
  role: Role;
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
  viewYear: number;
  teamMembers: TeamMember[];
  clientContacts: ClientContact[];
  archiveDate: string;
  notifyDaily: boolean;
  twoFactorEnabled: boolean;
  auditLog: { time: string; actor: string; action: string }[];
};

const defaultState: DemoState = {
  role: "Auditor / Preparer", connector: "Connected", controlTotals: "Pass", mapped: 96,
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
  viewYear: 2025,
  teamMembers: [
    { id: "JA", name: "Jasmine Alvarez", initials: "JA", email: "jasmine.alvarez@cfjosephcpa.com", role: "Senior", status: "Active" },
    { id: "MK", name: "Meera Kapoor", initials: "MK", email: "meera.kapoor@cfjosephcpa.com", role: "Manager", status: "Active" },
    { id: "OO", name: "Oscar Owner", initials: "OO", email: "oscar.owner@cfjosephcpa.com", role: "Engagement Leader", status: "Active" },
    { id: "LC", name: "Leo Chen", initials: "LC", email: "leo.chen@cfjosephcpa.com", role: "Senior", specialty: "Tax specialist", status: "Pending" },
  ],
  clientContacts: [
    { name: "Dana Collins", email: "dana.collins@riversideyfs.org", role: "Controller", lastLogin: "2 days ago", twoFA: true },
  ],
  archiveDate: "2026-06-30",
  notifyDaily: true,
  twoFactorEnabled: false,
  auditLog: [],
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
  const materialityOverall = state.materialityOverride ? 240000 : state.benchmark * (state.materialityPct / 100);
  const materialityReady = !state.materialityOverride || !!state.materialityRationale;
  const dataDone = state.controlTotals !== "Fail" && state.mapped >= 100;
  const foundationDone = acceptanceReady(state) && state.independenceOutstanding === 0;
  const publishBlockers = (state.controlTotals === "Fail" ? 1 : 0) + (state.responseGap ? 1 : 0) + (state.mapped < 100 ? 1 : 0) + (declined ? 1 : 0);
  const phases = [
    { title: "Engagement Foundation", status: (declined ? "Declined" : foundationDone ? "Complete" : "In Progress") as StepState, route: "setup", detail: declined ? "Engagement declined — planning does not proceed" : foundationDone ? "4 of 4 steps complete" : !acceptanceReady(state) ? "Safeguards rationale required before proceeding" : `3 of 4 steps complete · ${state.independenceOutstanding} independence confirmation${state.independenceOutstanding === 1 ? "" : "s"} outstanding` },
    { title: "Data Foundation", status: (declined ? "Not Started" : dataDone ? "Complete" : "Needs Attention") as StepState, route: "data", detail: declined ? "Blocked — engagement was declined" : state.controlTotals === "Fail" ? "Control totals do not balance" : dataDone ? "All accounts mapped" : "4 accounts need review" },
    { title: "Entity & Controls", status: (declined ? "Not Started" : state.questionnaireStatus === "Validated" ? "Complete" : "In Progress") as StepState, route: "entity-controls", detail: declined ? "Blocked — engagement was declined" : state.questionnaireStatus === "Validated" ? "11 of 11 areas validated" : "7 of 11 areas validated" },
    { title: "Materiality", status: (declined ? "Not Started" : materialityReady ? "Complete" : "Needs Attention") as StepState, route: "materiality", detail: declined ? "Blocked — engagement was declined" : materialityReady ? `${money(materialityOverall)} overall` : "Override rationale required" },
    { title: "Risk Assessment", status: (declined ? "Not Started" : allRisksCovered ? "Complete" : "In Progress") as StepState, route: "risks", detail: declined ? "Blocked — engagement was declined" : `${riskList.length} risks • ${highRiskCount} high` },
    { title: "Audit Response", status: (declined ? "Not Started" : state.responseGap ? "Needs Attention" : "Complete") as StepState, route: "responses", detail: declined ? "Blocked — engagement was declined" : state.responseGap ? "1 risk needs coverage" : "All risks covered" },
    { title: "Publish & Approval", status: (declined ? "Not Started" : state.locked ? "Locked" : publishBlockers > 0 ? "Not Started" : "In Progress") as StepState, route: "publish", detail: declined ? "Blocked — engagement declined; cannot be published" : state.locked ? "Approved and locked" : `${publishBlockers} checks remaining` },
  ];
  // Reopening flags the downstream phases stale everywhere (sidebar, dashboard stepper, review),
  // so this must live here rather than as a one-off override in any single consumer.
  const staleRoutes = ["materiality", "risks", "responses", "publish"];
  return state.reopened ? phases.map(p => staleRoutes.includes(p.route) ? { ...p, status: "Stale" as StepState, detail: "Reopened — requires re-review after the upstream change" } : p) : phases;
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

// Single source of truth for "% of risks with a responsive procedure" — surfaced on Risk
// Assessment, Audit Response, the Publish preview and the Review roll-up; must never disagree.
function responseCoveragePct(state: DemoState) {
  const riskList = allRisks(state);
  const coveredCount = riskList.filter(r => !r.response.includes("Needs")).length;
  return riskList.length ? Math.round((coveredCount / riskList.length) * 100) : 100;
}

// Routes the "Needs attention" rail's real attentionItems() text to the phase that resolves it.
function attentionItemRoute(item: string) {
  if (item.includes("response gap")) return "responses";
  if (item.includes("mapping review") || item.includes("Control totals") || item.includes("flagged for investigation")) return "data";
  if (item.includes("client request")) return "entity-controls";
  return "setup";
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

export default function Home() {
  const [state, setState] = useState<DemoState>(defaultState);
  const [path, setPath] = useState("/dashboard");
  const [drawer, setDrawer] = useState("Guide");
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  const update = (patch: Partial<DemoState>, message?: string) => {
    setState(s => ({
      ...s, ...patch,
      ...(message ? { auditLog: [{ time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }), actor: "Oscar Owner", action: message }, ...s.auditLog].slice(0, 200) } : {}),
    }));
    if (message) setToast(message);
  };
  const isClient = state.role === "Client Contact";

  if (isClient || path.startsWith("/client-portal")) {
    return <ClientPortal state={state} update={update} onExit={() => { update({ role: "Auditor / Preparer" }); navigate("/dashboard"); }} />;
  }

  const planning = path.includes("/planning");
  return (
    <div className="app-shell">
      <Sidebar path={path} navigate={navigate} state={state} update={update} mobileNav={mobileNav} setMobileNav={setMobileNav} />
      <main className="main-area">
        <Topbar state={state} update={update} navigate={navigate} onMenu={() => setMobileNav(!mobileNav)} demoOpen={demoOpen} setDemoOpen={setDemoOpen} />
        {planning ? (
          <PlanningShell path={path} navigate={navigate} state={state} update={update} drawer={drawer} setDrawer={setDrawer} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} demoOpen={demoOpen} setDemoOpen={setDemoOpen} />
        ) : path === "/my-work" ? <MyWork navigate={navigate} state={state} /> : path === "/engagements" ? <Engagements navigate={navigate} update={update} state={state} /> : path === "/firm-audit-log" ? <FirmAuditLog state={state} update={update} /> : path.startsWith("/engagement/") ? <EngagementHome navigate={navigate} state={state} update={update} /> : <Dashboard navigate={navigate} state={state} update={update} />}
      </main>
      {demoOpen && <DemoControls state={state} update={update} close={() => setDemoOpen(false)}/>}
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function Sidebar({ path, navigate, state, update, mobileNav, setMobileNav }: { path: string; navigate: (p: string) => void; state: DemoState; update: (p: Partial<DemoState>, m?: string) => void; mobileNav: boolean; setMobileNav: (v: boolean) => void }) {
  const inEngagement=path.startsWith("/engagement/"); const inPlanning=path.includes("/planning"); const active=path.split("/").pop()||"overview"; const branchLabels=["Commence","Data ingest","Understand","Materiality","Identify & assess","Respond","Approve"]; const phases=getPhases(state);
  return <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`} style={{transform: mobileNav ? "none" : undefined}}>
    <div className="brand"><div className="brand-mark">A</div><div><strong>assure</strong><span>audit</span></div><button className="icon-btn close-mobile" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
    <nav>
      <button className={`nav-item ${path === "/dashboard" ? "active" : ""}`} onClick={() => navigate("/dashboard")}><LayoutDashboard/><span>Dashboard</span></button>
      <button className={`nav-item ${path === "/engagements" ? "active" : ""}`} onClick={() => navigate("/engagements")}><BriefcaseBusiness/><span>Engagements</span></button>
      <button className={`nav-item ${path === "/my-work" ? "active" : ""}`} onClick={() => navigate("/my-work")}><ClipboardCheck/><span>My work</span><span className="nav-count">{attentionItems(state).length}</span></button>
      {inEngagement&&<><p className="nav-label branch-label">Current engagement</p><button className="engagement-branch" onClick={()=>navigate("/engagement/bbawc")}><span className="avatar square">25</span><span><strong>FY 2025 engagement</strong><small>Period end · Dec 31</small></span><ChevronDown/></button><div className="branch-progress" title={`Planning ${planningProgressPct(state)}% complete`}><i style={{width:`${100-planningProgressPct(state)}%`}}/></div><div className="nav-branch"><button className={!inPlanning?"active":""} onClick={()=>navigate("/engagement/bbawc")}><HomeIcon/><span>Overview</span></button><button className={`branch-parent ${inPlanning?"active":""}`} onClick={()=>navigate("/engagement/bbawc/planning")}><ClipboardCheck/><span>Planning</span><ChevronDown/></button>{inPlanning&&<div className="branch-children"><button className={active==="planning"?"active":""} onClick={()=>navigate("/engagement/bbawc/planning")}><i/><span>Overview</span><b>{planningProgressPct(state)}%</b></button>{phases.map((phase,i)=><button key={phase.route} className={active===phase.route?"active":""} onClick={()=>navigate(`/engagement/bbawc/planning/${phase.route}`)}><i className={statusClass(phase.status)}/><span>{branchLabels[i]}</span></button>)}<button className={active==="review"?"active":""} onClick={()=>navigate("/engagement/bbawc/planning/review")}><i/><span>Review & approval</span></button><button className={active==="audit-trail"?"active":""} onClick={()=>navigate("/engagement/bbawc/planning/audit-trail")}><i/><span>Audit trail</span></button></div>}<button onClick={()=>{if(state.locked){navigate("/engagement/bbawc")}else{update({},"Fieldwork unlocks once Planning is Approved & Locked.")}}}><Search/><span>Fieldwork</span><LockKeyhole className="branch-lock"/></button><button onClick={()=>update({},"Reporting becomes available after Fieldwork. It is out of scope for this Planning demo.")}><FileCheck2/><span>Reporting</span></button><button onClick={()=>{navigate("/engagement/bbawc/planning/data");update({},"Documents live in Data Foundation — showing the Trial Balance, General Ledger and client uploads")}}><FolderOpen/><span>Documents</span></button></div></>}
      <p className="nav-label practice">Practice</p><button className={`nav-item ${path==="/engagements"?"active":""}`} onClick={()=>navigate("/engagements")}><Users/><span>Clients</span></button><button className={`nav-item ${path==="/firm-audit-log"?"active":""}`} onClick={()=>navigate("/firm-audit-log")}><History/><span>Firm audit log</span></button>
    </nav>
    <div className="profile"><div className="avatar">OO</div><div><strong>Oscar Owner</strong><span>Baldeep Singh Chhabra · Partner</span></div></div>
  </aside>;
}

function Topbar({ state, update, navigate, onMenu, demoOpen, setDemoOpen }: { state: DemoState; update: (p: Partial<DemoState>, m?: string) => void; navigate: (p: string) => void; onMenu: () => void; demoOpen: boolean; setDemoOpen: (v: boolean) => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const currentCalendarYear = new Date().getFullYear();
  const latestFiscalYear = Math.max(currentCalendarYear, 2025);
  const fiscalYears = Array.from({ length: latestFiscalYear - 2023 + 1 }, (_, i) => latestFiscalYear - i);
  const items = attentionItems(state);
  return <><header className="topbar">
    <button className="icon-btn hamburger" onClick={onMenu}><Menu size={20}/></button>
    <div className="top-actions">
      <button className={`outline-action ${state.connector === "Expired" ? "danger-outline" : ""}`} onClick={() => update({ connector: "Connected" }, state.connector === "Connected" ? "QuickBooks connection tested successfully" : "QuickBooks reconnected safely")}><ShieldCheck size={16}/>{state.connector === "Connected" ? "QuickBooks connected" : "Reconnect QuickBooks"}</button>
      <div className="topbar-popover">
        <button className="year-select" aria-expanded={yearOpen} onClick={() => { setYearOpen(!yearOpen); setNotifOpen(false); setProfileOpen(false); }}><CalendarDays size={16}/><span>FY {state.viewYear}</span><ChevronDown size={14}/></button>
        {yearOpen && <div className="dropdown-menu year-menu">
          <div className="dropdown-head"><strong>Fiscal year</strong></div>
          {fiscalYears.map(y => <button key={y} className="dropdown-item" onClick={() => { setYearOpen(false); update({ viewYear: y }, y === 2025 ? "Back to FY 2025" : `Viewing FY ${y} — no engagements on record for this period`); }}><CalendarDays size={14}/><span>FY {y}{y === currentCalendarYear ? " · Current" : ""}</span>{y === state.viewYear && <Check size={14}/>}</button>)}
        </div>}
      </div>
      <div className="topbar-popover">
        <button className="icon-btn notification" aria-expanded={notifOpen} onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); setYearOpen(false); }}><Bell size={18}/>{items.length > 0 && <i/>}</button>
        {notifOpen && <div className="dropdown-menu notif-menu">
          <div className="dropdown-head"><strong>Notifications</strong><span>{items.length} open item{items.length === 1 ? "" : "s"}</span></div>
          {items.length === 0 ? <div className="dropdown-empty">Nothing needs attention right now.</div> : items.map((it, i) => <button key={i} className="dropdown-item" onClick={() => { setNotifOpen(false); navigate("/engagement/bbawc/planning"); }}><AlertCircle size={14}/><span>{it}</span></button>)}
        </div>}
      </div>
      <div className="topbar-popover">
        <button className="avatar" aria-label="Open user profile" aria-expanded={profileOpen} title={state.role} onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setYearOpen(false); }}>OO</button>
        {profileOpen && <div className="dropdown-menu profile-menu">
          <div className="dropdown-head"><strong>Oscar Owner</strong><span>Viewing as {state.role}</span></div>
          <button className="dropdown-item" onClick={() => { setProfileOpen(false); setAccountOpen(true); }}><UserRound size={14}/><span>My account</span></button>
          <button className="dropdown-item" onClick={() => { setProfileOpen(false); setDemoOpen(!demoOpen); }}><SlidersHorizontal size={14}/><span>Switch role</span></button>
          <button className="dropdown-item" onClick={() => { setProfileOpen(false); update({}, "Signed out (simulated) — this is a demo, no session was ended"); }}><LockKeyhole size={14}/><span>Sign out</span></button>
        </div>}
      </div>
    </div>
  </header>
  {accountOpen && <MyAccountModal state={state} update={update} close={() => setAccountOpen(false)}/>}
  </>;
}

function MyWork({ navigate, state }: { navigate:(p:string)=>void; state:DemoState }) {
  const [filter,setFilter]=useState<"My priorities"|"Due soon"|"In review"|"All">("My priorities");
  const tasks=[
    {title:"Complete independence confirmations",area:"Commence · Independence",status:"Due today",tone:"danger",due:"Today",progress:85,route:"setup",priority:1,review:false},
    {title:"Resolve audit-plan response gap",area:"Respond · Audit plan",status:"Needs attention",tone:"danger",due:"Aug 18",progress:58,route:"responses",priority:1,review:false},
    {title:"Review risk assessment",area:"Identify & assess · Risk assessment",status:"In review",tone:"warning",due:"Aug 16",progress:78,route:"risks",priority:2,review:true},
    {title:"Validate entity understanding",area:"Understand · Client response",status:"In progress",tone:"progress",due:"Aug 14",progress:70,route:"entity-controls",priority:2,review:false},
    {title:"Review account mapping exceptions",area:"Data ingest · Trial balance",status:"4 exceptions",tone:"warning",due:"Aug 13",progress:96,route:"data",priority:2,review:false},
    {title:"Approve planning communications",area:"Approve · Communications",status:"Not started",tone:"neutral",due:"Aug 20",progress:0,route:"publish",priority:3,review:true},
  ];
  const visible=tasks.filter(t=>filter==="All"||filter==="My priorities"&&t.priority<=2||filter==="Due soon"&&["Today","Aug 13","Aug 14"].includes(t.due)||filter==="In review"&&t.review);
  const next=visible[0];
  return <div className="page my-work-page"><div className="page-heading"><div><p className="eyebrow">Personal workspace</p><h1>My work</h1><p>Only the work that needs your action, ordered by urgency.</p></div><div className="my-work-summary"><span><strong>{tasks.filter(t=>t.priority===1).length}</strong> urgent</span><span><strong>{tasks.filter(t=>t.review).length}</strong> to review</span></div></div>
    {next&&<section className="my-work-next"><div className="next-work-icon"><Zap/></div><div><span>Start here</span><h2>{next.title}</h2><p>{engagement.shortName} · {next.area} · Due {next.due.toLowerCase()}</p></div><div className="next-work-progress"><strong>{next.progress}%</strong><i><em style={{width:`${next.progress}%`}}/></i></div><button className="primary-btn" onClick={()=>navigate(`/engagement/bbawc/planning/${next.route}`)}>Open task <ArrowRight/></button></section>}
    <div className="my-work-toolbar"><div className="my-work-filters">{(["My priorities","Due soon","In review","All"] as const).map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f}{f==="My priorities"&&<span>{tasks.filter(t=>t.priority<=2).length}</span>}</button>)}</div><span>{visible.length} task{visible.length===1?"":"s"}</span></div>
    <section className="work-queue">{visible.map(task=><button key={task.title} className="work-queue-row" onClick={()=>navigate(`/engagement/bbawc/planning/${task.route}`)}><span className={`queue-signal ${task.tone}`}>{task.tone==="danger"?<AlertCircle/>:task.review?<ClipboardCheck/>:<Clock3/>}</span><span className="queue-title"><strong>{task.title}</strong><small>{engagement.shortName} · {task.area}</small></span><span className="queue-progress"><small>Progress</small><i><em style={{width:`${task.progress}%`}}/></i><b>{task.progress}%</b></span><span className={`status-pill ${task.tone}`}>{task.status}</span><span className="queue-due"><small>Due</small><strong>{task.due}</strong></span><ChevronRight/></button>)}{visible.length===0&&<div className="work-empty"><CheckCircle2/><h3>No work in this view</h3><p>Choose another filter to see assigned tasks.</p></div>}</section>
  </div>;
}

function Dashboard({ navigate, state, update }: { navigate: (p: string) => void; state: DemoState; update: (p: Partial<DemoState>, m?: string) => void }) {
  const pct=planningProgressPct(state); const next=nextOpenPhase(state); const items=attentionItems(state); const declined=state.acceptanceDecision==="decline";
  const phases=getPhases(state); const current=next||phases[phases.length-1];
  const lockedPhases=phases.map(p=>({title:p.title,status:"Locked"}));
  const isAdmin=state.role==="Firm Administrator"||state.role==="Partner"||state.role==="Manager";
  const viewingOtherYear=state.viewYear!==2025;
  if(viewingOtherYear)return <div className="page dashboard-page dashboard-refined">
    <div className="page-heading"><div><p className="eyebrow">Tuesday, August 12</p><h1>Good afternoon, Oscar</h1><p>Viewing FY {state.viewYear}.</p></div><button className="secondary-btn" onClick={() => navigate("/engagements")}>All engagements <ArrowRight size={16}/></button></div>
    <section className="section-card">
      <div className="empty-state">
        <CalendarDays/>
        <strong>No engagements for FY {state.viewYear}</strong>
        <p>This prototype only has engagement data for FY 2025. Every real screen — Dashboard, Engagements, Planning — reflects FY 2025 regardless of what's selected here.</p>
        <button className="primary-btn" style={{marginTop:14}} onClick={()=>update({viewYear:2025},"Back to FY 2025")}>Return to FY 2025 <ArrowRight size={16}/></button>
      </div>
    </section>
  </div>;
  return <div className="page dashboard-page dashboard-refined">
    <div className="page-heading"><div><p className="eyebrow">Tuesday, August 12</p><h1>Good afternoon, Oscar</h1><p>{isAdmin?"Here is exactly where every engagement stands in the audit lifecycle.":"Here is the one engagement that needs your attention today."}</p></div><button className="secondary-btn" onClick={() => navigate("/engagements")}>All engagements <ArrowRight size={16}/></button></div>
    {isAdmin&&<div className="portfolio-stats"><Metric label="Engagements" value="2" detail={`${declined?"1 declined":"1 in progress"} · 1 approved & locked`}/><Metric label="Need attention" value={String(items.length)} detail={items.length?items[0]:"Nothing blocking review"}/><Metric label="Planning progress" value={`${pct}%`} detail={`${engagement.shortName} · ${current.title}`}/></div>}
    <div className="dashboard-focus-grid">
      <section className="focus-engagement">
        <div className="focus-engagement-head"><div className="avatar square">{engagement.initials}</div><div><span className="eyebrow">{engagement.displayType} · {engagement.fiscalYear}</span><h2>{engagement.clientName}</h2><p>Period ended {engagement.periodEnd}</p></div><span className={`status-pill ${declined?"danger":"progress"}`}>{declined?"Declined":state.planningStatus}</span></div>
        <div className="focus-progress"><div><span>Planning progress</span><strong>{pct}%</strong></div><i><em style={{width:`${pct}%`}}/></i></div>
        <div className="focus-next"><div className={declined?"danger":""}>{declined?<AlertCircle/>:<ClipboardCheck/>}<span><small>Next best action</small><strong>{declined?"Review acceptance decision":next?next.title:"Planning review"}</strong><p>{declined?"Planning is paused until the engagement decision changes.":next?.detail||"All planning phases are ready for review."}</p></span></div><button className="primary-btn" onClick={() => navigate(declined?"/engagement/bbawc/planning/setup":"/engagement/bbawc/planning")}>Open planning <ArrowRight/></button></div>
      </section>
      <aside className="today-panel"><div className="section-title"><div><p className="eyebrow">Today</p><h2>Review queue</h2></div><span>{items.length}</span></div>{items.length?items.slice(0,3).map((item,i)=><button key={item} onClick={()=>navigate("/engagement/bbawc/planning")}><i className={i===0?"red":"amber"}>{i===0?<AlertCircle/>:<Clock3/>}</i><span><strong>{item}</strong><small>{engagement.shortName} · Planning</small></span><ChevronRight/></button>):<div className="today-empty"><CheckCircle2/><strong>You are caught up</strong><span>No planning items need attention.</span></div>}</aside>
    </div>
    <section className="section-card portfolio-card"><div className="section-title"><div><h2>Engagement portfolio</h2><p>Every engagement and exactly which audit-lifecycle stage it's on.</p></div><button className="secondary-btn" onClick={()=>navigate("/engagements")}>View all <ArrowRight size={16}/></button></div>
      <div className="portfolio-list">
        <button className="portfolio-row" onClick={()=>navigate(declined?"/engagement/bbawc/planning/setup":"/engagement/bbawc/planning")}>
          <div className="portfolio-id"><div className="avatar square">{engagement.initials}</div><div><strong>{engagement.clientName}</strong><span>{engagement.displayType} · {engagement.fiscalYear}</span></div></div>
          <PhaseStepper phases={phases}/>
          <div className="portfolio-stage"><strong>{current.title}</strong><span className={`status-pill ${statusClass(current.status)}`}>{current.status}</span></div>
          <ChevronRight/>
        </button>
        <button className="portfolio-row" onClick={()=>navigate("/engagements")}>
          <div className="portfolio-id"><div className="avatar square muted">HC</div><div><strong>Harbor Community Foundation</strong><span>Financial Audit · FY 2025</span></div></div>
          <PhaseStepper phases={lockedPhases}/>
          <div className="portfolio-stage"><strong>Publish &amp; Approval</strong><span className="status-pill approved">Approved &amp; locked</span></div>
          <ChevronRight/>
        </button>
      </div>
    </section>
    <section className="dashboard-quick"><button onClick={()=>navigate("/engagement/bbawc")}><LayoutDashboard/><span><strong>Engagement overview</strong><small>Progress, requests and timeline</small></span><ArrowRight/></button><button onClick={()=>navigate("/engagement/bbawc/planning/audit-trail")}><History/><span><strong>Recent activity</strong><small>Audit trail and review history</small></span><ArrowRight/></button><button onClick={()=>navigate("/engagements")}><BriefcaseBusiness/><span><strong>Engagements</strong><small>Search current and prior periods</small></span><ArrowRight/></button></section>
  </div>;
}

function Engagements({ navigate, update, state }: { navigate: (p: string) => void; update: (p: Partial<DemoState>, m?: string) => void; state: DemoState }) {
  const [newOpen, setNewOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | "In Progress" | "Approved" | "Declined">("All");
  const bbawcPlanning = state.acceptanceDecision === "decline" ? "Declined" : state.locked ? "Approved" : "In Progress";
  const bbawcPillClass = state.acceptanceDecision === "decline" ? "danger" : state.locked ? "approved" : "progress";
  const bbawcCounts = phaseStatusCounts(state);
  const rows = [
    { name: engagement.clientName, planning: bbawcPlanning, live: true },
    { name: "Harbor Community Foundation", planning: "Approved", live: false },
  ].filter(r => statusFilter === "All" || r.planning === statusFilter);
  if(state.viewYear!==2025)return <div className="page"><div className="page-heading"><div><p className="eyebrow">Clients</p><h1>Engagements</h1><p>Viewing FY {state.viewYear}.</p></div></div>
    <section className="section-card"><div className="empty-state"><CalendarDays/><strong>No engagements for FY {state.viewYear}</strong><p>This prototype only has engagement data for FY 2025.</p><button className="primary-btn" style={{marginTop:14}} onClick={()=>update({viewYear:2025},"Back to FY 2025")}>Return to FY 2025 <ArrowRight size={16}/></button></div></section>
  </div>;
  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Clients</p><h1>Engagements</h1><p>Current and prior-period assurance engagements.</p></div><button className="primary-btn" onClick={() => setNewOpen(true)}><Plus size={17}/>New engagement</button></div>
    <div className="table-card"><div className="table-toolbar"><div className="search"><Search/><input placeholder="Search engagements"/></div><div className="topbar-popover"><button className={`filter-btn ${statusFilter !== "All" ? "active" : ""}`} onClick={() => setFilterOpen(!filterOpen)}><Filter/>Filters{statusFilter !== "All" && <i className="filter-badge"/>}</button>{filterOpen && <div className="dropdown-menu filter-menu">
        <div className="dropdown-head"><strong>Planning status</strong></div>
        {(["All", "In Progress", "Approved", "Declined"] as const).map(s => <button key={s} className={`dropdown-item ${statusFilter === s ? "selected" : ""}`} onClick={() => { setStatusFilter(s); setFilterOpen(false); }}>{statusFilter === s && <Check size={14}/>}<span>{s}</span></button>)}
      </div>}</div></div>
      <table><thead><tr><th>Client</th><th>Engagement</th><th>Period</th><th>Planning</th><th>Assigned team</th><th></th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>No engagements match this filter.</td></tr>}
        {rows.map(r => r.live ? <tr key={r.name}><td><strong>{r.name}</strong><span>Nonprofit</span></td><td>Financial Audit</td><td>Dec 31, 2025</td><td><span className={`status-pill ${bbawcPillClass}`}>{bbawcPlanning}</span><StatusCountBadges compact complete={bbawcCounts.complete} inProgress={bbawcCounts.inProgress} attention={bbawcCounts.attention}/></td><td><button className="avatar-stack as-button" title="Manage engagement team" onClick={() => setTeamOpen(true)}>{state.teamMembers.slice(0, 4).map(m => <i key={m.id}>{m.initials}</i>)}</button></td><td><button className="icon-btn" onClick={() => navigate("/engagement/bbawc")}><ChevronRight/></button></td></tr>
          : <tr key={r.name}><td><strong>{r.name}</strong><span>Nonprofit</span></td><td>Financial Audit</td><td>Jun 30, 2025</td><td><span className="status-pill approved">Approved</span></td><td><div className="avatar-stack"><i>RP</i><i>MK</i></div></td><td><button className="icon-btn" onClick={() => update({}, `This demo includes one fully wired engagement — ${engagement.clientName}.`)}><ChevronRight/></button></td></tr>)}
      </tbody></table>
    </div>
    {newOpen && <NewEngagementWizard onClose={() => setNewOpen(false)} update={update}/>}
    {teamOpen && <EngagementTeamModal state={state} update={update} close={() => setTeamOpen(false)}/>}
  </div>;
}

function EngagementHome({ navigate, state, update }: { navigate: (p: string) => void; state: DemoState; update: (p: Partial<DemoState>, m?: string) => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const phases = getPhases(state); const declined = state.acceptanceDecision === "decline"; const foundationDone = phases[0].status === "Complete"; const dataDone = phases[1].status === "Complete"; const pct=planningProgressPct(state); const blockers=attentionItems(state).length; const riskList=allRisks(state); const highRiskCount=riskList.filter(r=>r.level==="High").length;
  const journey=[
    {title:"Acceptance",detail:declined?"Engagement declined":foundationDone?"Accepted · Aug 4":"2 confirmations pending",date:"Aug 4",state:declined?"danger":foundationDone?"complete":"current",route:"setup",progress:foundationDone?100:75},
    {title:"Data foundation",detail:dataDone?"TB and GL reconciled":"4 accounts need mapping",date:"Aug 11",state:dataDone?"complete":foundationDone&&!declined?"current":"locked",route:"data",progress:dataDone?100:state.mapped},
    {title:"Planning",detail:state.locked?"Approved and locked":`${pct}% complete · ${blockers} open`,date:"Aug 20",state:state.locked?"complete":!declined?"current":"locked",route:"planning",progress:pct},
    {title:"Fieldwork",detail:state.locked?"Ready to begin":"Unlocks after approval",date:"Sep 2",state:state.locked?"current":"locked",route:"planning",progress:0},
    {title:"Reporting",detail:"Begins after fieldwork",date:"Apr 30",state:"locked",route:"planning",progress:0},
  ];
  return <div className="page engagement-overview"><div className="breadcrumbs"><button onClick={() => navigate("/dashboard")}>Dashboard</button><ChevronRight/><span>{engagement.displayType}</span></div>
    <div className="engagement-hero"><div><span className={`status-pill ${declined?"danger":"progress"}`}>{declined?"Declined":state.planningStatus}</span><h1>{engagement.clientName}<button className="icon-btn" title="Edit engagement" onClick={()=>setEditOpen(true)}><Pencil size={14}/></button></h1><p>{engagement.displayType} · Period ended {engagement.periodEnd} · {engagement.accountingSystem}</p></div><div className="hero-actions"><button className="avatar-stack as-button" title="Manage engagement team" onClick={()=>setTeamOpen(true)}>{state.teamMembers.slice(0,4).map(m=><i key={m.id}>{m.initials}</i>)}</button><button className="primary-btn" onClick={() => navigate("/engagement/bbawc/planning")}>Open Planning <ArrowRight/></button></div></div>
    <div className="summary-grid"><Metric label="Planning progress" value={`${pct}%`} detail={blockers===0?"No blockers":`${blockers} blocker${blockers===1?"":"s"}`}/><Metric label="Client requests" value={`${state.completedRequests} / 6`} detail={`${Math.max(6-state.completedRequests,0)} outstanding`}/><Metric label="Assessed risks" value={String(riskList.length)} detail={`${highRiskCount} high risk`}/><Metric label="Fieldwork" value={state.locked ? "Unlocked" : "Locked"} detail={state.locked ? "Ready to begin" : "Approve Planning first"}/></div>
    <div className="engagement-overview-grid"><section className="section-card engagement-journey"><div className="section-title"><div><p className="eyebrow">Engagement lifecycle</p><h2>From acceptance to reporting</h2><p>Dates, current status and the next available action.</p></div><button className="text-link" onClick={() => navigate("/engagement/bbawc/planning/audit-trail")}>View audit trail <ArrowRight/></button></div><div className="journey-track">{journey.map((step,i)=><button key={step.title} className={`journey-step ${step.state}`} disabled={step.state==="locked"} onClick={()=>navigate(`/engagement/bbawc/${step.route==="planning"?"planning":`planning/${step.route}`}`)}><span className="journey-marker">{step.state==="complete"?<Check/>:step.state==="danger"?<AlertCircle/>:step.state==="locked"?<LockKeyhole/>:<span>{i+1}</span>}</span><span className="journey-copy"><small>{step.date}</small><strong>{step.title}</strong><em>{step.detail}</em><i><b style={{width:`${step.progress}%`}}/></i></span><ChevronRight/></button>)}</div></section>
      <section className="section-card engagement-facts"><div className="section-title"><div><p className="eyebrow">From signed engagement letter</p><h2>Engagement details</h2><p>Read-only facts synchronized from AssurePro.</p></div><span className="source-badge"><CheckCircle2/>Synced</span></div><dl><div><dt>Engagement type</dt><dd>{engagement.engagementType}</dd></div><div><dt>Reporting framework</dt><dd>{engagement.reportingFramework}</dd></div><div><dt>Entity type</dt><dd>{engagement.entityType}</dd></div><div><dt>Service scope</dt><dd>{engagement.serviceScope}</dd></div><div><dt>Period covered</dt><dd>{engagement.periodStart} – {engagement.periodEnd}</dd></div><div><dt>Reporting deadline</dt><dd>{engagement.reportingDeadline}</dd></div><div><dt>Engagement letter</dt><dd>{engagement.engagementLetter}</dd></div><div><dt>Locations in scope</dt><dd>{engagement.locations}</dd></div><div><dt>Engagement partner</dt><dd>{engagement.partner}</dd></div><div><dt>Engagement manager</dt><dd>{engagement.manager}</dd></div><div><dt>Archive date</dt><dd>{state.archiveDate}</dd></div></dl><div className="detail-actions"><button className="secondary-btn" onClick={()=>setTeamOpen(true)}><Users size={15}/>Manage team</button><button className="secondary-btn" onClick={()=>navigate("/engagement/bbawc/planning/setup")}>Review engagement terms <ArrowRight/></button></div></section></div>
    {editOpen && <EditEngagementModal state={state} update={update} close={()=>setEditOpen(false)}/>}
    {teamOpen && <EngagementTeamModal state={state} update={update} close={()=>setTeamOpen(false)}/>}
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
        {activeView === "materiality" && <Materiality state={state} update={update}/>} 
        {activeView === "risks" && <RisksView state={state} update={update} navigate={navigate}/>} 
        {activeView === "responses" && <ResponsesView state={state} update={update}/>} 
        {activeView === "publish" && <PublishView state={state} update={update} navigate={navigate}/>} 
        {activeView === "review" && <ReviewView state={state} update={update}/>} 
        {activeView === "audit-trail" && <AuditTrail state={state} update={update}/>}
      </div>
    </section>
    <ContextDrawer drawer={drawer} setDrawer={setDrawer} open={drawerOpen} setOpen={setDrawerOpen} update={update}/>
  </div>;
}

function PlanningHeader({ state, update, navigate, activeView, demoOpen, setDemoOpen }: any) {
  const titles: Record<string,string> = { overview:"Planning overview", setup:"Engagement Foundation", data:"Data Foundation", "entity-controls":"Entity & Controls", materiality:"Materiality", risks:"Risk Assessment", responses:"Audit Response", publish:"Publish & Approval", review:"Review & approval", "audit-trail":"Audit trail" };
  const declined = state.acceptanceDecision === "decline";
  return <div className="planning-header"><div><div className="breadcrumbs"><button onClick={()=>navigate("/engagement/bbawc/planning")}>Planning</button>{activeView!=="overview"&&<><ChevronRight/><span>{titles[activeView]}</span></>}</div><div className="title-line"><h1>{titles[activeView]}</h1><span className={`status-pill ${declined ? "danger" : state.locked ? "approved" : "progress"}`}>{declined ? "Engagement declined" : state.locked ? "Approved & locked" : state.planningStatus}</span>{state.reopened && <span className="status-pill danger">Reopened</span>}</div><p>{engagement.fiscalYear} · Period ended {engagement.periodEnd}</p></div>
    <div className="header-actions"><span className="saved"><Check size={14}/>Saved 2:42 PM IST <i>· stored in UTC</i></span></div></div>;
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
    <div className="section-title"><div><p className="eyebrow">Guided planning workspace</p><h2>{section}</h2><p>Structured conclusions remain traceable to source evidence and reviewer comments.</p></div><button className="secondary-btn" disabled={created} onClick={()=>{const risk:RiskItem={id:3000+state.customRisks.length,title:"Revenue concentration and conditional funding",fsa:"Contributions",assertion:"Completeness",likelihood:"Moderate",magnitude:"Moderate",level:"Moderate",significant:false,fraud:false,balance:"N/A",driver:"Entity & Controls planning answer",response:"Needs response"};update({customRisks:[...state.customRisks,risk]},"Risk draft created from this planning answer — added to the risk register");setCreated(true)}}>{created?<><Check size={16}/>Risk created</>:<><AlertTriangle/>Create risk</>}</button></div>
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
function Materiality({ state, update }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const [benchmarkBasis,setBenchmarkBasis]=useState("Current year"); const [specificOpen,setSpecificOpen]=useState(false); const [tbSourcesOpen,setTbSourcesOpen]=useState(false); const benchmarkType=state.materialityBenchmarkType; const override=state.materialityOverride; const rationale=state.materialityRationale;
  const calculated=state.benchmark*(state.materialityPct/100); const overall=override?240000:calculated; const performance=overall*(state.performancePct/100); const trivial=overall*(state.trivialPct/100);
  const chartData=[{name:"Prior",value:9100000},{name:"Preliminary",value:state.benchmark},{name:"Final",value:state.finalTb?9840000:0}];
  return <div className="content-pad materiality-page">
    {state.finalTb && <Banner tone="warning" title="A changed Final Trial Balance was ingested" text="Materiality must be explicitly re-performed and published as a new version. Downstream workpapers will not update silently."/>}
    {state.rolledForward && <Banner tone="warning" title="Prior-year benchmark choice carried forward — confirmation required" text="Only the benchmark methodology was copied. Prior-year dollar values are shown for comparison and are not current-year conclusions." action="Confirm benchmark" onAction={()=>update({rolledForward:false},"Current-year benchmark actively confirmed")}/>} 
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
    <div className="sticky-action-bar"><span>{state.materialityLocked?<><LockKeyhole size={16}/>Locked</>:<><CheckCircle2/>All materiality validations pass</>}</span><button className="secondary-btn" onClick={()=>update({},"Draft saved")}>Save draft</button><button className="primary-btn" disabled={(override&&!rationale)||state.materialityLocked} onClick={()=>update({materialityLocked:true},"Materiality conclusion completed and locked — downstream steps refreshed")}>{state.materialityLocked?<><Check size={16}/>Completed</>:"Complete materiality"}</button></div>
    {tbSourcesOpen && <TbSourcesModal state={state} onClose={()=>setTbSourcesOpen(false)}/>}
  </div>;
}

function RisksView({ state, update, navigate }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void; navigate:(p:string)=>void }) {
  const [cell,setCell]=useState<string|null>(null); const [selected,setSelected]=useState<any>(null); const [query,setQuery]=useState("");
  const [filterOpen,setFilterOpen]=useState(false); const [sigOnly,setSigOnly]=useState(false); const [fraudOnly,setFraudOnly]=useState(false);
  const [addOpen,setAddOpen]=useState(false); const [newTitle,setNewTitle]=useState(""); const [newFsa,setNewFsa]=useState(""); const [newLikelihood,setNewLikelihood]=useState("Moderate"); const [newMagnitude,setNewMagnitude]=useState("Moderate");
  const riskList=allRisks(state);
  const filtered=riskList.filter(r=>(!cell||`${r.likelihood}-${r.magnitude}`===cell)&&(`${r.title} ${r.fsa}`.toLowerCase().includes(query.toLowerCase()))&&(!sigOnly||r.significant)&&(!fraudOnly||r.fraud));
  const cells=["High-High","Moderate-High","Low-High","High-Moderate","Moderate-Moderate","Low-Moderate","High-Low","Moderate-Low","Low-Low"];
  const counts=Object.fromEntries(cells.map(c=>[c,riskList.filter(r=>`${r.likelihood}-${r.magnitude}`===c).length]));
  const highCount=riskList.filter(r=>r.level==="High").length; const moderateCount=riskList.filter(r=>r.level==="Moderate").length; const lowCount=riskList.filter(r=>r.level==="Low").length;
  const coveragePct=responseCoveragePct(state);
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
    <div className="section-title"><div><h2>Risk register</h2><p>All non-zero FSAs have a documented risk conclusion.</p></div><div className="table-tools"><div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search risks"/></div><div className="topbar-popover"><button className={`filter-btn ${activeFilterCount>0?"active":""}`} onClick={()=>setFilterOpen(!filterOpen)}><Filter/>Filters{activeFilterCount>0&&<i className="filter-badge"/>}</button>{filterOpen&&<div className="dropdown-menu filter-menu">
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
    <div className="response-stats"><Metric label="Risk coverage" value={`${responseCoveragePct(state)}%`} detail={`${gap?1:0} significant risk gap`}/><Metric label="Planned procedures" value={String(procedures.length)} detail={`${procedures.filter(p=>p.type==="Substantive").length} substantive · ${procedures.filter(p=>p.type==="Controls").length} controls`}/><Metric label="Team capacity" value="82%" detail="54 hours available"/><Metric label="Fieldwork start" value="Mar 9" detail="Planning approval required"/></div>
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
      <InfoBlock label="Response coverage" text={`${responseCoveragePct(state)}% — ${state.responseGap?"1 significant risk gap remains":"all significant risks covered"}`}/>
      <InfoBlock label="Fieldwork start" text="Mar 9, 2026 (pending Planning approval)"/>
    </div>}
    <div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Close</button></div>
  </div></div>;
}
function PublishView({ state, update, navigate }: { state:DemoState; update:(p:Partial<DemoState>,m?:string)=>void; navigate:(p:string)=>void }) {
  const [preview,setPreview]=useState<string|null>(null);
  const overallMateriality=state.materialityOverride?240000:state.benchmark*(state.materialityPct/100);
  const performanceMateriality=overallMateriality*(state.performancePct/100);
  const trivialThreshold=overallMateriality*(state.trivialPct/100);
  const vars=[["@OverallMateriality",money(overallMateriality),"Materiality"],["@PerformanceMateriality",money(performanceMateriality),"Materiality"],["@ClearlyTrivialThreshold",money(trivialThreshold),"Materiality"],["@Risk.RevenueCutoff","High / High","Risk register"],["@Risk.ManagementOverride","High / High","Risk register"]];
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
    ["Audit responses",`${responseCoveragePct(state)}% coverage · ${state.responseGap?"1 significant risk gap":"all significant risks covered"}`,state.responseGap?"danger":"good"],
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

type AuditEntry = { time: string; actor: string; title: string; detail?: string; rationale?: string };
// Historical baseline for each engagement — merged with the live, real-time state.auditLog feed
// (appended by every update() call that carries a toast message) so both the per-engagement
// Audit Trail and the firm-wide Firm Audit Log show the same real activity, not a static mock.
const RIVERSIDE_AUDIT_SEED: AuditEntry[] = [
  { time: "2:42 PM", actor: "Jasmine Alvarez", title: "Updated materiality percentage", detail: "2.0% → 2.5%", rationale: "Aligned to nonprofit firm guidance" },
  { time: "2:31 PM", actor: "AssureAudit Connector", title: "Synchronized General Ledger", detail: "1,204 transactions", rationale: "QuickBooks Online" },
  { time: "1:58 PM", actor: "Meera Kapoor", title: "Resolved review note", detail: "Entity understanding", rationale: "Source evidence linked" },
  { time: "11:16 AM", actor: "Jasmine Alvarez", title: "Accepted reconciliation variance", detail: "$12,000", rationale: "Timing difference in restricted grant receipt" },
  { time: "Aug 10", actor: "System", title: "Published Engagement Variables", detail: "Version 1", rationale: "5 variables created" },
  { time: "Aug 9", actor: "Oscar Owner", title: "Completed fraud discussion", detail: "4 participants", rationale: "Meeting record attached" },
];
const HARBOR_AUDIT_SEED: AuditEntry[] = [
  { time: "Jul 28", actor: "Meera Kapoor", title: "Partner approval recorded", detail: "Planning approved & locked" },
  { time: "Jul 20", actor: "Rohan Patel", title: "Published final materiality", detail: "$85,000 overall" },
  { time: "Jul 2", actor: "System", title: "Engagement letter signed", detail: "FY2025 audit engagement", rationale: "Synced from AssurePro" },
];
function AuditRow({ entry, live, engagementLabel }: { entry: AuditEntry; live: boolean; engagementLabel?: string }) {
  return <div><i className={live ? "current" : ""}/><span>{entry.time}</span><div><strong>{entry.title}</strong><p><b>{entry.actor}</b>{engagementLabel ? ` · ${engagementLabel}` : ""}{entry.detail ? ` · ${entry.detail}` : ""}</p>{entry.rationale && <small>Rationale: {entry.rationale}</small>}</div></div>;
}
function AuditTrail({ state, update }: { state: DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const liveEntries: AuditEntry[] = state.auditLog.map(e => ({ time: e.time, actor: e.actor, title: e.action }));
  const events = [...liveEntries, ...RIVERSIDE_AUDIT_SEED];
  return <div className="content-pad"><div className="section-title"><div><h2>Complete audit trail</h2><p>UTC storage with firm-local display. Every override, acceptance and approval is retained.</p></div><button className="secondary-btn" onClick={()=>update({},"Audit trail exported as audit-trail.pdf")}><Download/>Export log</button></div><div className="audit-timeline">{events.map((e,i)=><AuditRow key={i} entry={e} live={i<liveEntries.length}/>)}</div></div>;
}
function FirmAuditLog({ state, update }: { state: DemoState; update:(p:Partial<DemoState>,m?:string)=>void }) {
  const liveEntries: AuditEntry[] = state.auditLog.map(e => ({ time: e.time, actor: e.actor, title: e.action }));
  const rows: { entry: AuditEntry; live: boolean; engagementLabel: string }[] = [
    ...liveEntries.map(entry => ({ entry, live: true, engagementLabel: engagement.shortName })),
    ...RIVERSIDE_AUDIT_SEED.map(entry => ({ entry, live: false, engagementLabel: engagement.shortName })),
    ...HARBOR_AUDIT_SEED.map(entry => ({ entry, live: false, engagementLabel: "Harbor Community Foundation" })),
  ];
  return <div className="page">
    <div className="page-heading"><div><p className="eyebrow">Practice</p><h1>Firm audit log</h1><p>Every override, acceptance and approval across engagements, aggregated in real time.</p></div><button className="secondary-btn" onClick={()=>update({},"Firm audit log exported as firm-audit-log.pdf")}><Download/>Export log</button></div>
    <div className="audit-timeline">{rows.map((r,i)=><AuditRow key={i} entry={r.entry} live={r.live} engagementLabel={r.engagementLabel}/>)}</div>
  </div>;
}

function PlanningManager({state,update,navigate}:{state:DemoState;update:(p:Partial<DemoState>,m?:string)=>void;navigate:(p:string)=>void}) {
  const [selected,setSelected]=useState<string|null>(null);
  const [showCompleted,setShowCompleted]=useState(false);
  const [expanded,setExpanded]=useState<Record<string,boolean>>({"Commence":true,"Understand":true,"Identify & assess":true,"Respond":true});
  const [reviewSent,setReviewSent]=useState<Record<string,boolean>>({});
  const statusFor=(w:{title:string;status:string})=>reviewSent[w.title]&&w.status!=="Complete"?"In Review":w.status;
  const workpapers=[
    {stage:"Commence",title:"Acceptance & continuance",status:"Complete",owner:"JA",points:0,due:"Aug 12",progress:100,route:"setup"},
    {stage:"Commence",title:"Independence",status:"In Review",owner:"MK",points:2,due:"Aug 12",progress:85,route:"setup"},
    {stage:"Data ingest",title:"Trial balance & general ledger",status:"Complete",owner:"JA",points:0,due:"Aug 13",progress:100,route:"data"},
    {stage:"Understand",title:"Understanding the entity",status:"In Progress",owner:"JA",points:1,due:"Aug 14",progress:70,route:"entity-controls"},
    {stage:"Understand",title:"Internal control & IT",status:"In Progress",owner:"JA",points:0,due:"Aug 15",progress:62,route:"entity-controls"},
    {stage:"Identify & assess",title:"Flux analytics & automatic scoping",status:"Complete",owner:"JA",points:0,due:"Aug 15",progress:100,route:"risks"},
    {stage:"Identify & assess",title:"Risk assessment",status:"In Review",owner:"MK",points:1,due:"Aug 16",progress:78,route:"risks"},
    {stage:"Respond",title:"Audit plan",status:"Needs Attention",owner:"JA",points:1,due:"Aug 18",progress:58,route:"responses"},
    {stage:"Approve",title:"Planning communications",status:"Not Started",owner:"OO",points:0,due:"Aug 20",progress:0,route:"publish"},
  ];
  const stages=["Commence","Data ingest","Understand","Identify & assess","Respond","Approve"];
  const completedCount=workpapers.filter(w=>w.status==="Complete").length;
  const current=workpapers.find(w=>w.title===selected);
  if(current)return <section className="workpaper-detail"><div className="workpaper-detail-head"><button className="back-link" onClick={()=>setSelected(null)}><ArrowLeft/>Planning workpapers</button><div><span className="eyebrow">{current.stage}</span><h2>{current.title}</h2><p>Prepared by {current.owner} · Due {current.due}</p></div><div><span className={`status-pill ${statusClass(statusFor(current))}`}>{statusFor(current)}</span><button className="secondary-btn" onClick={()=>navigate(`/engagement/bbawc/planning/${current.route}`)}>Open full workpaper <ArrowRight/></button></div></div><div className="workpaper-detail-progress"><span><strong>{current.progress}%</strong> complete</span><i><em style={{width:`${current.progress}%`}}/></i></div><div className="workpaper-detail-grid"><div className="procedure-panel"><div className="section-title"><div><p className="eyebrow">Procedure 01</p><h3>Document and evaluate the planning conclusion</h3></div><span className="status-pill progress">In progress</span></div><p>Perform the required procedure, cross-reference supporting evidence and document a clear conclusion. Client responses are inputs only; the auditor owns the conclusion.</p><div className="procedure-checks"><CheckRow title="Objective and relevant assertion documented" detail="Linked to the engagement-level planning objective" checked/><CheckRow title="Evidence cross-referenced" detail="Two supporting files linked" checked={current.progress===100}/><CheckRow title="Reviewer point resolved" detail={current.points?`${current.points} open review point${current.points===1?"":"s"}`:"No open review points"} checked={current.points===0}/></div><Field label="Auditor response and conclusion"><textarea defaultValue="Procedure performed. Evidence inspected and the conclusion is consistent with the planning record. Any exceptions are documented in the review notes."/></Field><div className="workpaper-actions"><button className="secondary-btn" onClick={()=>update({},`${current.title} response saved as draft`)}>Save draft</button><button className="primary-btn" disabled={reviewSent[current.title]} onClick={()=>{setReviewSent(v=>({...v,[current.title]:true}));update({},`${current.title} sent for review`)}}>{reviewSent[current.title]?"Sent for review":<>Send for review <Send/></>}</button></div></div><aside className="workpaper-evidence"><h3>Evidence & review</h3><button><FileText/><span><strong>Planning support.pdf</strong><small>Evidence · 1.8 MB</small></span><ChevronRight/></button><button><MessageSquare/><span><strong>{current.points} review points</strong><small>{current.points?"Requires auditor response":"Nothing outstanding"}</small></span><ChevronRight/></button><button><History/><span><strong>Activity history</strong><small>Last updated 18 min ago</small></span><ChevronRight/></button></aside></div></section>;
  return <section className="planning-board">
    <div className="planning-board-head"><div><p className="eyebrow">Planning workpapers</p><h2>Complete the work, then send it for review</h2><p>Active work is shown first. Completed work stays available without competing for attention.</p></div><div className="board-head-actions"><button className={`secondary-btn completed-toggle ${showCompleted?"active":""}`} onClick={()=>setShowCompleted(!showCompleted)}>{showCompleted?<><Circle/>Hide completed</>:<><CheckCircle2/>Show completed ({completedCount})</>}</button><button className="primary-btn" onClick={()=>update({},"New workpaper draft created (simulated)")}><Plus/>Add workpaper</button></div></div>
    <div className="planning-phase-strip"><div><span>Planning</span><strong>{planningProgressPct(state)}%</strong><i><em style={{width:`${planningProgressPct(state)}%`}}/></i></div><div><span>Response</span><strong>{responseCoveragePct(state)}%</strong><i><em style={{width:`${responseCoveragePct(state)}%`}}/></i></div><div><span>Completion</span><strong>{Math.round(workpapers.reduce((s,w)=>s+w.progress,0)/workpapers.length)}%</strong><i><em style={{width:`${Math.round(workpapers.reduce((s,w)=>s+w.progress,0)/workpapers.length)}%`}}/></i></div></div>
    <div className="planning-board-grid"><div className="workpaper-groups">{stages.map(stage=>{const allRows=workpapers.filter(w=>w.stage===stage);const rows=showCompleted?allRows:allRows.filter(w=>w.status!=="Complete");if(rows.length===0)return null;const pct=Math.round(allRows.reduce((sum,w)=>sum+w.progress,0)/allRows.length);const activeCount=allRows.filter(r=>r.status!=="Complete").length;const isOpen=!!expanded[stage];return <section className="workpaper-stage" key={stage}><button className="stage-toggle" onClick={()=>setExpanded(v=>({...v,[stage]:!isOpen}))}><span><strong>{stage}</strong><small>{activeCount} active · {allRows.length-activeCount} complete</small></span><span className="stage-progress"><b>{pct}%</b><i><em style={{width:`${pct}%`}}/></i>{isOpen?<ChevronDown/>:<ChevronRight/>}</span></button>{isOpen&&<div className="stage-rows">{rows.map(row=><button className="workpaper-row-refined" key={row.title} onClick={()=>setSelected(row.title)}><span className={`workpaper-state ${statusClass(statusFor(row))}`}>{statusFor(row)==="Complete"?<Check/>:statusFor(row)==="Needs Attention"?<AlertCircle/>:<Circle/>}</span><span className="workpaper-title"><strong>{row.title}</strong><small>{statusFor(row)} · {row.progress}% complete</small></span><span className="row-meter"><i><em style={{width:`${row.progress}%`}}/></i></span>{row.points>0&&<span className="review-count"><MessageSquare/>{row.points}</span>}<i className="person-avatar violet">{row.owner}</i><span className="row-due"><small>Due</small>{row.due}</span><ChevronRight/></button>)}</div>}</section>})}</div>
      <aside className="planning-insight-rail"><section><div className="rail-title"><h3>Key information</h3><button className="icon-btn" title="Figures flow from connected engagement data"><Info/></button></div><dl><div><dt>Revenue</dt><dd>$9.6M</dd></div><div><dt>Net assets</dt><dd>$2.21M</dd></div><div><dt>Overall materiality</dt><dd>{money(state.materialityOverride?240000:state.benchmark*(state.materialityPct/100))}</dd></div><div><dt>Performance materiality</dt><dd>{money((state.materialityOverride?240000:state.benchmark*(state.materialityPct/100))*state.performancePct/100)}</dd></div></dl><label>Entity risk<select value={state.entityRisk} onChange={e=>update({entityRisk:e.target.value as DemoState["entityRisk"]},`Entity risk updated to ${e.target.value}`)}><option>Normal</option><option>Elevated</option><option>High</option></select></label></section><section><div className="rail-title"><h3>Needs attention</h3><span className="rail-count">{attentionItems(state).length}</span></div>{attentionItems(state).length===0?<p className="rail-empty">Nothing needs attention right now.</p>:attentionItems(state).map((item,i)=><button key={i} onClick={()=>navigate(`/engagement/bbawc/planning/${attentionItemRoute(item)}`)}><AlertCircle/><span><strong>{item}</strong></span><ChevronRight/></button>)}</section></aside>
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

function FluxAnalytics({state,update,navigate}:{state:DemoState;update:(p:Partial<DemoState>,m?:string)=>void;navigate:(p:string)=>void}) {
  const [view,setView]=useState<"Flux analysis"|"Automatic scoping"|"Benchmark guidance">("Flux analysis");
  const overall=state.materialityOverride?240000:state.benchmark*state.materialityPct/100;
  const performance=overall*state.performancePct/100;
  const trivial=overall*state.trivialPct/100;
  const rows=[
    {area:"Contribution revenue",current:3840000,prior:3420000,risk:"Revenue cutoff",qualitative:true},
    {area:"Program service expenses",current:5420000,prior:4880000,risk:"Payroll allocation",qualitative:false},
    {area:"Cash",current:612480,prior:820300,risk:"Cash existence",qualitative:false},
    {area:"Contributions receivable",current:486200,prior:310400,risk:"Allowance for pledges",qualitative:true},
    {area:"Investments",current:742100,prior:785000,risk:"Investment valuation",qualitative:false},
    {area:"Property & equipment",current:384000,prior:345000,risk:"Fixed asset additions",qualitative:false},
  ].map(r=>({...r,movement:r.current-r.prior,movePct:r.prior?((r.current-r.prior)/r.prior*100):0,scoped:Math.abs(r.current)>=overall||Math.abs(r.current-r.prior)>=performance||r.qualitative}));
  return <section className="flux-workspace"><div className="flux-head"><div><p className="eyebrow">Planning analytics</p><h2>Flux, materiality & scoping</h2><p>Analytics identify patterns and exceptions for auditor evaluation; they never create a risk conclusion automatically.</p></div><div className="threshold-chips"><span>OM <strong>{money(overall)}</strong></span><span>PM <strong>{money(performance)}</strong></span><span>Trivial <strong>{money(trivial)}</strong></span></div></div><div className="subtabs compact">{(["Flux analysis","Automatic scoping","Benchmark guidance"] as const).map(v=><button key={v} className={view===v?"active":""} onClick={()=>setView(v)}>{v}</button>)}</div>
    {view==="Flux analysis"&&<><div className="analytics-chain"><span>TB / GL</span><ArrowRight/><span>Pattern or exception</span><ArrowRight/><span>Auditor evaluation</span><ArrowRight/><span>Risk</span><ArrowRight/><span>Response</span></div><div className="table-card flux-table"><table><thead><tr><th>Financial statement area</th><th>Current</th><th>Prior</th><th>Movement</th><th>% change</th><th>Compared with PM</th><th>Auditor action</th></tr></thead><tbody>{rows.map(r=><tr key={r.area}><td><strong>{r.area}</strong><span>{r.qualitative?"Qualitative risk indicator present":"Standard flux rule"}</span></td><td>{money(r.current)}</td><td>{money(r.prior)}</td><td className={Math.abs(r.movement)>=performance?"variance":""}>{r.movement<0?"−":"+"}{money(Math.abs(r.movement))}</td><td>{r.movePct>0?"+":""}{r.movePct.toFixed(1)}%</td><td><span className={`status-pill ${Math.abs(r.movement)>=performance?"warning":"neutral"}`}>{(Math.abs(r.movement)/performance).toFixed(1)}× PM</span></td><td><button className="text-link" onClick={()=>{update({},`Analytics indicator linked to ${r.risk} — opening Risk Assessment`);navigate("/engagement/bbawc/planning/risks")}}>{r.risk?<><Link2/>{r.risk}</>:"Evaluate"}</button></td></tr>)}</tbody></table></div></>}
    {view==="Automatic scoping"&&<><Banner tone="info" title="Scoping recommendation, not an automatic conclusion" text="An area is proposed in scope when its balance exceeds Overall Materiality, its movement exceeds Performance Materiality, or a qualitative/significant-risk indicator exists. Auditor rationale is required for overrides."/><div className="scoping-grid">{rows.map(r=><article key={r.area} className={r.scoped?"scoped":"out"}><div><strong>{r.area}</strong><span>{money(r.current)} balance · {money(Math.abs(r.movement))} movement</span></div><span className={`status-pill ${r.scoped?"progress":"neutral"}`}>{r.scoped?"Proposed in scope":"Proposed out"}</span><small>{Math.abs(r.current)>=overall?"Balance exceeds OM":Math.abs(r.movement)>=performance?"Movement exceeds PM":r.qualitative?"Qualitative risk indicator":"Below quantitative thresholds"}</small><select defaultValue={r.scoped?"In scope":"Out of scope"}><option>In scope</option><option>Limited scope</option><option>Out of scope</option></select></article>)}</div></>}
    {view==="Benchmark guidance"&&<div className="benchmark-guidance"><Banner tone="warning" title="Professional judgment is required" text="Audit standards require a benchmark and materiality supported by the entity’s circumstances; they do not prescribe universal percentages. The ranges below are illustrative firm methodology and must be configurable."/><div className="benchmark-cards"><article className="recommended"><Sparkles/><strong>Total revenue</strong><span>Recommended for this nonprofit</span><b>Illustrative range: 0.5%–3%</b><small>Stable revenue and donor stewardship are key user considerations.</small></article><article><Building2/><strong>Total assets / net assets</strong><span>Alternative for asset-focused entities</span><b>Illustrative range: 1%–2%</b><small>Consider when financial position drives user decisions.</small></article><article><BarChart3/><strong>Income before tax</strong><span>Alternative for profit-oriented entities</span><b>Illustrative range: 5%–10%</b><small>Use normalized results where earnings fluctuate.</small></article></div></div>}
  </section>
}

function RiskResponseQc({gap}:{gap:boolean}) {
  const [open,setOpen]=useState(false);
  return <section className="response-qc"><div className="response-qc-head"><div><p className="eyebrow">Auditor-only methodology</p><h2>Risk → response quality check</h2><p>Each significant risk must drive assertion-specific procedures and evidence.</p></div><button className="secondary-btn" onClick={()=>setOpen(!open)}>{open?"Hide QC detail":"Show QC detail"}<ChevronDown/></button></div><div className="risk-response-chain">{["Understand client","Identify risk","Assess risk","Design response","Select procedure","Evaluate evidence","Conclude"].map((s,i)=><div key={s}><span className={gap&&i>3?"pending":"done"}>{i<4||!gap?<Check/>:<Circle/>}</span><strong>{s}</strong>{i<6&&<ArrowRight/>}</div>)}</div>{open&&<div className="qc-detail"><div className="procedure-anatomy">{[["Objective","What are we trying to establish?"],["Risk","Why is the procedure necessary?"],["Assertion","Which assertion is addressed?"],["Population","What data is being tested?"],["Nature / timing / extent","What will be performed, when and how much?"],["Sample","Which items and why?"],["Evidence","What support is required?"],["Exceptions & conclusion","What was found and what does it mean?"]].map(x=><div key={x[0]}><strong>{x[0]}</strong><span>{x[1]}</span></div>)}</div><div className="qc-checks"><CheckRow title="Significant and fraud risks are clearly flagged" detail="3 significant · 2 fraud risks" checked/><CheckRow title="Relevant assertions are documented" detail="Coverage shown by risk and financial statement area" checked/><CheckRow title="Every significant risk has a specifically responsive procedure" detail={gap?"1 gap remains — blocks completion":"All significant risks covered"} checked={!gap}/><CheckRow title="Control reliance is supported by control testing" detail="Controls and substantive responses are separated" checked/></div></div>}</section>
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
  const tabs=["Guide","Comments","Review notes","Activity","Attachments"];
  const openNotes=notes.filter(n=>n.status==="Open").length;
  const addComment=()=>{ if(!commentDraft.trim())return; setComments(c=>[...c,{author:"Oscar Owner",text:commentDraft.trim()}]); setCommentDraft(""); };
  const addNote=()=>{ if(!noteDraft.trim())return; setNotes(n=>[{title:noteDraft.trim(),author:"Oscar Owner",status:"Open"},...n]); setNoteDraft(""); };
  return <aside className="context-drawer"><div className="context-top"><h3>Planning context</h3><button className="icon-btn" onClick={()=>setOpen(false)}><ChevronRight/></button></div><div className="drawer-tabs">{tabs.map(t=><button key={t} className={drawer===t?"active":""} onClick={()=>setDrawer(t)}>{t==="Guide"?<BookOpen/>:t==="Comments"?<MessageSquare/>:t==="Review notes"?<ClipboardCheck/>:t==="Activity"?<Activity/>:<Paperclip/>}<span>{t}</span>{t==="Review notes"&&openNotes>0&&<i>{openNotes}</i>}</button>)}</div><div className="drawer-content">
    {drawer==="Guide"&&<><p className="eyebrow">Current section guide</p><h3>Planning overview</h3><p>Complete and validate each conclusion before submitting the engagement for Manager and Partner approval.</p><GuideItem title="Why this matters" text="A connected planning record keeps data, conclusions, risks and the audit program traceable."/><GuideItem title="Completion rule" text="Blocking validations are shown in the relevant step. Client requests warn but do not block approval."/><a href="#">Open firm methodology <ArrowRight/></a></>}
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
  const bucketOf=(status:string)=>(status==="Done"||status==="Validated")?"Done":(status==="Submitted"||status==="In Review"||status==="Client Responded")?"Submitted":"To do";
  const counts={All:requests.length,"To do":requests.filter(r=>bucketOf(r.status)==="To do").length,Submitted:requests.filter(r=>bucketOf(r.status)==="Submitted").length,Done:requests.filter(r=>bucketOf(r.status)==="Done").length};
  const visibleRequests=requests.filter(r=>statusFilter==="All"||bucketOf(r.status)===statusFilter);
  const dueSoon=requests.filter(r=>bucketOf(r.status)==="To do");
  return <div className="client-portal"><header className="client-top"><div className="brand white"><div className="brand-mark">A</div><div><strong>assure</strong><span>audit</span></div><em>Client Portal</em></div><div className="client-actions"><button onClick={()=>update({},"Help center opened (simulated) — support articles for the Client Portal")}><BookOpen/>Help</button><div className="topbar-popover"><button onClick={()=>setNotifOpen(!notifOpen)}><Bell/>{dueSoon.length>0&&<i className="portal-notif-dot"/>}</button>{notifOpen&&<div className="dropdown-menu notif-menu">
        <div className="dropdown-head"><strong>Notifications</strong><span>{dueSoon.length} request{dueSoon.length===1?"":"s"} need action</span></div>
        {dueSoon.length===0?<div className="dropdown-empty">Nothing needs action right now.</div>:dueSoon.map(r=><button key={r.title} className="dropdown-item" onClick={()=>{setNotifOpen(false);openRequest(r.title)}}><AlertCircle size={14}/><span>{r.title} · Due {r.due}</span></button>)}
      </div>}</div><div className="avatar">DC</div><button className="secondary-btn" onClick={onExit}>Return to firm demo</button></div></header><main><div className="client-welcome"><div><p className="eyebrow">{engagement.displayType} · {engagement.fiscalYear}</p><h1>Planning Requests</h1><p>{engagement.clientName} · Requested by CF Joseph CPA PC</p></div><div className="portal-progress"><div><strong>{requests.filter(r=>r.status==="Done").length} of {requests.length}</strong><span>requests complete</span></div><div className="progress-line"><i style={{width:`${requests.filter(r=>r.status==="Done").length/requests.length*100}%`}}/></div></div></div>
    <Banner tone="info" title="Help your audit team understand your organization" text="Upload requested documents or securely grant access. Never enter accounting-system credentials into AssureAudit; QuickBooks authorization opens a simulated consent flow."/>
    <div className="request-layout"><section><div className="request-filters">{(["All","To do","Submitted","Done"] as const).map(f=><button key={f} className={statusFilter===f?"active":""} onClick={()=>setStatusFilter(f)}>{f} <i>{counts[f]}</i></button>)}</div><div className="request-list">{visibleRequests.length===0&&<div className="empty-state"><strong>No requests in this view</strong><p>Try a different filter.</p></div>}{visibleRequests.map(r=><button key={r.title} onClick={()=>openRequest(r.title)}><div className={`request-icon ${r.status==="Done"?"done":""}`}>{r.status==="Done"?<Check/>:r.type==="OAuth access consent"?<Link2/>:<FileText/>}</div><div><strong>{r.title}</strong><span>{r.type} · {r.due==="—"?"No action required":`Due ${r.due}`}</span>{r.file&&<small><Paperclip/>{r.file}</small>}</div><span className={`status-pill ${statusClass(r.status)}`}>{r.status}</span><ChevronRight/></button>)}</div></section><aside className="portal-help"><MessageSquare/><h3>Questions?</h3><p>Comment on any request and your audit team will respond here.</p><button className="secondary-btn full" onClick={()=>update({},"Message sent to Jasmine Alvarez — she typically replies within one business day")}>Message audit team</button><hr/><small>Firm reviewer</small><strong>Jasmine Alvarez</strong><span>Usually replies within one business day</span></aside></div>
    {selected&&<div className="modal-backdrop"><div className="modal request-modal"><div className="modal-head"><div><span className={`status-pill ${statusClass(selected.status)}`}>{selected.status}</span><h2>{selected.title}</h2><p>{selected.type} · Due {selected.due}</p></div><button className="icon-btn" onClick={()=>setSelectedTitle(null)}><X/></button></div><p>Please provide the requested information for the FY 2025 financial audit. Your response is visible only to your organization and the audit firm.</p>{selected.type==="Questionnaire"?<div className="client-questionnaire"><div className="question-guidance"><Info/><span><strong>Auditor question</strong>{selected.title.includes("Entity")?state.questionnairePrompt:"Describe the key transaction cycles, who performs and reviews each control, system dependencies, changes during the year, and any known control deficiencies."}</span></div><Field label="Your response" required><textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Provide the current-year facts, responsible people and supporting context…"/></Field><div className="modal-actions"><button className="secondary-btn" onClick={()=>{update({clientAnswer:answer},"Draft saved");setSelectedTitle(null)}}>Save draft</button><button className="primary-btn" disabled={!answer.trim()} onClick={()=>{setStatus(selected.title,"Client Responded");setSelectedTitle(null);update({clientAnswer:answer,questionnaireStatus:"Client Responded",completedRequests:state.completedRequests+1},"Questionnaire response sent to the audit team")}}>Submit response <Send/></button></div></div>:selected.type==="OAuth access consent"?<div className="oauth-box"><div className="connector-logo">qb</div><div><strong>QuickBooks Online</strong><span>Read-only access to Trial Balance and General Ledger for FY 2025</span></div><button className="primary-btn" onClick={()=>{setStatus(selected.title,"Submitted");setSelectedTitle(null);update({completedRequests:state.completedRequests+1},"QuickBooks consent submitted securely")}}>Review access request</button></div>:selected.status==="In Review"?<Banner tone="info" title="Firm review has started" text="Your file is locked from replacement. You can continue to add comments."/>:<div className="drop-zone"><UploadCloud/><strong>Drag and drop a file here</strong><span>or choose a file · Excel, CSV, PDF, Word up to 50 MB</span><button className="secondary-btn" onClick={()=>{setStatus(selected.title,"Submitted","Uploaded document.pdf");setSelectedTitle(null);update({completedRequests:state.completedRequests+1},"File uploaded and submitted for firm review")}}>Choose file</button></div>}<div className="comment-thread"><h3>Comments</h3>{selected.comments.length>0&&<div className="drawer-comment-list">{selected.comments.map((c,i)=><div key={i} className="drawer-comment"><strong>{c.author}</strong><p>{c.text}</p></div>)}</div>}<div className="comment-input"><div className="avatar">DC</div><input value={commentDraft} onChange={e=>setCommentDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addComment()}}} placeholder="Ask a question or add context…"/><button className="icon-btn" disabled={!commentDraft.trim()} onClick={addComment}><Send/></button></div></div></div></div>}</main></div> }

type WizardAssignment = { role: string; user: string; due: string };
function WizardSteps({step}:{step:1|2}) {
  return <div className="wizard-steps">
    <div className={`wizard-step ${step===1?"active":"done"}`}><div className="wizard-step-circle">{step>1?<Check size={15}/>:"1"}</div><div className="wizard-step-label"><strong>Set Details</strong><span>Step 1</span></div></div>
    <div className="wizard-connector"/>
    <div className={`wizard-step ${step===2?"active":""}`}><div className="wizard-step-circle">2</div><div className="wizard-step-label"><strong>Review & Confirm</strong><span>Step 2</span></div></div>
  </div>;
}
const SIGNED_LETTERS = [
  { client: "Riverside Youth & Family Services, Inc.", signedOn: "Aug 4, 2025", type: "Financial Audit", periodStart: "2025-01-01", periodEnd: "2025-12-31" },
  { client: "Harbor Community Foundation", signedOn: "Jul 2, 2025", type: "Financial Audit", periodStart: "2024-07-01", periodEnd: "2025-06-30" },
];
function NewEngagementWizard({ onClose, update }: { onClose: () => void; update: (p: Partial<DemoState>, m?: string) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [manualEntry, setManualEntry] = useState(false);
  const [client, setClient] = useState(SIGNED_LETTERS[0].client);
  const [engagementType, setEngagementType] = useState(SIGNED_LETTERS[0].type);
  const [periodStart, setPeriodStart] = useState(SIGNED_LETTERS[0].periodStart);
  const [periodEnd, setPeriodEnd] = useState(SIGNED_LETTERS[0].periodEnd);
  const [linkPriorYear, setLinkPriorYear] = useState(false);
  const [archiveDate, setArchiveDate] = useState("");
  const [contentPack, setContentPack] = useState(CONTENT_PACKS[0]);
  const [entityRiskLevel, setEntityRiskLevel] = useState("Normal");
  const [initialEngagement, setInitialEngagement] = useState("No");
  const [coaTemplate, setCoaTemplate] = useState(COA_TEMPLATES[0]);
  const [assignments, setAssignments] = useState<WizardAssignment[]>(() => ACCOUNTABILITY_ROWS.map((role, i) => ({
    role, user: DEFAULT_ASSIGNEES[i], due: addDays(new Date(), DEFAULT_DUE_WEEKS[i] * 7),
  })));
  const setAssignment = (i: number, patch: Partial<WizardAssignment>) => setAssignments(a => a.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  const selectLetter = (value: string) => {
    if (value === "manual") { setManualEntry(true); setClient(""); setEngagementType("Financial Audit"); setPeriodStart(""); setPeriodEnd(""); return; }
    const letter = SIGNED_LETTERS.find(l => l.client === value)!;
    setManualEntry(false); setClient(letter.client); setEngagementType(letter.type); setPeriodStart(letter.periodStart); setPeriodEnd(letter.periodEnd);
  };
  const canContinue = client.trim().length > 0 && periodEnd.trim().length > 0;
  const create = () => {
    onClose();
    const isLive = client === engagement.clientName;
    const patch: Partial<DemoState> = isLive ? { ...(linkPriorYear ? { rolledForward: true } : {}), ...(archiveDate ? { archiveDate } : {}) } : {};
    update(patch, `"${client}" created ${manualEntry ? "without a linked engagement letter" : "from its signed AssurePro engagement letter"} — this demo scopes fully wired functionality to ${engagement.clientName}.`.replace(/\.\.$/, "."));
  };
  return <div className="modal-backdrop"><div className="modal wizard-modal">
    <div className="modal-head"><div><h2>New engagement</h2><p>This prototype simulates engagement creation — no record is actually created.</p></div><button className="icon-btn" onClick={onClose}><X/></button></div>
    <WizardSteps step={step}/>
    {step === 1 ? <>
      <Field label="Signed engagement letter" required>
        <select value={manualEntry ? "manual" : client} onChange={e => selectLetter(e.target.value)}>
          {SIGNED_LETTERS.map(l => <option key={l.client} value={l.client}>{l.client} — signed {l.signedOn}</option>)}
          <option value="manual">Enter manually — no signed letter yet</option>
        </select>
        <small className="field-note">Engagement letters are signed and stored in AssurePro. Selecting one carries its client, type and period into this engagement.</small>
      </Field>
      {manualEntry && <Field label="Client name" required><input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Riverside Youth Alliance"/></Field>}
      <div className="form-grid"><Field label="Engagement type"><select value={engagementType} disabled={!manualEntry} onChange={e => setEngagementType(e.target.value)}><option>Financial Audit</option><option>EBP Audit</option><option>Fund Audit</option><option>NFP Audit</option><option>Government Audit</option></select></Field><Field label="Period start" required><input type="date" value={periodStart} disabled={!manualEntry} onChange={e => setPeriodStart(e.target.value)}/></Field><Field label="Period end" required><input type="date" value={periodEnd} disabled={!manualEntry} onChange={e => setPeriodEnd(e.target.value)}/></Field></div>
      <div className="wizard-grid">
        <div className="wizard-panel">
          <h3>Key Engagement Details</h3>
          <p>Content, risk posture and chart of accounts for this engagement.</p>
          <Field label="Workpapers Content Pack" info="Content packs bundle firm methodology, questionnaires and standard workprograms for an engagement type.">
            <select value={contentPack} onChange={e => setContentPack(e.target.value)}>{CONTENT_PACKS.map(p => <option key={p}>{p}</option>)}</select>
          </Field>
          <Field label="Entity Risk Level" info="Entity risk level guides staffing, supervision and the persuasiveness of evidence required across Planning.">
            <select value={entityRiskLevel} onChange={e => setEntityRiskLevel(e.target.value)}>{["Low", "Normal", "Elevated", "High"].map(l => <option key={l}>{l}</option>)}</select>
          </Field>
          <Field label="Initial Engagement"><select value={initialEngagement} onChange={e => setInitialEngagement(e.target.value)}><option>No</option><option>Yes</option></select></Field>
          <Field label="Chart of Accounts" info="The Chart of Accounts template maps standard financial statement areas used later in Data Foundation account mapping.">
            <select value={coaTemplate} onChange={e => setCoaTemplate(e.target.value)}>{COA_TEMPLATES.map(c => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Archive date"><input type="date" value={archiveDate} onChange={e => setArchiveDate(e.target.value)}/></Field>
          <label className="checkbox-row"><input type="checkbox" checked={linkPriorYear} onChange={e => setLinkPriorYear(e.target.checked)}/><span>Link prior year engagement — carry forward structure, mapping and methodology as editable drafts</span></label>
        </div>
        <div className="wizard-panel">
          <h3>Initial Accountability & Timeline</h3>
          <p>Assign a responsible user and due date for each planning phase.</p>
          <div className="table-card"><table className="accountability-table"><thead><tr><th>Phase</th><th>Responsible User</th><th>Due Date</th></tr></thead><tbody>
            {assignments.map((row, i) => <tr key={row.role}><td>{row.role}</td><td><select value={row.user} onChange={e => setAssignment(i, { user: e.target.value })}>{TEAM_ROSTER.map(m => <option key={m.initials} value={m.name}>{m.name} ({m.initials})</option>)}</select></td><td><input type="date" value={row.due} onChange={e => setAssignment(i, { due: e.target.value })}/></td></tr>)}
          </tbody></table></div>
        </div>
      </div>
      <div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={!canContinue} onClick={() => setStep(2)}>Continue <ArrowRight size={16}/></button></div>
    </> : <>
      <div className="review-summary-grid">
        <div className="review-summary-block">
          <h3>Key Engagement Details</h3>
          <div className="review-row"><span>Signed engagement letter</span><strong>{manualEntry ? "None on file yet" : "Linked from AssurePro"}</strong></div>
          <div className="review-row"><span>Client</span><strong>{client}</strong></div>
          <div className="review-row"><span>Engagement type</span><strong>{engagementType}</strong></div>
          <div className="review-row"><span>Period</span><strong>{periodStart} – {periodEnd}</strong></div>
          <div className="review-row"><span>Archive date</span><strong>{archiveDate || "Not set"}</strong></div>
          <div className="review-row"><span>Link prior year</span><strong>{linkPriorYear ? "Yes" : "No"}</strong></div>
          <div className="review-row"><span>Workpapers Content Pack</span><strong>{contentPack}</strong></div>
          <div className="review-row"><span>Entity Risk Level</span><strong>{entityRiskLevel}</strong></div>
          <div className="review-row"><span>Initial Engagement</span><strong>{initialEngagement}</strong></div>
          <div className="review-row"><span>Chart of Accounts</span><strong>{coaTemplate}</strong></div>
        </div>
        <div className="review-summary-block">
          <h3>Initial Accountability & Timeline</h3>
          {assignments.map(row => <div className="review-row" key={row.role}><span>{row.role}</span><strong>{row.user} · {row.due}</strong></div>)}
        </div>
      </div>
      <div className="modal-actions"><button className="secondary-btn" onClick={() => setStep(1)}>Back</button><button className="primary-btn" onClick={create}>Confirm & Create</button></div>
    </>}
  </div></div>;
}
const ENGAGEMENT_TEAM_ROLES: EngagementTeamRole[] = ["Junior", "Senior", "Manager", "Engagement Leader", "Engagement Quality Reviewer"];
function initialsOf(name: string) { return name.trim().split(/\s+/).map(p => p[0]).join("").toUpperCase().slice(0, 2); }
function EngagementTeamModal({ state, update, close }: { state: DemoState; update: (p: Partial<DemoState>, m?: string) => void; close: () => void }) {
  const [tab, setTab] = useState<"Engagement team" | "Client team">("Engagement team");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [role, setRole] = useState<EngagementTeamRole>("Senior");
  const addMember = () => {
    if (!name.trim() || !email.trim()) return;
    const member: TeamMember = { id: `tm-${state.teamMembers.length}-${initialsOf(name)}`, name: name.trim(), initials: initialsOf(name), email: email.trim(), role, status: "Pending" };
    update({ teamMembers: [...state.teamMembers, member] }, `${name} invited to the engagement team as ${role}`);
    setName(""); setEmail(""); setRole("Senior"); setAdding(false);
  };
  const setMemberRole = (id: string, newRole: EngagementTeamRole) => update({ teamMembers: state.teamMembers.map(m => m.id === id ? { ...m, role: newRole } : m) }, `Role updated to ${newRole}`);
  const removeMember = (m: TeamMember) => update({ teamMembers: state.teamMembers.filter(x => x.id !== m.id) }, `${m.name} removed from this engagement`);
  return <div className="modal-backdrop"><div className="modal team-modal">
    <div className="modal-head"><div><h2>Engagement team</h2><p>Manage who has access to this engagement and their role.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <div className="manager-tabs"><button className={tab === "Engagement team" ? "active" : ""} onClick={() => setTab("Engagement team")}>Engagement team · {state.teamMembers.length}</button><button className={tab === "Client team" ? "active" : ""} onClick={() => setTab("Client team")}>Client team · {state.clientContacts.length}</button></div>
    {tab === "Engagement team" ? <>
      <div className="table-card"><table><thead><tr><th>Member</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>
        {state.teamMembers.map(m => <tr key={m.id}>
          <td><div className="member-cell"><div className="person-avatar violet">{m.initials}</div><div><strong>{m.name}</strong><span>{m.email}{m.specialty ? ` · ${m.specialty}` : ""}</span></div></div></td>
          <td><select aria-label={`Role for ${m.name}`} value={m.role} onChange={e => setMemberRole(m.id, e.target.value as EngagementTeamRole)}>{ENGAGEMENT_TEAM_ROLES.map(r => <option key={r}>{r}</option>)}</select></td>
          <td><span className={`status-pill ${m.status === "Active" ? "approved" : m.status === "Guest" ? "neutral" : "warning"}`}>{m.status}</span></td>
          <td className="row-actions">{m.status === "Pending" && <button className="icon-btn" title="Resend invite" onClick={() => update({}, `Invitation resent to ${m.name}`)}><Send size={14}/></button>}<button className="icon-btn" title="Remove from engagement" onClick={() => removeMember(m)}><X size={14}/></button></td>
        </tr>)}
      </tbody></table></div>
      {adding ? <div className="inline-add-row">
        <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)}/>
        <input placeholder="Work email" value={email} onChange={e => setEmail(e.target.value)}/>
        <select value={role} onChange={e => setRole(e.target.value as EngagementTeamRole)}>{ENGAGEMENT_TEAM_ROLES.map(r => <option key={r}>{r}</option>)}</select>
        <button className="primary-btn" disabled={!name.trim() || !email.trim()} onClick={addMember}>Invite</button>
        <button className="icon-btn" onClick={() => setAdding(false)}><X size={14}/></button>
      </div> : <button className="secondary-btn" onClick={() => setAdding(true)}><Plus size={16}/>Add team member</button>}
    </> : <>
      <div className="table-card"><table><thead><tr><th>Contact</th><th>Role</th><th>Last login</th><th>2FA</th></tr></thead><tbody>
        {state.clientContacts.map(c => <tr key={c.email}>
          <td><div className="member-cell"><div className="person-avatar">{initialsOf(c.name)}</div><div><strong>{c.name}</strong><span>{c.email}</span></div></div></td>
          <td>{c.role}</td>
          <td>{c.lastLogin}</td>
          <td><span className={`status-pill ${c.twoFA ? "approved" : "neutral"}`}>{c.twoFA ? "Enabled" : "Not enabled"}</span></td>
        </tr>)}
      </tbody></table></div>
      <p className="team-note"><Info size={14}/>Client contacts never see internal risk ratings, materiality, or reviewer notes — only what's shared through Planning Requests.</p>
    </>}
  </div></div>;
}
function EditEngagementModal({ state, update, close }: { state: DemoState; update: (p: Partial<DemoState>, m?: string) => void; close: () => void }) {
  const periodLocked = state.mapped > 0;
  const [archiveDate, setArchiveDate] = useState(state.archiveDate);
  const [entityRisk, setEntityRisk] = useState(state.entityRisk);
  const [rolledForward, setRolledForward] = useState(state.rolledForward);
  const save = () => { update({ archiveDate, entityRisk, rolledForward }, "Engagement details updated"); close(); };
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>Edit engagement</h2><p>Attributes that can change after the engagement was created from its signed letter.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <Field label="Financial period end">
      <input type="date" value="2025-12-31" disabled title="Locked — sourced from the signed engagement letter in AssurePro"/>
      <small className="field-note">{periodLocked ? "Locked — data ingestion has started for this period." : "Sourced from the signed engagement letter in AssurePro."}</small>
    </Field>
    <Field label="Archive date"><input type="date" value={archiveDate} onChange={e => setArchiveDate(e.target.value)}/></Field>
    <Field label="Entity risk level"><select value={entityRisk} onChange={e => setEntityRisk(e.target.value as DemoState["entityRisk"])}><option>Normal</option><option>Elevated</option><option>High</option></select></Field>
    <label className="checkbox-row"><input type="checkbox" checked={rolledForward} onChange={e => setRolledForward(e.target.checked)}/><span>Link prior year engagement — carries forward structure, mapping and methodology as editable drafts.</span></label>
    <div className="modal-actions"><button className="secondary-btn" onClick={close}>Cancel</button><button className="primary-btn" onClick={save}>Save changes</button></div>
  </div></div>;
}
function MyAccountModal({ state, update, close }: { state: DemoState; update: (p: Partial<DemoState>, m?: string) => void; close: () => void }) {
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>My account</h2><p>Your profile, notifications and sign-in security.</p></div><button className="icon-btn" onClick={close}><X/></button></div>
    <div className="member-cell" style={{ marginBottom: 18 }}><div className="person-avatar violet" style={{ width: 40, height: 40, fontSize: 13 }}>OO</div><div><strong>Oscar Owner</strong><span>oscar.owner@cfjosephcpa.com · {state.role}</span></div></div>
    <label className="checkbox-row"><input type="checkbox" checked={state.notifyDaily} onChange={e => update({ notifyDaily: e.target.checked }, e.target.checked ? "Daily summary email enabled" : "Daily summary email disabled")}/><span>Send me one daily summary email instead of one per request</span></label>
    <label className="checkbox-row"><input type="checkbox" checked={state.twoFactorEnabled} onChange={e => update({ twoFactorEnabled: e.target.checked }, e.target.checked ? "Two-factor authentication enabled" : "Two-factor authentication disabled")}/><span>Require a verification code at sign-in (two-factor authentication)</span></label>
    <div className="modal-actions"><button className="primary-btn" onClick={close}>Done</button></div>
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
function PhaseStepper({phases}:{phases:{title:string;status:string}[]}){return <div className="phase-stepper">{phases.map((p,i)=>{const tone=(p.status==="Complete"||p.status==="Locked"||p.status==="Approved")?"done":(p.status==="Needs Attention"||p.status==="Declined"||p.status==="Stale")?"attention":p.status==="Not Started"?"upcoming":"active";return <span key={p.title} className={`phase-dot ${tone}`} title={`${p.title} — ${p.status}`}>{tone==="done"?<Check size={11}/>:i+1}</span>})}</div>}
function Banner({tone,title,text,action,onAction}:{tone:string;title:string;text:string;action?:string;onAction?:()=>void}){return <div className={`banner ${tone}`}>{tone==="danger"?<AlertCircle/>:tone==="warning"?<AlertTriangle/>:tone==="success"?<CheckCircle2/>:<Info/>}<div><strong>{title}</strong><span>{text}</span></div>{action&&<button onClick={onAction}>{action}<ArrowRight/></button>}</div>}
function Field({label,required,info,children}:{label:string;required?:boolean;info?:string;children:React.ReactNode}){return <label className="field"><span>{label}{required&&<em>*</em>}{info&&<HelpTip text={info}/>}</span>{children}</label>}
function FormSection({title,subtitle,children,update}:{title:string;subtitle:string;children:React.ReactNode;update?:(p:Partial<DemoState>,m?:string)=>void}){return <section className="form-section"><div className="section-title"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-btn" onClick={()=>update?.({},`More options for "${title}" (history, print, and export)`)}><MoreHorizontal/></button></div>{children}</section>}
function MaterialityCardTitle({title,help,standard}:{title:string;help:string;standard:string}){return <div className="materiality-card-title"><h2>{title}</h2><InfoTip title={title} text={help} standard={standard}/></div>}
function InfoTip({title,text,standard}:{title:string;text:string;standard:string}){return <span className="info-tip" tabIndex={0} aria-label={`${title}. ${text} Reference: ${standard}`}><Info aria-hidden="true"/><span className="info-popover" role="tooltip"><strong>Audit perspective</strong><p>{text}</p><small>{standard}</small></span></span>}
function HelpTip({text}:{text:string}){return <span className="info-tip" tabIndex={0} aria-label={text}><Info aria-hidden="true"/><span className="info-popover" role="tooltip"><p style={{margin:0}}>{text}</p></span></span>}
function StickyActions({update,onComplete,completed}:{update:(p:Partial<DemoState>,m?:string)=>void;onComplete?:()=>void;completed?:boolean}){return <div className="sticky-action-bar"><span><Check size={16}/>Autosaved just now</span><button className="secondary-btn" onClick={()=>update({},"Draft saved")}>Save draft</button><button className="primary-btn" disabled={!!completed} onClick={()=>onComplete?onComplete():update({},"Step completed and saved to the audit trail")}>{completed?<><Check size={16}/>Completed</>:"Complete step"}</button></div>}
function CheckRow({title,detail,checked=false}:{title:string;detail:string;checked?:boolean}){const [on,setOn]=useState(checked);return <label className="check-row"><input type="checkbox" checked={on} onChange={e=>setOn(e.target.checked)}/><i>{on&&<Check/>}</i><span><strong>{title}</strong><small>{detail}</small></span>{on&&<span className="status-pill approved">Complete</span>}</label>}
function Member({name,role,status,update}:{name:string;role:string;status:string;update?:(p:Partial<DemoState>,m?:string)=>void}){return <div className="member-row"><div className="person-avatar violet">{name.split(" ").map(n=>n[0]).join("")}</div><div><strong>{name}</strong><span>{role}</span></div><span className={`status-pill ${status==="Confirmed"?"approved":"warning"}`}>{status}</span>{status==="Pending"&&<button className="secondary-btn" onClick={()=>update?.({},`Independence confirmation reminder sent to ${name}`)}>Send reminder</button>}</div>}
function UploadCard({title,file,rows,status,progress,onUpload,update}:{title:string;file:string;rows:string;status:string;progress:number;onUpload:()=>void;update:(p:Partial<DemoState>,m?:string)=>void}){
  const [menuOpen,setMenuOpen]=useState(false);
  return <div className="upload-card"><div className="upload-title"><div className="file-icon"><FileSpreadsheet/></div><div><span className="card-label">Data source</span><h3>{title}</h3></div><span className="status-pill approved">{status}</span></div><div className="file-detail"><FileCheck2/><div><strong>{file}</strong><span>{rows} · Excel/CSV · FY 2025</span></div><div className="topbar-popover"><button className="icon-btn" onClick={()=>setMenuOpen(!menuOpen)}><MoreHorizontal/></button>{menuOpen && <div className="dropdown-menu file-menu"><button className="dropdown-item" onClick={()=>{setMenuOpen(false);onUpload();update({},`${file} replacement started`)}}><UploadCloud size={14}/><span>Replace file</span></button><button className="dropdown-item danger-item" onClick={()=>{setMenuOpen(false);update({},`${file} removed from this engagement (simulated)`)}}><X size={14}/><span>Remove</span></button></div>}</div></div><div className="upload-progress"><i style={{width:`${progress}%`}}/></div><div className="upload-actions"><button className="text-link" onClick={()=>update({},`${title} import template downloaded`)}><Download/>Download template</button><button className="secondary-btn" onClick={onUpload}><UploadCloud/>Replace file</button></div></div>}
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
  return <div className="drawer-file"><FileText/><div><strong>{name}</strong><span>{meta}</span></div><div className="topbar-popover"><button className="icon-btn" onClick={()=>setMenuOpen(!menuOpen)}><MoreHorizontal/></button>{menuOpen&&<div className="dropdown-menu file-menu"><button className="dropdown-item" onClick={()=>{setMenuOpen(false);update?.({},`${name} downloaded`)}}><Download size={14}/><span>Download</span></button><button className="dropdown-item danger-item" onClick={()=>{setMenuOpen(false);update?.({},`${name} removed from Attachments (simulated)`)}}><X size={14}/><span>Remove</span></button></div>}</div></div>}
function heatClass(cell:string){const [l,m]=cell.split("-");if(l==="High"&&m==="High")return"critical";if(l==="High"||m==="High")return"high-cell";if(l==="Moderate"||m==="Moderate")return"medium-cell";return"low-cell"}
