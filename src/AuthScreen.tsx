import { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Building2, UserRound, ShieldCheck } from "lucide-react";
export type AccountType = "employer" | "agency" | "jobseeker";
type Mode = "register" | "login" | "forgot";
export default function AuthScreen({onBack}:{onBack:()=>void}) {
  const [mode,setMode]=useState<Mode>("register");
  const [type,setType]=useState<AccountType>("employer");
  const [showNotice,setShowNotice]=useState(false);
  const titles:Record<AccountType,string>={employer:"Employer",agency:"Recruitment agency",jobseeker:"Jobseeker"};
  return <div className="auth-page"><div className="auth-card">
    <button className="auth-back" onClick={onBack}><ArrowLeft size={16}/> Back to dashboard demo</button>
    <div className="auth-logo"><BriefcaseBusiness size={22}/> HireFlow</div>
    <h1>{mode==="register"?"Create your HireFlow account":mode==="login"?"Welcome back":"Reset your password"}</h1>
    <p className="auth-subtitle">Secure recruitment for every industry.</p>
    {mode==="register"&&<div className="account-choices" role="group" aria-label="Account type">
      {([["employer",Building2],["agency",BriefcaseBusiness],["jobseeker",UserRound]] as const).map(([value,Icon])=><button type="button" key={value} aria-pressed={type===value} className={type===value?"selected":""} onClick={()=>setType(value)}><Icon size={19}/>{titles[value]}</button>)}
    </div>}
    <form onSubmit={e=>{e.preventDefault();setShowNotice(true);}}>
      {mode==="register"&&<><label htmlFor="fullName">Full name</label><input id="fullName" required autoComplete="name" placeholder="Your full name"/>
      {type!=="jobseeker"&&<><label htmlFor="company">Business or agency name</label><input id="company" required placeholder="Registered business name"/><label htmlFor="abn">ABN (optional in demo)</label><input id="abn" inputMode="numeric" maxLength={11} placeholder="11-digit ABN"/></>}</>}
      <label htmlFor="email">Email address</label><input id="email" type="email" required autoComplete="email" placeholder="you@example.com"/>
      {mode!=="forgot"&&<><label htmlFor="password">Password</label><input id="password" type="password" required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="At least 8 characters"/></>}
      {mode==="register"&&<p className="auth-privacy"><ShieldCheck size={15}/> Email verification and account access will be enabled once the dedicated HireFlow Supabase project is connected.</p>}
      <button className="auth-submit" type="submit">{mode==="register"?"Create account":mode==="login"?"Sign in":"Send reset link"}</button>
    </form>
    {showNotice&&<div className="auth-notice" role="status">This is a UI preview. No account has been created, no email was sent and no credentials were transmitted to a backend. Please don't use a real password yet.</div>}
    <div className="auth-switch">{mode==="register"?<>Already registered? <button onClick={()=>{setMode("login");setShowNotice(false);}}>Sign in</button></>:mode==="login"?<>New to HireFlow? <button onClick={()=>{setMode("register");setShowNotice(false);}}>Register</button><button onClick={()=>{setMode("forgot");setShowNotice(false);}}>Forgot password?</button></>:<button onClick={()=>{setMode("login");setShowNotice(false);}}>Return to sign in</button>}</div>
  </div></div>;
}
