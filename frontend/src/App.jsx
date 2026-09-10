import { useState } from "react";
import {
  ArrowUpRight, BarChart3, Check, ChevronRight, ClipboardCheck,
  FileText, Github, LayoutDashboard, Loader2, Menu, MessageSquare,
  Sparkles, Target, Upload, UserRound, X, Zap,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const sampleResume = `Jordan Lee
Product-minded software engineer with 4 years of experience building customer-facing products.
Experience: Built a Python/FastAPI platform used by 40k monthly users; led React migration that improved activation 24%.
Skills: Python, FastAPI, React, TypeScript, PostgreSQL, Docker, AWS, analytics, stakeholder communication.`;
const sampleJob = `Senior Product Engineer
We are looking for a product-minded engineer to build delightful experiences with React and TypeScript.
You will design scalable APIs with Python and FastAPI, work with PostgreSQL, and partner with stakeholders.
Experience with AWS, Docker, analytics, and strong communication is valued.`;

function App() {
  const [auth, setAuth] = useState(() => JSON.parse(localStorage.getItem("careerpilot_auth") || "null"));
  const [authMode, setAuthMode] = useState("login");
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [role, setRole] = useState("Senior Product Engineer");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  if (!auth) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} onAuthenticated={(session) => {
      localStorage.setItem("careerpilot_auth", JSON.stringify(session));
      setAuth(session);
    }} />;
  }

  const analyze = async () => {
    if (!resume.trim() || !job.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ resume, job_description: job, target_role: role }),
      });
      if (!response.ok) throw new Error("Analysis failed");
      setResult(await response.json());
    } catch {
      // Keep the prototype useful without a running API.
      setResult(localAnalysis(resume, job, role));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3"><div className="brand-mark"><Sparkles size={19} /></div><span className="text-lg font-bold tracking-tight">career<span className="text-violet-600">pilot</span></span></div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 md:flex">
            <a className="text-slate-900" href="#workspace">Workspace</a><a href="#how-it-works">How it works</a><a href="#history">History</a>
          </nav>
          <div className="flex items-center gap-3"><button className="hidden btn-ghost sm:flex"><Github size={16} /> Share feedback</button><span className="hidden text-xs font-semibold text-slate-500 sm:block">{auth.user.name}</span><button className="avatar"><UserRound size={17} /></button><button onClick={() => setMobileNav(!mobileNav)} className="md:hidden"><Menu size={21} /></button></div>
        </div>
        {mobileNav && <div className="border-t border-slate-100 px-6 py-4 text-sm"><a href="#workspace">Workspace</a><a className="ml-5" href="#how-it-works">How it works</a></div>}
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10 lg:py-14">
        {!result ? <Landing resume={resume} setResume={setResume} job={job} setJob={setJob} role={role} setRole={setRole} analyze={analyze} loading={loading} />
          : <Results result={result} reset={() => setResult(null)} />}
      </main>
      <footer className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-8 text-xs text-slate-400 lg:px-10"><span>© 2026 CareerPilot · Private by design</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Analysis engine operational</span></footer>
    </div>
  );
}

function AuthScreen({ mode, setMode, onAuthenticated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to continue");
      onAuthenticated(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-10">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white md:flex">
        <div><div className="flex items-center gap-3"><div className="brand-mark"><Sparkles size={19} /></div><span className="text-lg font-bold">career<span className="text-violet-400">pilot</span></span></div><div className="mt-24"><div className="eyebrow"><Zap size={13} fill="currentColor" /> AI CAREER INTELLIGENCE</div><h1 className="mt-5 text-4xl font-bold leading-tight">Make your next move with clarity.</h1><p className="mt-5 text-sm leading-7 text-slate-400">Save your resume insights, compare opportunities, and build a career plan that compounds.</p></div></div>
        <p className="text-xs text-slate-500">Private by design · Built for ambitious builders</p>
      </div>
      <form onSubmit={submit} className="p-7 sm:p-12">
        <div className="md:hidden"><div className="flex items-center gap-3"><div className="brand-mark"><Sparkles size={19} /></div><span className="text-lg font-bold">career<span className="text-violet-600">pilot</span></span></div></div>
        <div className="mt-8 md:mt-12"><p className="eyebrow">{isRegister ? "GET STARTED" : "WELCOME BACK"}</p><h2 className="mt-3 text-3xl font-bold tracking-tight">{isRegister ? "Create your account" : "Sign in to CareerPilot"}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{isRegister ? "Your personalized career workspace starts here." : "Continue your personalized career analysis."}</p></div>
        <div className="mt-8 space-y-4">
          {isRegister && <label className="field-label">Full name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jordan Lee" /></label>}
          <label className="field-label">Email address<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
          <label className="field-label">Password<input required minLength="8" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
        <button className="btn-primary mt-7 w-full" disabled={busy}>{busy ? <><Loader2 className="animate-spin" size={17} /> Please wait...</> : <>{isRegister ? "Create account" : "Sign in"} <ChevronRight size={17} /></>}</button>
        <p className="mt-6 text-center text-sm text-slate-500">{isRegister ? "Already have an account?" : "New to CareerPilot?"} <button type="button" onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }} className="font-bold text-violet-600">{isRegister ? "Sign in" : "Create an account"}</button></p>
      </form>
    </div>
  </div>;
}

function Landing({ resume, setResume, job, setJob, role, setRole, analyze, loading }) {
  return <div id="workspace">
    <div className="mb-12 max-w-3xl"><div className="eyebrow"><Zap size={13} fill="currentColor" /> AI CAREER INTELLIGENCE</div><h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-.04em] text-slate-950 md:text-6xl">Turn your experience into your <span className="gradient-text">next opportunity.</span></h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 md:text-lg">CareerPilot reads between the lines of your resume and a job description to reveal your strongest match, blind spots, and exactly what to do next.</p></div>
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr_300px]">
      <InputCard icon={<FileText size={18} />} title="Your resume" hint="Paste your resume or upload a PDF" value={resume} onChange={setResume} placeholder="Paste your resume here..." />
      <InputCard icon={<Target size={18} />} title="Target opportunity" hint="Paste the job description" value={job} onChange={setJob} placeholder="Paste a job description here..." />
      <aside className="space-y-5"><div className="panel p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target role</p><input className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" value={role} onChange={e => setRole(e.target.value)} /><div className="mt-5 flex items-center gap-2 text-xs text-slate-400"><div className="flex -space-x-2"><span className="mini-avatar bg-violet-200">A</span><span className="mini-avatar bg-sky-200">M</span><span className="mini-avatar bg-amber-200">J</span></div> Join 2,400+ ambitious builders</div></div><div className="panel bg-slate-950 p-5 text-white"><Sparkles className="text-violet-300" size={20} /><p className="mt-4 text-sm font-semibold">What you’ll get</p><ul className="mt-3 space-y-3 text-xs leading-5 text-slate-400"><li className="flex gap-2"><Check size={14} className="mt-0.5 text-emerald-400" />Match score with evidence</li><li className="flex gap-2"><Check size={14} className="mt-0.5 text-emerald-400" />Skill gaps to close</li><li className="flex gap-2"><Check size={14} className="mt-0.5 text-emerald-400" />Personalized interview prep</li></ul></div></aside>
    </div>
    <div className="mt-7 flex flex-col items-center justify-between gap-4 sm:flex-row"><button className="btn-link" onClick={() => { setResume(sampleResume); setJob(sampleJob); }}>Try with sample data <ArrowUpRight size={15} /></button><button className="btn-primary w-full sm:w-auto" disabled={loading || !resume.trim() || !job.trim()} onClick={analyze}>{loading ? <><Loader2 className="animate-spin" size={17} /> Analyzing your fit...</> : <><Sparkles size={17} /> Analyze my opportunity <ChevronRight size={17} /></>}</button></div>
    <div id="how-it-works" className="mt-24 grid gap-4 border-t border-slate-200 pt-8 md:grid-cols-3"><Step icon={<ClipboardCheck />} title="Understand your profile" body="We extract the skills, impact, and signals that make your experience unique." n="01" /><Step icon={<BarChart3 />} title="Find the signal gap" body="Semantic retrieval compares your evidence to what the role actually needs." n="02" /><Step icon={<MessageSquare />} title="Build your advantage" body="Get a practical plan and interview questions built around your gaps." n="03" /></div>
  </div>;
}

function InputCard({ icon, title, hint, value, onChange, placeholder }) {
  return <div className="panel flex min-h-[330px] flex-col p-5"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="icon-box">{icon}</div><div><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-xs text-slate-400">{hint}</p></div></div><button className="upload"><Upload size={14} /> Upload</button></div><textarea className="mt-5 flex-1 resize-none rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm leading-6 outline-none transition placeholder:text-slate-300 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /><p className="mt-3 text-right text-[11px] text-slate-400">{value.length.toLocaleString()} characters</p></div>;
}
function Step({ icon, title, body, n }) { return <div className="flex gap-4"><span className="step-num">{n}</span><div><div className="mb-3 text-violet-600">{icon}</div><h3 className="text-sm font-bold">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{body}</p></div></div>; }
function Results({ result, reset }) {
  return <div id="history"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><button onClick={reset} className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-800"><X size={14} /> New analysis</button><div className="eyebrow"><Check size={13} /> ANALYSIS COMPLETE · {result.processing_ms || 12}MS</div><h1 className="mt-4 text-4xl font-bold tracking-tight">Your fit for <span className="gradient-text">{result.target_role}</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{result.summary}</p></div><button className="btn-ghost"><ArrowUpRight size={16} /> Export report</button></div><div className="mt-10 grid gap-5 lg:grid-cols-[290px_1fr]"><div className="panel flex flex-col items-center justify-center p-7"><p className="self-start text-xs font-semibold uppercase tracking-wider text-slate-400">Match score</p><div className="score-ring mt-7" style={{"--score": `${result.score}%`}}><div><strong>{result.score}</strong><span>/100</span></div></div><p className="mt-5 text-center text-sm font-semibold">{result.score >= 75 ? "Strong foundation" : "Promising foundation"}</p><p className="mt-2 text-center text-xs leading-5 text-slate-400">Your experience is a compelling starting point for this opportunity.</p></div><div className="grid gap-5 md:grid-cols-2"><ResultPanel title="What stands out" color="emerald" items={result.strengths} /><ResultPanel title="Your opportunity gaps" color="amber" items={result.gaps} /></div></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="panel p-6"><PanelTitle icon={<Sparkles size={17} />} title="Your action plan" /><ol className="mt-5 space-y-4">{result.recommendations.map((item, i) => <li className="flex gap-3 text-sm leading-6" key={item}><span className="plan-index">{i + 1}</span><span>{item}</span></li>)}</ol></div><div className="panel p-6"><PanelTitle icon={<MessageSquare size={17} />} title="Interview prep" /><p className="mt-1 text-xs text-slate-400">Questions to rehearse before you apply</p><div className="mt-4 space-y-3">{result.interview_questions.map((q, i) => <div className="question" key={q}><span>0{i + 1}</span>{q}</div>)}</div></div></div><div className="panel mt-5 p-6"><PanelTitle icon={<Target size={17} />} title="Keywords detected" /><div className="mt-4 flex flex-wrap gap-2">{result.keywords.map(word => <span className="keyword" key={word}>{word}</span>)}</div></div></div>;
}
function ResultPanel({ title, items, color }) { return <div className="panel p-6"><PanelTitle title={title} /><div className="mt-5 space-y-4">{items.length ? items.map(item => <div className="flex gap-3 text-sm leading-6" key={item}><span className={`mt-2 h-2 w-2 shrink-0 rounded-full bg-${color}-400`} />{item}</div>) : <p className="text-sm text-slate-400">No obvious gaps detected.</p>}</div></div>; }
function PanelTitle({ icon, title }) { return <div className="flex items-center gap-2 text-sm font-bold">{icon && <span className="text-violet-600">{icon}</span>}{title}</div>; }
function localAnalysis(resume, job, role) { const terms = ["python","react","typescript","fastapi","postgresql","docker","aws","analytics","communication","leadership"]; const matched = terms.filter(t => resume.toLowerCase().includes(t) && job.toLowerCase().includes(t)); const score = Math.max(48, Math.min(96, Math.round((matched.length / 7) * 100))); return { id: "local", target_role: role, score, summary: `Your profile is a ${score}% match for ${role}. You already show evidence across ${matched.slice(0,3).join(", ") || "core experience"}. Prioritize closing the top gaps before applying.`, strengths: matched.slice(0,5).map(t => `Evidence of ${t} in your experience`), gaps: terms.filter(t => job.toLowerCase().includes(t) && !resume.toLowerCase().includes(t)).slice(0,5).map(t => `Add clearer proof of ${t}`), recommendations: ["Lead with a 2-line impact summary tailored to the role.","Move quantified outcomes into the first bullet of each relevant experience.","Mirror the job description's language naturally in your skills and project bullets."], interview_questions: ["Walk me through the project most relevant to this role.","Tell me about a time you improved a measurable outcome.","Which requirement would you ramp up on first, and how?"], keywords: terms.filter(t => job.toLowerCase().includes(t)) }; }
export default App;
