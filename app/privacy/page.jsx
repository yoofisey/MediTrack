export const metadata = { title: "Privacy Policy — Adhera" };

export default function PrivacyPage() {
  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif",color:"#0f172a",lineHeight:1.7,padding:"40px 20px"}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#2563eb,#5856d6)",display:"grid",placeItems:"center",color:"white",fontWeight:800,fontSize:16}}>A</div>
            <span style={{fontSize:18,fontWeight:700,color:"#0f172a"}}>Adhera</span>
          </div>
        </div>

        <h1 style={{fontSize:28,fontWeight:800,marginBottom:8,letterSpacing:"-.5px"}}>Privacy Policy</h1>
        <p style={{fontSize:14,color:"#64748b",marginBottom:32}}>Effective date: July 1, 2026</p>

        <div style={{fontSize:15,color:"#334155",display:"flex",flexDirection:"column",gap:20}}>
          <p>Adhera (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) respects your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our medication tracking application.</p>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>1. Information We Collect</h2>
            <p>We collect information you provide directly: name, email address, medication names, dosages, schedules, dose logs, health conditions, and health goals. We also collect usage data such as app interactions and notification preferences.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>2. Health Data</h2>
            <p>Adhera processes health-related data including medication schedules, dose history, and adherence patterns. This data is classified as &quot;special category data&quot; under GDPR and is treated with the highest level of protection. We process this data solely to deliver the Adhera service to you.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>3. How We Use Your Information</h2>
            <p>Your data is used solely to deliver the Adhera service: tracking medications, sending reminders, generating adherence reports, and improving the app experience. We never sell your personal data.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>4. Data Storage &amp; Security</h2>
            <p>Your data is stored securely on Supabase servers with encryption at rest (AES-256) and in transit (TLS). We implement industry-standard security measures including HTTPS, encrypted database connections, and strict access controls.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your data at any time by deleting your account within the app&apos;s Privacy &amp; Data settings.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>6. Your Rights</h2>
            <p>You have the right to: access your data, export your data (JSON or CSV), correct your data, delete your account and all associated data. You can exercise these rights directly through the app&apos;s Profile → Privacy &amp; Data settings.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>7. Third-Party Services</h2>
            <p>We use Supabase for authentication and database hosting. We use Paystack for payment processing. Push notifications may use your browser&apos;s notification API. No other third parties have access to your personal medication data.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>8. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Significant changes will be notified via email or in-app notice.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>9. Contact</h2>
            <p>For privacy-related inquiries, contact us at <a href="mailto:privacy@adhera.app" style={{color:"#2563eb"}}>privacy@adhera.app</a>.</p>
          </div>
        </div>

        <div style={{marginTop:40,paddingTop:20,borderTop:"1px solid #e2e8f0",textAlign:"center"}}>
          <a href="/" style={{fontSize:14,color:"#2563eb",fontWeight:600,textDecoration:"none"}}>← Back to Adhera</a>
        </div>
      </div>
    </div>
  );
}
