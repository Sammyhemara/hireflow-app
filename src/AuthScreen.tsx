import { useState, type FormEvent } from "react";
import { ArrowLeft, BriefcaseBusiness, Building2, UserRound } from "lucide-react";
import { supabase } from "./supabase";
type AccountType = "employer" | "agency" | "jobseeker";
type Mode = "register" | "login" | "forgot";
export default function AuthScreen({onBack}:{onBack:()=>void}) {
 const [mode,setMode]=useState<Mode>("register");
 const [type,setType]=useState<AccountType>("employer");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setNotice("");
  if(!supabase){setNotice("Authentication is not configured for this deployment.");return;}
  const form=new FormData(e.currentTarget);
  const email=String(form.get("email")||"").trim();
  const password=String(form.get("password")||"");
  setBusy(true);
  try{
   if(mode==="register"){
    const full_name=String(form.get("fullName")||"").trim();
    const company_name=String(form.get("company")||"").trim();
    const abn=String(form.get("abn")||"").trim();
    if(abn&&!/^[0-9]{11}$/.test(abn))throw new Error("ABN must contain 11 digits.");
    const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin,data:{full_name,account_type:type,company_name,abn}}});
    if(error)throw error;
    setNotice("Check your inbox for a verification email. Then sign in to finish setting up your account.");
   }else if(mode==="login"){
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error)throw error;
    setNotice("Signed in. Loading your account...");
   }else{
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    if(error)throw error;
    setNotice("If an account exists, password reset instructions will be emailed.");
   }
  }catch(err){setNotice(err instanceof Error?err.message:"Request failed.");}
  finally{setBusy(false);}
 }
 const titles:Record<AccountType,string>={employer:"Employer",agency:"Recruitment agency",jobseeker:"Jobseeker"};
 return <div className="auth-page"><div className="auth-card">
  <button className="auth-back" onClick={onBack}><ArrowLeft size={16}/> Back to demo</button>
  <div className="auth-logo"><BriefcaseBusiness size={22}/> HireFlow</div>
  <h1>{mode==="register"?"Create your account":mode==="login"?"Welcome back":"Reset password"}</h1>
  <p className="auth-subtitle">Recruitment for every industry.</p>
  {mode==="register"&&<div className="account-choices" role="group" aria-label="Account type">
   {([["employer",Building2],["agency",BriefcaseBusiness],["jobseeker",UserRound]] as const).map(([value,Icon])=><button type="button" key={value} aria-pressed={type===value} className={type===value?"selected":""} onClick={()=>setType(value)}><Icon size={19}/>{titles[value]}</button>)}
  </div>}
  <form onSubmit={submit}>
   {mode==="register"&&<><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" required autoComplete="name" placeholder="Your full name"/>
    {type!=="jobseeker"&&<><label htmlFor="company">Business or agency name</label><input id="company" name="company" required placeholder="Registered business name"/><label htmlFor="abn">ABN (optional)</label><input id="abn" name="abn" inputMode="numeric" maxLength={11} placeholder="11-digit ABN"/></>}</>}
   <label htmlFor="email">Email address</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com"/>
   {mode!=="forgot"&&<><label htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="At least 8 characters"/></>}
   <button className="auth-submit" disabled={busy} type="submit">{busy?"Please wait...":mode==="register"?"Create account":mode==="login"?"Sign in":"Send reset link"}</button>
  </form>
  {notice&&<div className="auth-notice" role="status">{notice}</div>}
  <div className="auth-switch">{mode==="register"?<>Already registered? <button onClick={()=>{setMode("login");setNotice("");}}>Sign in</button></>:mode==="login"?<>New here? <button onClick={()=>{setMode("register");setNotice("");}}>Register</button><button onClick={()=>{setMode("forgot");setNotice("");}}>Forgot password?</button></>:<button onClick={()=>{setMode("login");setNotice("");}}>Return to sign in</button>}</div>
 </div></div>;
}
