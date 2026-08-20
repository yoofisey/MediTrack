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
        <p style={{fontSize:14,color:"#64748b",marginBottom:32}}>Effective date: August 20, 2026</p>

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
            <p>Your data is stored securely on Supabase (PostgreSQL) servers with encryption at rest (AES-256) and in transit (TLS). Our application is hosted on Vercel with enterprise-grade infrastructure. We implement industry-standard security measures including HTTPS, encrypted database connections, strict access controls, and HTTP security headers (HSTS, Content Security Policy).</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. When you delete your account, all personal data (profile, medications, dose logs, journals, vitals, family members, community posts, gamification data) is permanently deleted within 30 days. Session tokens are deleted immediately. Anonymized, aggregated statistics may be retained after deletion but cannot be linked back to you.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>6. Your Rights</h2>
            <p>Under GDPR and applicable data protection laws, you have the right to:</p>
            <ul style={{marginTop:8,paddingLeft:20}}>
              <li><strong>Access</strong> — view all your personal data in the app</li>
              <li><strong>Portability</strong> — export your data in JSON format via Profile → Privacy &amp; Data → Export My Data</li>
              <li><strong>Rectification</strong> — correct your personal data directly in the app</li>
              <li><strong>Erasure</strong> — delete your account and all associated data via Profile → Privacy &amp; Data → Delete Account</li>
              <li><strong>Restrict processing</strong> — contact us to restrict how we use your data</li>
              <li><strong>Object to processing</strong> — contact us to object to specific data processing</li>
              <li><strong>Withdraw consent</strong> — withdraw consent at any time by deleting your account</li>
            </ul>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>7. Data Processing Agreement</h2>
            <p>We use Supabase as our data processor. Supabase maintains SOC 2 Type II compliance and signs Data Processing Agreements (DPAs) with their customers. You can review Supabase&apos;s full privacy policy at <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{color:"#2563eb"}}>supabase.com/privacy</a>.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>8. Third-Party Services</h2>
            <p>We use the following third-party services that may process limited data:</p>
            <ul style={{marginTop:8,paddingLeft:20}}>
              <li><strong>Supabase</strong> — authentication and database hosting</li>
              <li><strong>Vercel</strong> — application hosting and CDN</li>
              <li><strong>Paystack</strong> — payment processing (no medication data is shared)</li>
              <li><strong>Apple Push Notification Service / Web Push</strong> — delivering medication reminders</li>
            </ul>
            <p style={{marginTop:8}}>No other third parties have access to your personal medication data.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>9. International Data Transfers</h2>
            <p>Your data may be processed in countries outside your country of residence. We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) through our data processing agreements with our service providers.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>10. Children&apos;s Privacy</h2>
            <p>Adhera is not intended for users under 16 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, contact us immediately.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>11. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Significant changes will be notified via email or in-app notice. The &quot;Effective date&quot; above reflects the last revision.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>12. Contact</h2>
            <p>For privacy-related inquiries, data access requests, or to exercise your rights, contact us at <a href="mailto:privacy@useadhera.com" style={{color:"#2563eb"}}>privacy@useadhera.com</a>.</p>
            <p style={{marginTop:8}}>If you are in the EU/EEA and are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.</p>
          </div>
        </div>

        <div style={{marginTop:40,paddingTop:20,borderTop:"1px solid #e2e8f0",textAlign:"center"}}>
          <a href="/" style={{fontSize:14,color:"#2563eb",fontWeight:600,textDecoration:"none"}}>← Back to Adhera</a>
        </div>
      </div>
    </div>
  );
}
