import {useEffect,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {supabase} from "./supabase";
type Entry={name:string;detail:string};
type CandidateProfile={headline:string;preferred_location:string;summary:string;availability:string;experience:Entry[];qualifications:Entry[];licences:Entry[]};
type Doc={id:string;storage_path:string;document_type:string;original_filename:string;verification_status:string;created_at:string};
const blank:CandidateProfile={headline:"",preferred_location:"",summary:"",availability:"not_specified",experience:[],qualifications:[],licences:[]};
const bucket="hireflow-candidate-documents";
export default function CandidateProfileHub({user}:{user:User}){
 const [profile,setProfile]=useState<CandidateProfile>(blank),[docs,setDocs]=useState<Doc[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 useEffect(()=>{let alive=true;async function load(){if(!supabase)return;const [pr,dr]=await Promise.all([supabase.from("jobseeker_profiles").select("headline,preferred_location,summary,availability,experience,qualifications,licences").eq("user_id",user.id).maybeSingle(),supabase.from("candidate_documents").select("id,storage_path,document_type,original_filename,verification_status,created_at").eq("user_id",user.id).order("created_at",{ascending:false})]);if(alive){if(pr.error)setNotice(pr.error.message);else if(pr.data)setProfile({...blank,...pr.data} as CandidateProfile);if(dr.error)setNotice(dr.error.message);else setDocs((dr.data||[]) as Doc[]);setLoading(false);}}void load();return()=>{alive=false;};},[user.id]);
 function field<K extends keyof CandidateProfile>(key:K,value:CandidateProfile[K]){setProfile(p=>({...p,[key]:value}));}
 function add(key:"experience"|"qualifications"|"licences"){setProfile(p=>({...p,[key]:[...p[key],{name:"",detail:""}]}));}
 function entry(key:"experience"|"qualifications"|"licences",i:number,k:keyof Entry,v:string){setProfile(p=>({...p,[key]:p[key].map((e,j)=>i===j?{...e,[k]:v}:e)}));}
 async function save(){if(!supabase)return;setBusy(true);setNotice("");const {error}=await supabase.from("jobseeker_profiles").upsert({user_id:user.id,...profile});setNotice(error?error.message:"Candidate profile saved.");setBusy(false);}
 async function upload(file:File|null,kind:string){if(!supabase||!file)return;if(file.size>10485760){setNotice("Files must be 10 MB or smaller.");return;}const allowed=["application/pdf","image/jpeg","image/png"];if(!allowed.includes(file.type)){setNotice("Use PDF, JPG or PNG.");return;}setBusy(true);setNotice("");const ext=file.type==="application/pdf"?"pdf":file.type==="image/png"?"png":"jpg";const path=user.id+"/"+crypto.randomUUID()+"."+ext;const {error:uploadError}=await supabase.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});if(uploadError){setNotice(uploadError.message);setBusy(false);return;}const {data,error}=await supabase.from("candidate_documents").insert({user_id:user.id,storage_path:path,document_type:kind,original_filename:file.name}).select("id,storage_path,document_type,original_filename,verification_status,created_at").single();if(error){await supabase.storage.from(bucket).remove([path]);setNotice(error.message);}else if(data){setDocs(prev=>[data as Doc,...prev]);setNotice("Document uploaded privately. Verification status: Unverified.");}setBusy(false);}
 async function view(doc:Doc){if(!supabase)return;const {data,error}=await supabase.storage.from(bucket).createSignedUrl(doc.storage_path,60);if(error)setNotice(error.message);else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");}
 async function remove(doc:Doc){if(!supabase)return;setBusy(true);const {error:storageError}=await supabase.storage.from(bucket).remove([doc.storage_path]);if(storageError){setNotice(storageError.message);setBusy(false);return;}const {error}=await supabase.from("candidate_documents").delete().eq("id",doc.id);if(error)setNotice(error.message);else{setDocs(prev=>prev.filter(d=>d.id!==doc.id));setNotice("Document removed.");}setBusy(false);}
 if(loading)return <section className="panel"><p>Loading your candidate profile...</p></section>;
 return <div className="job-creator">
 <section className="panel"><div className="panel-head"><div><h2>My Candidate Profile</h2><p>Build your reusable profile for future applications.</p></div><span className="tag">Private profile</span></div>
 <div className="job-form-grid">
 <label>Professional headline<input maxLength={160} value={profile.headline||""} onChange={e=>field("headline",e.target.value)} placeholder="e.g. Experienced HR Driver"/></label>
 <label>Preferred location<input maxLength={160} value={profile.preferred_location||""} onChange={e=>field("preferred_location",e.target.value)} placeholder="e.g. Sydney NSW"/></label>
 <label>Availability<select value={profile.availability} onChange={e=>field("availability",e.target.value)}><option value="not_specified">Not specified</option><option value="immediately">Immediately</option><option value="two_weeks">Within 2 weeks</option><option value="one_month">Within a month</option><option value="flexible">Flexible</option></select></label>
 <label className="job-wide">Professional summary<textarea rows={4} maxLength={4000} value={profile.summary} onChange={e=>field("summary",e.target.value)} placeholder="Describe your skills and career experience"/></label>
 </div>
 {(["experience","qualifications","licences"] as const).map(key=><div className="profile-group" key={key}><h3>{key==="experience"?"Work experience":key==="qualifications"?"Qualifications":"Licences & tickets"}</h3>
 {profile[key].map((item,i)=><div className="profile-entry" key={i}><input aria-label={key+" name"} value={item.name} onChange={e=>entry(key,i,"name",e.target.value)} placeholder={key==="experience"?"Role and employer":key==="licences"?"Licence name":"Qualification name"}/><input aria-label={key+" details"} value={item.detail} onChange={e=>entry(key,i,"detail",e.target.value)} placeholder="Dates, issuing body or details"/><button onClick={()=>field(key,profile[key].filter((_,j)=>j!==i))}>Remove</button></div>)}
 <button onClick={()=>add(key)} disabled={profile[key].length>=30}>+ Add {key==="experience"?"experience":key==="licences"?"licence":"qualification"}</button></div>)}
 <div className="job-actions"><button className="auth-submit" disabled={busy} onClick={()=>void save()}>{busy?"Saving...":"Save Profile"}</button></div>
 </section>
 <section className="panel"><h2>Documents & verification</h2><p>Upload your resume, qualifications and licences. Documents remain private to your account in this phase. Uploads are not automatically verified.</p>
 <div className="document-uploads">{(["resume","qualification","licence","other"] as const).map(kind=><label key={kind} className="upload-choice">Upload {kind}<input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" disabled={busy} onChange={e=>{const file=e.target.files?.[0]||null;void upload(file,kind);e.target.value="";}}/></label>)}</div>
 {docs.length===0?<p>No documents uploaded yet.</p>:<div className="jobs">{docs.map(doc=><article className="job" key={doc.id}><div><strong>{doc.original_filename}</strong><p>{doc.document_type} · {doc.verification_status.replace(/_/g," ")}</p></div><button onClick={()=>void view(doc)}>View</button><button disabled={busy} onClick={()=>void remove(doc)}>Delete</button></article>)}</div>}
 </section>
 {notice&&<section className="panel"><p role="status">{notice}</p></section>}
 </div>;
}
