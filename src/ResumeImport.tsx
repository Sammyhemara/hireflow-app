import {useState} from "react";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
pdfjs.GlobalWorkerOptions.workerSrc=pdfWorker;
export type ResumeEntry={name:string;detail:string};
export type ResumeDraft={headline:string;summary:string;experience:ResumeEntry[];qualifications:ResumeEntry[];licences:ResumeEntry[]};
const sectionNames:Record<string,string>={
 "experience":"experience","employment history":"experience","work history":"experience","professional experience":"experience","career history":"experience",
 "education":"qualifications","education and training":"qualifications","qualifications":"qualifications","certifications":"qualifications","certificates":"qualifications","training":"qualifications",
 "licences":"licences","licenses":"licences","licences and tickets":"licences","licenses and tickets":"licences","tickets":"licences","licences & tickets":"licences",
 "professional summary":"summary","personal profile":"summary","career profile":"summary","profile":"summary","summary":"summary","about me":"summary",
 "skills":"other","key skills":"other","references":"other","contact":"other","projects":"other","achievements":"other"
};
function parse(text:string):ResumeDraft{
 const lines=text.replace(/\r/g,"\n").split(/\n/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
 const sections:Record<string,string[]>={intro:[]};let section="intro";
 for(const line of lines){
  const normalized=line.toLowerCase().replace(/[:\s]+$/,"").replace(/^[\s•*-]+/,"").trim();
  if(sectionNames[normalized]){section=sectionNames[normalized];sections[section]??=[];continue;}
  (sections[section]??=[]).push(line);
 }
 const entries=(key:string):ResumeEntry[]=>{
  const source=sections[key]||[];
  const result:ResumeEntry[]=[];
  for(const line of source){
   if(/^(references available|page \d+|email:|phone:)/i.test(line))continue;
   const clean=line.replace(/^[•\-*]\s*/,"").slice(0,240);
   if(clean.length<3)continue;
   if(/^(19|20)\d{2}\s*[-–]\s*((19|20)\d{2}|present|current)$/i.test(clean)&&result.length){result[result.length-1].detail=clean;continue;}
   result.push({name:clean,detail:""});
   if(result.length>=20)break;
  }
  return result;
 };
 const intro=sections.intro||[];
 const summary=(sections.summary||[]).join(" ").slice(0,3000);
 const headline=intro.find(x=>/manager|driver|assistant|engineer|technician|operator|administrator|officer|specialist|developer|nurse|teacher|supervisor|coordinator|consultant|electrician|plumber/i.test(x)&&x.length<130)||"";
 return {headline:headline.slice(0,160),summary,experience:entries("experience"),qualifications:entries("qualifications"),licences:entries("licences")};
}
async function extract(file:File){
 if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf")){
  const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const parts:string[]=[];
  for(let i=1;i<=Math.min(doc.numPages,20);i++){const page=await doc.getPage(i);const content=await page.getTextContent();parts.push(content.items.map(item=>("str" in item?item.str+("hasEOL" in item&&item.hasEOL?"\n":" "):"")).join(""));}
  return parts.join("\n");
 }
 if(file.name.toLowerCase().endsWith(".docx")){
  const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
  return result.value;
 }
 throw new Error("Choose a PDF or Word (.docx) resume.");
}
export default function ResumeImport({onApply,onUpload}:{onApply:(draft:ResumeDraft)=>void;onUpload:(file:File)=>Promise<void>}){
 const [draft,setDraft]=useState<ResumeDraft|null>(null),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [includeUpload,setIncludeUpload]=useState(false);
 async function read(selected:File|null){setFile(selected);setDraft(null);if(!selected)return;if(selected.size>10485760){setMessage("Maximum resume size is 10 MB.");return;}setBusy(true);setMessage("");try{const text=await extract(selected);if(text.trim().length<40)throw new Error("Not enough selectable text was found. Scanned PDFs need OCR, which is not yet supported.");const suggested=parse(text);setDraft(suggested);setMessage("Resume text extracted locally. Check each suggestion carefully; extraction is not AI verification.");}catch(e){setMessage(e instanceof Error?e.message:"Unable to read resume.");}finally{setBusy(false);}}
 async function apply(){if(!draft||!file)return;setBusy(true);try{if(includeUpload&&file.type==="application/pdf"){await onUpload(file);}onApply(draft);setMessage("Suggestions added to your profile editor. Click Save Profile to keep them.");}catch(e){setMessage(e instanceof Error?e.message:"Unable to import resume.");}finally{setBusy(false);}}
 return <section className="panel"><h2>Build profile from resume</h2><p>Upload a text-based PDF or Word (.docx) resume. HireFlow reads it in your browser and suggests profile details. You review everything before saving. No external AI service receives the resume.</p>
 <label>Choose resume<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={busy} onChange={e=>void read(e.target.files?.[0]||null)}/></label>
 {draft&&<div className="screening-details"><h3>Review extracted information</h3><p>Only information you approve will be added. Existing profile entries are preserved.</p><label>Suggested headline<input value={draft.headline} onChange={e=>setDraft({...draft,headline:e.target.value})}/></label><label>Suggested summary<textarea rows={4} value={draft.summary} onChange={e=>setDraft({...draft,summary:e.target.value})}/></label>
 {(["experience","qualifications","licences"] as const).map(key=><div key={key}><h4>{key} ({draft[key].length})</h4>{draft[key].map((entry,i)=><div className="profile-entry" key={i}><input aria-label={key+" entry"} value={entry.name} onChange={e=>setDraft({...draft,[key]:draft[key].map((x,j)=>i===j?{...x,name:e.target.value}:x)})}/><input aria-label={key+" details"} value={entry.detail} placeholder="Dates, employer or issuing body" onChange={e=>setDraft({...draft,[key]:draft[key].map((x,j)=>i===j?{...x,detail:e.target.value}:x)})}/><button onClick={()=>setDraft({...draft,[key]:draft[key].filter((_,j)=>j!==i)})}>Remove</button></div>)}</div>)}
 {file?.type==="application/pdf"&&<label className="resume-save-choice"><input type="checkbox" checked={includeUpload} onChange={e=>setIncludeUpload(e.target.checked)}/> Also save this PDF in my private document library</label>}<button className="auth-submit" disabled={busy} onClick={()=>void apply()}>Apply reviewed suggestions</button></div>}
 {message&&<p role="status" className="job-status">{message}</p>}
 </section>;
}
