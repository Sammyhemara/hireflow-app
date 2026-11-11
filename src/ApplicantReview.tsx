import {useEffect,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {supabase} from "./supabase";
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
 return <section className="panel"><div className="panel-head"><div><h2>Applicant review</h2><p>Screening is informational. Only the reviewer changes hiring status.</p></div><span className="tag">Human review</span></div>
 {loading?<p>Loading applications...</p>:apps.length===0?<p>No applications received yet.</p>:groups.map(([key,label])=><div className="review-group" key={key}><h3>{label} ({apps.filter(a=>a.screening_result===key).length})</h3>{apps.filter(a=>a.screening_result===key).map(a=><article className="review-card" key={a.id}>
  <h3>{a.applicant_name||"Applicant"} — {jobs.find(j=>j.id===a.job_id)?.title||"Job"}</h3>
  <p>Applicant reference: {a.applicant_id.slice(0,8)} · Submitted {new Date(a.created_at).toLocaleDateString("en-AU")}</p>
  <p><strong>Screening:</strong> {a.screening_explanation}</p>
  {a.screening_snapshot_source!=="submission"&&<p className="job-status">Legacy application: questions shown are reconstructed from the currently available job record and may differ from those originally submitted.</p>}
  <div className="screening-details"><h4>Questions and answers</h4>{a.screening_snapshot.length===0?<p>No saved questions available.</p>:a.screening_snapshot.map((q,i)=><div className="screening-detail" key={i}><strong>{i+1}. {q.text}</strong><p>Applicant: {a.answers[i]===null||a.answers[i]===undefined?"Unanswered":a.answers[i]?"Yes":"No"} · {q.required?"Essential":"Preferred"}</p><p>{outcome(q,a.answers[i]??null)}</p></div>)}</div>
  {a.cover_note&&<p className="job-preline"><strong>Cover note:</strong> {a.cover_note}</p>}
  <label><strong>Human review decision</strong> <select value={a.review_status} onChange={e=>void update(a,e.target.value)}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="shortlisted">Shortlisted</option><option value="declined">Declined</option></select></label>
 </article>)}</div>)}
 {message&&<p role="status" className="job-status">{message}</p>}
 </section>;
}
