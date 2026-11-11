import {useState} from "react";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
pdfjs.GlobalWorkerOptions.workerSrc=pdfWorker;
export type ResumeEntry={name:string;detail:string};
export type ResumeDraft={headline:string;summary:string;experience:ResumeEntry[];qualifications:ResumeEntry[];licences:ResumeEntry[]};
const headings=/^(experience|employment history|work history|professional experience|education|qualifications|certifications|certificates|licences|licenses|tickets|skills|professional summary|profile|summary|references|contact|projects)\s*:?$/i;
function parse(text:string):ResumeDraft{
 const lines=text.replace(/\r/g,"\n").split(/\n/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
 const sections:Record<string,string[]>={};let section="intro";
 for(const line of lines){if(headings.test(line)){section=line.replace(/:$/,"").toLowerCase();continue;}(sections[section]??=[]).push(line);}
 const pick=(words:string[])=>Object.entries(sections).filter(([k])=>words.some(w=>k.includes(w))).flatMap(([,v])=>v);
 const entries=(words:string[])=>pick(words).filter(x=>x.length>2).slice(0,20).map(name=>({name:name.slice(0,180),detail:""}));
 const intro=[...(sections["professional summary"]||[]),...(sections["profile"]||[]),...(sections["summary"]||[])].join(" ");
 return {headline:(sections.intro||[]).find(x=>/manager|driver|assistant|engineer|technician|operator|administrator|officer|specialist|developer|nurse|teacher/i.test(x))?.slice(0,160)||"",summary:(intro||lines.slice(0,5).join(" ")).slice(0,3000),experience:entries(["experience","employment","work history"]),qualifications:entries(["education","qualification","certificat"]),licences:entries(["licence","license","ticket"])};
}
async function extract(file:File){
 if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf")){
  const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const parts:string[]=[];
  for(let i=1;i<=Math.min(doc.numPages,20);i++){const page=await doc.getPage(i);const content=await page.getTextContent();parts.push(content.items.map(item=>("str" in item?item.str+("hasEOL" in item&&item.hasEOL?"\\n":" "):"")).join(""));}
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
 async function read(selected:File|null){setFile(selected);setDraft(null);if(!selected)return;if(selected.size>10485760){setMessage("Maximum resume size is 10 MB.");return;}setBusy(true);setMessage("");try{const text=await extract(selected);if(text.trim().length<40)throw new Error("Not enough selectable text was found. Scanned PDFs need OCR, which is not yet supported.");setDraft(parse(text));setMessage("Resume read locally. Review the suggested information before applying it.");}catch(e){setMessage(e instanceof Error?e.message:"Unable to read resume.");}finally{setBusy(false);}}
 async function apply(){if(!draft||!file)return;setBusy(true);try{if(file.type==="application/pdf"){await onUpload(file);}onApply(draft);setMessage("Suggestions added to your profile editor. Click Save Profile to keep them.");}catch(e){setMessage(e instanceof Error?e.message:"Unable to import resume.");}finally{setBusy(false);}}
 return <section className="panel"><h2>Build profile from resume</h2><p>Upload a text-based PDF or Word (.docx) resume. HireFlow reads it in your browser and suggests profile details. You review everything before saving. No external AI service receives the resume.</p>
 <label>Choose resume<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={busy} onChange={e=>void read(e.target.files?.[0]||null)}/></label>
 {draft&&<div className="screening-details"><h3>Review extracted information</h3><label>Suggested headline<input value={draft.headline} onChange={e=>setDraft({...draft,headline:e.target.value})}/></label><label>Suggested summary<textarea rows={4} value={draft.summary} onChange={e=>setDraft({...draft,summary:e.target.value})}/></label>
 {(["experience","qualifications","licences"] as const).map(key=><div key={key}><h4>{key} ({draft[key].length})</h4>{draft[key].map((entry,i)=><div className="profile-entry" key={i}><input aria-label={key+" entry"} value={entry.name} onChange={e=>setDraft({...draft,[key]:draft[key].map((x,j)=>i===j?{...x,name:e.target.value}:x)})}/><button onClick={()=>setDraft({...draft,[key]:draft[key].filter((_,j)=>j!==i)})}>Remove</button></div>)}</div>)}
 <button className="auth-submit" disabled={busy} onClick={()=>void apply()}>Use reviewed suggestions</button></div>}
 {message&&<p role="status" className="job-status">{message}</p>}
 </section>;
}
