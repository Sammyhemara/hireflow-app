import {useEffect,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {supabase} from "./supabase";
import {ArrowUpRight,BriefcaseBusiness,Users,CheckCircle2,Clock3,FileText,Search,ShieldCheck,Sparkles,MoveRight,CalendarDays,MessageSquare} from "lucide-react";
type Role="employer"|"agency"|"jobseeker";
type Stats={jobs:number|null;applications:number|null;shortlisted:number|null;reviewing:number|null;published:number|null;profile:boolean|null};
export default function WorkspaceOverview({user,role,onNavigate}:{user:User;role:Role;onNavigate:(page:string)=>void}){
 const [stats,setStats]=useState<Stats>({jobs:null,applications:null,shortlisted:null,reviewing:null,published:null,profile:null});
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;async function load(){if(!supabase)return;
 if(role==="jobseeker"){
  const [applications,jobs,profile]=await Promise.all([supabase.from("job_applications").select("id,review_status",{count:"exact",head:false}).eq("applicant_id",user.id),supabase.from("jobs").select("id",{count:"exact",head:true}).eq("status","published"),supabase.from("jobseeker_profiles").select("headline,summary").eq("user_id",user.id).maybeSingle()]);
  if(active){setStats({jobs:null,applications:applications.count,shortlisted:(applications.data||[]).filter(x=>x.review_status==="shortlisted").length,reviewing:(applications.data||[]).filter(x=>x.review_status==="reviewing").length,published:jobs.count,profile:Boolean(profile.data?.headline||profile.data?.summary)});setError(applications.error?.message||jobs.error?.message||profile.error?.message||"");}
 }else{
  const orgs=await supabase.from("organisations").select("id").eq("owner_id",user.id);
  if(orgs.error){if(active)setError(orgs.error.message);return;}
  const ids=(orgs.data||[]).map(x=>x.id);
  if(!ids.length){if(active)setStats({jobs:0,applications:0,shortlisted:0,reviewing:0,published:0,profile:null});return;}
  const jobs=await supabase.from("jobs").select("id,status").in("organisation_id",ids);
  if(jobs.error){if(active)setError(jobs.error.message);return;}
  const list=jobs.data||[];
  const applications=list.length?await supabase.from("job_applications").select("id,review_status").in("job_id",list.map(x=>x.id)):null;
  if(active){setStats({jobs:list.length,applications:applications?.data?.length??0,shortlisted:(applications?.data||[]).filter(x=>x.review_status==="shortlisted").length,reviewing:(applications?.data||[]).filter(x=>x.review_status==="reviewing").length,published:list.filter(x=>x.status==="published").length,profile:null});setError(applications?.error?.message||"");}
 }
 }void load();return()=>{active=false;};},[user.id,role]);
 const seeker=role==="jobseeker",agency=role==="agency";
 const primary=seeker?"Find Jobs":agency?"Jobs":"My Jobs",secondary=seeker?"Profile":agency?"Candidates":"Applicants";
 const tiles=seeker?[{label:"My applications",value:stats.applications,icon:FileText},{label:"Available jobs",value:stats.published,icon:Search},{label:"In review",value:stats.reviewing,icon:Clock3},{label:"Shortlisted",value:stats.shortlisted,icon:CheckCircle2}]:[{label:"Total jobs",value:stats.jobs,icon:BriefcaseBusiness},{label:"Published jobs",value:stats.published,icon:ArrowUpRight},{label:"Applications",value:stats.applications,icon:Users},{label:"Shortlisted",value:stats.shortlisted,icon:CheckCircle2}];
 const greeting=seeker?"Your next opportunity starts here.":agency?"Every placement, one powerful workspace.":"Build your team with confidence.";
 const description=seeker?"Discover roles, manage applications and build a profile employers can understand.":agency?"Bring jobs, candidates and hiring decisions into one streamlined workflow.":"From job advertising to your next great hire, keep every step moving.";
 return <div className="overview-dashboard">
 <section className="overview-hero"><div className="overview-hero-content"><span className="candidate-kicker"><Sparkles size={16}/> YOUR HIRING ADVANTAGE</span><h2>{greeting}</h2><p>{description}</p><div className="overview-hero-actions"><button onClick={()=>onNavigate(primary)}>{seeker?"Explore opportunities":"Manage vacancies"} <ArrowUpRight size={17}/></button><button className="overview-hero-outline" onClick={()=>onNavigate(secondary)}>{seeker?"Complete my profile":"Review candidates"} <MoveRight size={17}/></button></div></div><div className="overview-hero-decoration"><div className="overview-orbit"><BriefcaseBusiness size={36}/></div><span>HIRE SMARTER</span></div></section>
 <div className="overview-metrics">{tiles.map(({label,value,icon:Icon})=><article className="overview-metric" key={label}><div className="overview-metric-top"><span>{label}</span><Icon size={20}/></div><strong>{value===null?"—":value}</strong><small>{value===null?"Loading live data":"Live account data"}</small></article>)}</div>
 <div className="overview-columns"><section className="panel overview-main-panel"><div className="panel-head"><div><span className="candidate-step">YOUR WORKSPACE</span><h2>Quick actions</h2><p>Pick up right where you left off.</p></div></div><div className="overview-action-grid">
 <button onClick={()=>onNavigate(primary)}><span className="overview-action-icon"><BriefcaseBusiness size={21}/></span><span><strong>{seeker?"Find your next role":"Manage job advertisements"}</strong><small>{seeker?"Browse published opportunities":"Create, edit and publish vacancies"}</small></span><ArrowUpRight size={19}/></button>
 <button onClick={()=>onNavigate(secondary)}><span className="overview-action-icon mint">{seeker?<FileText size={21}/>:<Users size={21}/>}</span><span><strong>{seeker?"Build your candidate profile":"Review applications"}</strong><small>{seeker?"Import your resume and manage credentials":"Screen and shortlist candidates"}</small></span><ArrowUpRight size={19}/></button>
 <button onClick={()=>onNavigate(seeker?"My Applications":agency?"Candidates":"Applicants")}><span className="overview-action-icon violet"><CheckCircle2 size={21}/></span><span><strong>{seeker?"Track applications":"Move candidates forward"}</strong><small>{seeker?"See your current review status":"Manage human hiring decisions"}</small></span><ArrowUpRight size={19}/></button>
 </div></section><section className="panel overview-side-panel"><span className="candidate-step">BUILT FOR TRUST</span><h2>Your HireFlow advantage</h2><div className="overview-trust-item"><ShieldCheck size={20}/><div><strong>Privacy-first</strong><p>Candidate documents stay private until explicitly shared.</p></div></div><div className="overview-trust-item"><CheckCircle2 size={20}/><div><strong>Transparent screening</strong><p>Requirements are explained; people make hiring decisions.</p></div></div><div className="overview-trust-item"><CalendarDays size={20}/><div><strong>One connected workflow</strong><p>More recruitment tools are being developed here.</p></div></div></section></div>
 {error&&<p role="status" className="job-status">{error}</p>}
 <div className="overview-footer"><MessageSquare size={16}/> HireFlow Development · Real account data, no simulated recruitment figures</div>
 </div>;
}
