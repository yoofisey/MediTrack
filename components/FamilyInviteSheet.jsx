"use client";

import { Users } from "lucide-react";
import { useSwipe } from "@/lib/useSwipe";

export default function FamilyInviteSheet({ invites, onAccept, onDismiss }) {
  const handleSwipe = useSwipe({ onSwipeDown: onDismiss });
  if (!invites?.length) return null;
  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onDismiss()}>
      <div className="sheet" style={{maxHeight:"70dvh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" {...handleSwipe}/>
        <div style={{padding:"4px 20px calc(16px + var(--safe-bottom))",textAlign:"center"}}>
          <div style={{marginBottom:10,display:"flex",justifyContent:"center"}}>
            <span style={{width:52,height:52,borderRadius:"50%",background:"var(--ib4)",display:"grid",placeItems:"center",color:"var(--t1)"}}><Users size={24}/></span>
          </div>
          <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>You&apos;ve been invited to a family group</div>
          <div style={{fontSize:14,color:"var(--t3)",lineHeight:1.5,marginBottom:18}}>
            A caregiver wants to track your medication adherence so they can support you.
            {invites.length > 1 ? ` You have ${invites.length} pending invites.` : ""}
          </div>
          {invites.map(inv => (
            <div key={inv.id} style={{display:"flex",alignItems:"center",gap:10,background:"var(--card)",border:"var(--card-border)",boxShadow:"var(--card-shadow)",borderRadius:14,padding:12,marginBottom:10,textAlign:"left"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"var(--ib2)",display:"grid",placeItems:"center",fontWeight:700,color:"var(--t1)",fontSize:15,flexShrink:0}}>{(inv.member_email || "?").charAt(0).toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>Family group</div>
                <div style={{fontSize:12,color:"var(--t3)"}}>Invited {new Date(inv.created_at).toLocaleDateString()}</div>
              </div>
              <button className="btn btn-primary btn-sm" style={{width:"auto",fontSize:13}} onClick={() => onAccept(inv.id)}>Accept</button>
            </div>
          ))}
          <button className="btn btn-ghost" style={{width:"100%",marginTop:6}} onClick={onDismiss}>Not now</button>
        </div>
      </div>
    </div>
  );
}
