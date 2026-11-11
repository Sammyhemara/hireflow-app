import { useEffect,useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
type AccountType="employer"|"agency"|"jobseeker";
export default function AccountHome({user,onSignOut}:{user:User,onSignOut:()=>void}){
 const [message,setMessage]=useState("Preparing your account...");
 const [accountType,setAccountType]=useState<AccountType|null>(null);
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
 return <div className="auth-page"><section className="auth-card">
  <div className="auth-logo">HireFlow</div>
  <h1>{accountType==="employer"?"Employer workspace":accountType==="agency"?"Recruitment agency workspace":accountType==="jobseeker"?"Jobseeker workspace":"Setting up your workspace"}</h1>
  <p>{message}</p><p>Signed in as {user.email}</p>
  <p className="auth-privacy">The authenticated account foundation is connected. Jobs, candidate screening and live messaging are coming in later milestones.</p>
  <button className="auth-submit" onClick={onSignOut}>Sign out</button>
 </section></div>;
}
