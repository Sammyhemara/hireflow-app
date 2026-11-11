import { useEffect,useState } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
type Question={text:string;required:boolean};
type Job={id:string;title:string;industry:string;location:string;employment_type:string;work_arrangement:string;salary_min:number|null;salary_max:number|null;salary_period:string;description:string;experience:string;qualifications:string;licences:string;screening_questions:Question[];status:string};
const industries=["Accounting & Finance","Administration & Office Support","Agriculture & Farming","Automotive","Construction & Trades","Education & Training","Engineering","Government & Defence","Healthcare & Medical","Hospitality & Tourism","Human Resources & Recruitment","Information Technology","Legal","Logistics, Transport & Warehousing","Manufacturing & Operations","Marketing & Communications","Mining, Resources & Energy","Real Estate & Property","Retail & Sales","Sport & Recreation","Other"];
const empty={title:"",industry:"",location:"",employment_type:"full_time",work_arrangement:"onsite",salary_min:"",salary_max:"",salary_period:"annual",description:"",experience:"",qualifications:"",licences:""};
type Form=typeof empty;
export default function JobCreator({user}:{user:User}){
 const [org,setOrg]=useState<{id:string;name:string}|null>(null);
 const [jobs,setJobs]=useState<Job[]>([]);
 const [form,setForm]=useState<Form>(empty);
 const [questions,setQuestions]=useState<Question[]>([]);
 const [editing,setEditing]=useState<string|null>(null);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;async function load(){if(!supabase)return;const {data:organisations,error}=await supabase.from("organisations").select("id,name").eq("owner_id",user.id).order("created_at",{ascending:true}).limit(1);if(!active)return;if(error){setMessage(error.message);setLoading(false);return;}const current=organisations?.[0]||null;setOrg(current);if(current){const {data,error:jobsError}=await supabase.from("jobs").select("*").eq("organisation_id",current.id).order("created_at",{ascending:false});if(active){if(jobsError)setMessage(jobsError.message);else setJobs((data||[]) as Job[]);}}if(active)setLoading(false);}void load();return()=>{active=false;};},[user.id]);
 function change<K extends keyof Form>(key:K,value:Form[K]){setForm(prev=>({...prev,[key]:value}));}
 function edit(job:Job){setEditing(job.id);setForm({title:job.title,industry:job.industry,location:job.location,employment_type:job.employment_type,work_arrangement:job.work_arrangement,salary_min:job.salary_min?.toString()||"",salary_max:job.salary_max?.toString()||"",salary_period:job.salary_period,description:job.description,experience:job.experience,qualifications:job.qualifications,licences:job.licences});setQuestions(job.screening_questions||[]);setMessage("");}
 function reset(){setEditing(null);setForm(empty);setQuestions([]);}
 async function save(status:"draft"|"published"){setMessage("");if(!supabase||!org){setMessage("No organisation is linked to your account.");return;}if(!form.title.trim()||!form.industry||!form.location.trim()){setMessage("Job title, industry and location are required.");return;}if(status==="published"&&form.description.trim().length<30){setMessage("Add a job description of at least 30 characters before publishing.");return;}if(questions.some(q=>!q.text.trim())){setMessage("Complete or remove empty screening questions.");return;}const min=form.salary_min===""?null:Number(form.salary_min),max=form.salary_max===""?null:Number(form.salary_max);if((min!==null&&(!Number.isFinite(min)||min<0))||(max!==null&&(!Number.isFinite(max)||max<0))||(min!==null&&max!==null&&min>max)){setMessage("Enter a valid salary range.");return;}setBusy(true);
 const payload={...form,salary_min:min,salary_max:max,screening_questions:questions.map(q=>({text:q.text.trim(),required:q.required})),status,published_at:status==="published"?new Date().toISOString():null};
 const query=editing?supabase.from("jobs").update(payload).eq("id",editing).eq("organisation_id",org.id).select("*").single():supabase.from("jobs").insert({...payload,organisation_id:org.id,created_by:user.id}).select("*").single();
 const {data,error}=await query;
 if(error)setMessage(error.message);else if(data){setJobs(prev=>[data as Job,...prev.filter(j=>j.id!==data.id)]);reset();setMessage(status==="published"?"Job published in your organisation workspace. Public job search is not yet enabled.":"Draft saved.");}
 setBusy(false);
 }
 if(loading)return <section className="panel"><p>Loading your organisation's jobs...</p></section>;
 if(!org)return <section className="panel"><h2>Organisation setup needed</h2><p>{message||"Please sign out and back in to finish creating your organisation."}</p></section>;
 return <div className="job-creator">
 <section className="panel"><div className="panel-head"><div><h2>{editing?"Edit job advertisement":"Create job advertisement"}</h2><p>Posting as {org.name}. Only your organisation can manage these jobs.</p></div><span className="tag">Development</span></div>
 <div className="job-form-grid">
 <label>Job title *<input required value={form.title} maxLength={160} onChange={e=>change("title",e.target.value)} placeholder="e.g. Heavy Vehicle Driver"/></label>
 <label>Industry *<select value={form.industry} onChange={e=>change("industry",e.target.value)}><option value="">Choose an industry</option>{industries.map(i=><option key={i}>{i}</option>)}</select></label>
 <label>Location *<input required value={form.location} onChange={e=>change("location",e.target.value)} placeholder="e.g. Sydney NSW"/></label>
 <label>Employment type<select value={form.employment_type} onChange={e=>change("employment_type",e.target.value)}><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="casual">Casual</option><option value="contract">Contract</option><option value="temporary">Temporary</option><option value="internship">Internship</option></select></label>
 <label>Work arrangement<select value={form.work_arrangement} onChange={e=>change("work_arrangement",e.target.value)}><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
 <label>Salary period<select value={form.salary_period} onChange={e=>change("salary_period",e.target.value)}><option value="annual">Annual</option><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
 <label>Minimum salary (AUD)<input type="number" min="0" value={form.salary_min} onChange={e=>change("salary_min",e.target.value)} placeholder="Optional"/></label>
 <label>Maximum salary (AUD)<input type="number" min="0" value={form.salary_max} onChange={e=>change("salary_max",e.target.value)} placeholder="Optional"/></label>
 <label className="job-wide">Job description * for publishing<textarea rows={5} value={form.description} onChange={e=>change("description",e.target.value)} placeholder="Describe responsibilities, benefits and what the role involves"/></label>
 <label className="job-wide">Experience requirements<textarea rows={2} value={form.experience} onChange={e=>change("experience",e.target.value)} placeholder="Required or preferred experience"/></label>
 <label className="job-wide">Qualifications<textarea rows={2} value={form.qualifications} onChange={e=>change("qualifications",e.target.value)} placeholder="Certificates, degrees or training"/></label>
 <label className="job-wide">Licences and tickets<textarea rows={2} value={form.licences} onChange={e=>change("licences",e.target.value)} placeholder="e.g. HR licence, White Card"/></label>
 </div>
 <div className="screening-editor"><h3>Applicant screening questions</h3><p>Mark a question essential if it is a mandatory requirement. Answers and screening decisions will be added in the application milestone.</p>
 {questions.map((q,i)=><div className="question-row" key={i}><input aria-label={"Question "+(i+1)} value={q.text} onChange={e=>setQuestions(prev=>prev.map((v,j)=>j===i?{...v,text:e.target.value}:v))} placeholder="e.g. Do you hold a current HR licence?"/><label><input type="checkbox" checked={q.required} onChange={e=>setQuestions(prev=>prev.map((v,j)=>j===i?{...v,required:e.target.checked}:v))}/> Essential</label><button type="button" onClick={()=>setQuestions(prev=>prev.filter((_,j)=>j!==i))}>Remove</button></div>)}
 <button type="button" disabled={questions.length>=20} onClick={()=>setQuestions(prev=>[...prev,{text:"",required:false}])}>+ Add question</button>
 </div>
 {message&&<p role="status" className="job-status">{message}</p>}
 <div className="job-actions"><button disabled={busy} onClick={()=>void save("draft")}>Save Draft</button><button disabled={busy} className="auth-submit" onClick={()=>void save("published")}>{busy?"Saving...":"Publish Job"}</button>{editing&&<button onClick={reset}>Cancel edit</button>}</div>
 </section>
 <section className="panel"><h2>Your job advertisements</h2><p>{jobs.length} saved job{jobs.length===1?"":"s"}</p>{jobs.length===0?<p>No jobs yet. Create your first advertisement above.</p>:<div className="jobs">{jobs.map(job=><article className="job" key={job.id}><div><h3>{job.title}</h3><p>{job.location} · {job.industry}</p></div><span className="tag">{job.status==="published"?"Published":"Draft"}</span><button onClick={()=>edit(job)}>Edit</button></article>)}</div>}</section>
 </div>;
}
