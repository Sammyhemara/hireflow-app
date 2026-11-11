import {useEffect,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {supabase} from "./supabase";
import SharedApplicantDocuments from "./SharedApplicantDocuments";
import {Users,CheckCircle2,Clock3,XCircle,Search,ChevronDown,ChevronUp,BriefcaseBusiness,ShieldCheck} from "lucide-react";
type Job={id:string;title:string};
type Question={text:string;required:boolean;expected_answer?:boolean};
type Applicant={id:string;job_id:string;applicant_id:string;applicant_name:string;answers:(boolean|null)[];cover_note:string;screening_snapshot:Question[];screening_snapshot_source:string;screening_result:string;screening_explanation:string;review_status:string;created_at:string};
const groups=[["meets_requirements","Meets Requirements"],["needs_review","Needs Review"],["does_not_meet_requirements","Does Not Meet Requirements"]] as const;
function outcome(q:Question,answer:boolean|null):string{
 if(!q.required)return "Preferred — human review";
 if(answer===null)return "Unanswered — review required";
 if(typeof q.expected_answer!=="boolean")return "Expected answer not configured";
 return answer===q.expected_answer?"Essential requirement matched":"Essential requirement not matched";
}
export default function ApplicantReview({user}:{user:User}){
 const [jobs,setJobs]=useState<Job[]>([]),[apps,setApps]=useState<Applicant[]>([]),[message,setMessage]=useState(""),[loading,setLoading]=useState(true);
 const [search,setSearch]=useState(""),[jobFilter,setJobFilter]=useState("all"),[stage,setStage]=useState("all"),[expanded,setExpanded]=useState<string|null>(null);
 useEffect(()=>{let alive=true;async function load(){
  if(!supabase)return;
  const {data:orgs,error:oe}=await supabase.from("organisations").select("id").eq("owner_id",user.id);
  if(oe){if(alive){setMessage(oe.message);setLoading(false);}return;}
  const ids=(orgs||[]).map(o=>o.id);
  if(!ids.length){if(alive)setLoading(false);return;}
  const {data:jobData,error:je}=await supabase.from("jobs").select("id,title").in("organisation_id",ids);
  if(je){if(alive){setMessage(je.message);setLoading(false);}return;}
  const list=(jobData||[]) as Job[];
  if(alive)setJobs(list);
  if(!list.length){if(alive)setLoading(false);return;}
  const {data,error}=await supabase.from("job_applications").select("id,job_id,applicant_id,applicant_name,answers,cover_note,screening_snapshot,screening_snapshot_source,screening_result,screening_explanation,review_status,created_at").in("job_id",list.map(j=>j.id)).order("created_at",{ascending:false});
  if(error){if(alive){setMessage(error.message);setLoading(false);}return;}
  const applications=(data||[]) as Applicant[];
  if(alive)setApps(applications);
  if(alive)setLoading(false);
 }void load();return()=>{alive=false;};},[user.id]);
 async function update(app:Applicant,status:string){if(!supabase)return;setMessage("");const {data,error}=await supabase.from("job_applications").update({review_status:status}).eq("id",app.id).select("id,review_status").single();if(error)setMessage(error.message);else if(data)setApps(prev=>prev.map(a=>a.id===app.id?{...a,review_status:status}:a));}
 const filtered=apps.filter(a=>(jobFilter==="all"||a.job_id===jobFilter)&&(stage==="all"||a.review_status===stage)&&((a.applicant_name||"").toLowerCase().includes(search.toLowerCase())||(jobs.find(j=>j.id===a.job_id)?.title||"").toLowerCase().includes(search.toLowerCase())));
 const stages=[{key:"new",label:"New",icon:Users},{key:"reviewing",label:"Reviewing",icon:Clock3},{key:"shortlisted",label:"Shortlisted",icon:CheckCircle2},{key:"declined",label:"Declined",icon:XCircle}];
 return <div className="recruiter-workspace">
 <section className="recruiter-hero"><div><span className="candidate-kicker"><BriefcaseBusiness size={15}/> RECRUITMENT WORKSPACE</span><h2>Find your next great hire.</h2><p>Review applications, check requirements and manage decisions in one place.</p></div><div className="recruiter-hero-count"><strong>{apps.length}</strong><span>Total applications</span></div></section>
 <div className="recruiter-stats"><div><Users size={19}/><strong>{apps.length}</strong><span>Applications</span></div><div><Clock3 size={19}/><strong>{apps.filter(a=>a.review_status==="reviewing").length}</strong><span>In review</span></div><div><CheckCircle2 size={19}/><strong>{apps.filter(a=>a.review_status==="shortlisted").length}</strong><span>Shortlisted</span></div><div><ShieldCheck size={19}/><strong>{apps.filter(a=>a.screening_result==="meets_requirements").length}</strong><span>Screening matches</span></div></div>
 <section className="panel recruiter-pipeline"><div className="panel-head"><div><h2>Hiring pipeline</h2><p>Select a stage to filter applications. Screening results remain separate from hiring decisions.</p></div><span className="tag">Human-led hiring</span></div><div className="recruiter-stage-grid">{stages.map(({key,label,icon:Icon})=><button key={key} className={"recruiter-stage "+(stage===key?"selected":"")} onClick={()=>setStage(stage===key?"all":key)}><Icon size={19}/><strong>{apps.filter(a=>a.review_status===key).length}</strong><span>{label}</span></button>)}</div></section>
 <section className="panel recruiter-applications"><div className="panel-head"><div><h2>Applicant inbox</h2><p>{filtered.length} of {apps.length} applications · Review each candidate individually.</p></div></div>
 <div className="recruiter-toolbar"><label className="recruiter-search"><Search size={18}/><input aria-label="Search candidates or jobs" placeholder="Search candidates or jobs..." value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="Filter by job" value={jobFilter} onChange={e=>setJobFilter(e.target.value)}><option value="all">All jobs</option>{jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>)}</select><select aria-label="Filter by review stage" value={stage} onChange={e=>setStage(e.target.value)}><option value="all">All stages</option>{stages.map(x=><option key={x.key} value={x.key}>{x.label}</option>)}</select></div>
 {loading?<p>Loading applications...</p>:apps.length===0?<div className="recruiter-empty">No applications received yet. New applicants will appear here.</div>:filtered.length===0?<div className="recruiter-empty">No applications match these filters.</div>:groups.map(([key,label])=>{const matches=filtered.filter(a=>a.screening_result===key);return matches.length>0?<div className="review-group" key={key}><div className="recruiter-group-heading"><h3>{label}</h3><span>{matches.length}</span></div>{matches.map(a=><article className="review-card recruiter-card" key={a.id}>
  <div className="recruiter-card-head"><div className="recruiter-avatar">{(a.applicant_name||"A").trim().slice(0,1).toUpperCase()}</div><div className="recruiter-card-title"><h3>{a.applicant_name||"Applicant"}</h3><p>{jobs.find(j=>j.id===a.job_id)?.title||"Job"} · Applied {new Date(a.created_at).toLocaleDateString("en-AU")}</p></div><span className={"recruiter-status status-"+a.review_status}>{a.review_status==="new"?"New":a.review_status==="reviewing"?"Reviewing":a.review_status==="shortlisted"?"Shortlisted":"Declined"}</span></div>
  <p className="recruiter-screening"><strong>Screening guidance:</strong> {a.screening_explanation}</p>
  <div className="recruiter-card-actions"><label>Human decision <select value={a.review_status} onChange={e=>void update(a,e.target.value)}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="shortlisted">Shortlisted</option><option value="declined">Declined</option></select></label><button className="recruiter-details-button" onClick={()=>setExpanded(expanded===a.id?null:a.id)}>{expanded===a.id?"Hide details":"View candidate details"} {expanded===a.id?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button></div>
  {expanded===a.id&&<div className="recruiter-detail-panel"><p>Applicant reference: {a.applicant_id.slice(0,8)}</p>
  {a.screening_snapshot_source!=="submission"&&<p className="job-status">Legacy application: screening questions were reconstructed from the available job record and may differ from those originally submitted.</p>}
  <div className="screening-details"><h4>Screening questions and answers</h4>{a.screening_snapshot.length===0?<p>No saved questions available.</p>:a.screening_snapshot.map((q,i)=><div className="screening-detail" key={i}><strong>{i+1}. {q.text}</strong><p>Applicant: {a.answers[i]===null||a.answers[i]===undefined?"Unanswered":a.answers[i]?"Yes":"No"} · {q.required?"Essential":"Preferred"}</p><p>{outcome(q,a.answers[i]??null)}</p></div>)}</div>
  <SharedApplicantDocuments applicationIds={[a.id]}/>
  {a.cover_note&&<p className="job-preline"><strong>Cover note:</strong> {a.cover_note}</p>}</div>}
 </article>)}</div>:null;})}
 {message&&<p role="status" className="job-status">{message}</p>}
 </section></div>;
}
