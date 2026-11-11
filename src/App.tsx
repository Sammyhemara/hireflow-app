import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import AccountHome from "./AccountHome";
import AuthScreen from "./AuthScreen";
import { useState } from "react";
import { BriefcaseBusiness, Building2, Users, MessageSquare, Filter, CalendarDays, LayoutDashboard, ShieldCheck } from "lucide-react";

type Role = "Employer" | "Agency" | "Jobseeker";
const navigation: Record<Role, string[]> = {
  Employer: ["Overview", "My Jobs", "Applicants", "Messages", "Interviews", "Team", "Settings"],
  Agency: ["Overview", "Clients", "Jobs", "Candidates", "Submissions", "Messages", "Settings"],
  Jobseeker: ["Overview", "Find Jobs", "My Applications", "Profile", "Messages", "Interviews", "Settings"]
};
const sampleJobs = [
  { title: "Operations Coordinator", company: "Example Logistics", location: "Sydney NSW", type: "Full-time", applicants: 24 },
  { title: "Customer Service Officer", company: "Example Services", location: "Melbourne VIC", type: "Hybrid", applicants: 16 },
  { title: "Accounts Assistant", company: "Example Group", location: "Brisbane QLD", type: "Part-time", applicants: 9 }
];
export default function App() {
  const [role, setRole] = useState<Role>("Employer");
  const [showAuth,setShowAuth]=useState(false);
  const [user,setUser]=useState<User|null>(null);
  const [checking,setChecking]=useState(true);
  useEffect(()=>{if(!supabase){setChecking(false);return;}const client=supabase;client.auth.getUser().then(({data})=>{setUser(data.user);setChecking(false);});const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{setUser(session?.user??null);setChecking(false);});return()=>subscription.unsubscribe();},[]);
  const [page, setPage] = useState("Overview");
  const [search, setSearch] = useState("");
  const icons = [BriefcaseBusiness, Users, Filter, MessageSquare];
  const metrics = role === "Employer" ? [["Active jobs", "3"], ["Applications", "49"], ["To review", "12"], ["Interviews", "4"]] :
    role === "Agency" ? [["Active clients", "8"], ["Open roles", "16"], ["Candidates", "142"], ["Submissions", "21"]] :
    [["Saved jobs", "6"], ["Applications", "4"], ["Messages", "2"], ["Interviews", "1"]];
  return checking ? <div className="auth-page">Loading HireFlow...</div> : user ? <AccountHome user={user} onSignOut={()=>{void supabase?.auth.signOut();}}/> : showAuth ? <AuthScreen onBack={()=>setShowAuth(false)}/> : <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brandmark"><BriefcaseBusiness size={22}/></span><span>Hire<span className="accent">Flow</span><small>SMART RECRUITMENT</small></span></div>
      <div className="workspace-label">DEMO WORKSPACE</div>
      <select aria-label="Workspace role" value={role} onChange={e=>{setRole(e.target.value as Role);setPage("Overview");}}>
        <option>Employer</option><option>Agency</option><option>Jobseeker</option>
      </select>
      <nav aria-label="Main navigation">{navigation[role].map(item=><button className={page===item?"active":""} key={item} onClick={()=>setPage(item)}>{item==="Overview"?<LayoutDashboard size={17}/>:item==="Messages"?<MessageSquare size={17}/>:item==="Interviews"?<CalendarDays size={17}/>:item==="Clients"?<Building2 size={17}/>:<Users size={17}/>} {item}</button>)}</nav>
      <div className="sidebar-foot"><ShieldCheck size={17}/> Demo only · No live applicant data</div>
    </aside>
    <main className="main">
      <header><div><span className="eyebrow">{role.toUpperCase()} WORKSPACE</span><h1>{page==="Overview"?"Recruitment overview":page}</h1><p>Manage hiring in one place, without endless phone calls.</p></div><button className="demo-pill auth-open" onClick={()=>setShowAuth(true)}>Register / Sign in</button></header>
      {page==="Overview" ? <>
        <section className="metrics">{metrics.map(([label,value],i)=>{const Icon=icons[i];return <article className="metric" key={label}><div className="metric-icon"><Icon size={20}/></div><span>{label}</span><strong>{value}</strong></article>;})}</section>
        <section className="panel"><div className="panel-head"><div><h2>{role==="Jobseeker"?"Explore opportunities":"Recent job advertisements"}</h2><p>Sample listings for the first HireFlow dashboard.</p></div><span className="tag">Sample data</span></div>
          <input className="search" placeholder="Search jobs, employers or locations" value={search} onChange={e=>setSearch(e.target.value)} aria-label="Search sample jobs"/>
          <div className="jobs">{sampleJobs.filter(j=>Object.values(j).some(v=>String(v).toLowerCase().includes(search.toLowerCase()))).map(job=><article className="job" key={job.title}><div className="job-icon"><Building2 size={20}/></div><div><h3>{job.title}</h3><p>{job.company} · {job.location}</p></div><span className="tag">{job.type}</span><span className="applicant-count">{job.applicants} applicants</span></article>)}</div>
        </section>
        <section className="next"><h2>What comes next?</h2><p>Phase 1 will connect secure accounts, job posting, application screening and two-way messaging. This preview uses fictional information only.</p></section>
      </> : <section className="panel empty"><div className="empty-icon"><Filter size={28}/></div><h2>{page} workspace</h2><p>This section is reserved for the next HireFlow development milestone. No live data or backend is connected.</p><button onClick={()=>setPage("Overview")}>Back to overview</button></section>}
    </main>
  </div>;
}
