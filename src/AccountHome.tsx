import { useEffect,useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import JobCreator from "./JobCreator";
import { BriefcaseBusiness, Building2, Users, MessageSquare, CalendarDays, LayoutDashboard, ShieldCheck, Filter } from "lucide-react";
type AccountType="employer"|"agency"|"jobseeker";
export default function AccountHome({user,onSignOut}:{user:User,onSignOut:()=>void}){
 const [message,setMessage]=useState("Preparing your account...");
 const [accountType,setAccountType]=useState<AccountType|null>(null);
 const [page,setPage]=useState("Overview");
 useEffect(()=>{let active=true;
  async function setup(){
   if(!supabase)return;
   const meta=user.user_metadata||{};
   const kind:AccountType=meta.account_type==="agency"?"agency":meta.account_type==="employer"?"employer":"jobseeker";
   const {data:existing,error:readError}=await supabase.from("profiles").select("account_type").eq("id",user.id).maybeSingle();
   if(readError){if(active)setMessage(readError.message);return;}
   const chosen=(existing?.account_type||kind) as AccountType;
   if(!existing){
    const {error}=await supabase.from("profiles").insert({id:user.id,full_name:String(meta.full_name||user.email||"User"),account_type:chosen});
    if(error){if(active)setMessage(error.message);return;}
   }
   if(chosen==="jobseeker"){
    const {error}=await supabase.from("jobseeker_profiles").upsert({user_id:user.id},{onConflict:"user_id",ignoreDuplicates:true});
    if(error){if(active)setMessage(error.message);return;}
   }else{
    const {data:org,error:orgReadError}=await supabase.from("organisations").select("id").eq("owner_id",user.id).limit(1);
    if(orgReadError){if(active)setMessage(orgReadError.message);return;}
    if(!org?.length){
     const name=String(meta.company_name||"My organisation").trim();
     const abn=String(meta.abn||"").trim();
     const {error}=await supabase.from("organisations").insert({owner_id:user.id,name,kind:chosen,abn:abn||null});
     if(error){if(active)setMessage(error.message);return;}
    }
   }
   if(active){setAccountType(chosen);setMessage("Your account is ready.");}
  }
  void setup();return()=>{active=false;};
 },[user.id,user.email,user.user_metadata]);
 const nav:Record<AccountType,string[]>={employer:["Overview","My Jobs","Applicants","Messages","Interviews","Team","Settings"],agency:["Overview","Clients","Jobs","Candidates","Submissions","Messages","Settings"],jobseeker:["Overview","Find Jobs","My Applications","Profile","Messages","Interviews","Settings"]};
 const title:Record<AccountType,string>={employer:"Employer",agency:"Recruitment agency",jobseeker:"Jobseeker"};
 if(!accountType)return <div className="auth-page"><section className="auth-card"><div className="auth-logo">HireFlow</div><h1>Setting up your workspace</h1><p role="status">{message}</p><p>Signed in as {user.email}</p><button className="auth-submit" onClick={onSignOut}>Sign out</button></section></div>;
 return <div className="shell">
 <aside className="sidebar">
  <div className="brand"><span className="brandmark"><BriefcaseBusiness size={22}/></span><span>Hire<span className="accent">Flow</span><small>SMART RECRUITMENT</small></span></div>
  <div className="workspace-label">{title[accountType].toUpperCase()} WORKSPACE</div>
  <nav aria-label="Main navigation">{nav[accountType].map(item=><button key={item} className={page===item?"active":""} onClick={()=>setPage(item)}>{item==="Overview"?<LayoutDashboard size={17}/>:item==="Messages"?<MessageSquare size={17}/>:item==="Interviews"?<CalendarDays size={17}/>:item==="Clients"?<Building2 size={17}/>:<Users size={17}/>} {item}</button>)}</nav>
  <div className="sidebar-foot"><ShieldCheck size={17}/> Authenticated · Development</div>
 </aside>
 <main className="main">
  <header><div><span className="eyebrow">{title[accountType].toUpperCase()} DASHBOARD</span><h1>{page==="Overview"?"Welcome to HireFlow":page}</h1><p>Signed in as {user.email}</p></div><button className="demo-pill auth-open" onClick={onSignOut}>Sign out</button></header>
  {(page==="My Jobs"||page==="Jobs")&&accountType!=="jobseeker"?<JobCreator user={user}/>:page==="Overview"?<>
   <section className="metrics">{(accountType==="employer"?["Active jobs","Applicants","Interviews","Messages"]:accountType==="agency"?["Clients","Open jobs","Submissions","Messages"]:["Applications","Saved jobs","Interviews","Messages"]).map((label,i)=>{const Icon=[BriefcaseBusiness,Users,CalendarDays,MessageSquare][i];return <article className="metric" key={label}><div className="metric-icon"><Icon size={20}/></div><span>{label}</span><strong>—</strong></article>;})}</section>
   <section className="panel"><div className="panel-head"><div><h2>{title[accountType]} dashboard</h2><p>Your account is connected to HireFlow Development.</p></div><span className="tag">Development</span></div>
    <p>{message}</p><p>Job advertising, applications, interviews and messaging will appear here as those features are built. No fictional recruitment figures are shown in signed-in accounts.</p>
   </section>
   <section className="next"><h2>Getting started</h2><p>{accountType==="employer"?"Your employer workspace is ready for job advertising features.":accountType==="agency"?"Your agency workspace is ready for client and recruitment features.":"Your jobseeker workspace is ready for your profile and applications."}</p></section>
  </>:<section className="panel empty"><div className="empty-icon"><Filter size={28}/></div><h2>{page}</h2><p>This feature is being developed for your {title[accountType].toLowerCase()} account. It is not yet connected to live recruitment data.</p><button onClick={()=>setPage("Overview")}>Back to overview</button></section>}
 </main>
 </div>;
}
