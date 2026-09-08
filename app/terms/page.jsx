export const metadata = { title: "Terms of Service — Adhera" };

export default function TermsPage() {
  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif",color:"#0f172a",lineHeight:1.7,padding:"40px 20px"}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#2563eb,#5856d6)",display:"grid",placeItems:"center",color:"white",fontWeight:800,fontSize:16}}>A</div>
            <span style={{fontSize:18,fontWeight:700,color:"#0f172a"}}>Adhera</span>
          </div>
        </div>

        <h1 style={{fontSize:28,fontWeight:800,marginBottom:8,letterSpacing:"-.5px"}}>Terms of Service</h1>
        <p style={{fontSize:14,color:"#64748b",marginBottom:32}}>Effective date: September 8, 2026</p>

        <div style={{fontSize:15,color:"#334155",display:"flex",flexDirection:"column",gap:20}}>
          <p>By using Adhera (&quot;the App&quot;), you agree to the following terms and conditions. Please read them carefully.</p>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>1. Service Description</h2>
            <p>Adhera provides medication tracking, dose reminders, adherence analytics, family/caregiver management, and related health management tools. The App is an informational and organizational tool only and does not provide medical advice.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>2. User Responsibilities</h2>
            <p>You are responsible for the accuracy of the medication information you enter. Always consult your healthcare provider before making changes to your medication regimen. Never rely solely on app reminders for critical health decisions.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>3. Medical Disclaimer</h2>
            <p>Adhera is not a medical device and does not diagnose, treat, cure, or prevent any disease. The App does not replace professional medical advice, diagnosis, or treatment. If you have a medical emergency, call your doctor or emergency services immediately.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>4. Account &amp; Data</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You own your data. We grant you no license to use the App&apos;s design or branding. You may delete your account at any time, which removes your data in accordance with our Privacy Policy.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>5. Acceptable Use</h2>
            <p>You agree not to misuse the App, including attempting unauthorized access, distributing malware, or using the service for any illegal purpose. We may suspend or terminate accounts that violate these terms or engage in abusive behavior.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>6. Subscription &amp; Payments</h2>
            <p>Premium features require a paid subscription. Prices are displayed in local currency and may change with notice. Subscriptions recur monthly until cancelled. Cancellation takes effect at the end of the current billing period. Payment processing is provided by Paystack (Ghana) and Paddle (Merchant of Record, all other countries). Refunds are handled per our <a href="/refund-policy" style={{color:"#2563eb"}}>Refund Policy</a>.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>7. Limitation of Liability</h2>
            <p>Adhera and its developers shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App, including but not limited to missed doses, incorrect medication information, or health outcomes. To the fullest extent permitted by law, our total liability is limited to the amount you paid for the App in the preceding twelve months.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>8. Governing Law</h2>
            <p>These terms are governed by the laws of Ghana, without regard to its conflict-of-law provisions. For EU/EEA and UK customers, mandatory consumer protection rights and your local laws apply where they provide greater protection.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>9. Changes to These Terms</h2>
            <p>We may update these terms from time to time. Significant changes will be notified via email or in-app notice. Continued use of the App after changes constitutes acceptance of the revised terms.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>10. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:legal@useadhera.com" style={{color:"#2563eb"}}>legal@useadhera.com</a>.</p>
          </div>
        </div>

        <div style={{marginTop:40,paddingTop:20,borderTop:"1px solid #e2e8f0",textAlign:"center",display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
          <a href="/privacy" style={{fontSize:14,color:"#2563eb",fontWeight:600,textDecoration:"none"}}>Privacy Policy</a>
          <a href="/refund-policy" style={{fontSize:14,color:"#2563eb",fontWeight:600,textDecoration:"none"}}>Refund Policy</a>
          <a href="/" style={{fontSize:14,color:"#2563eb",fontWeight:600,textDecoration:"none"}}>← Back to Adhera</a>
        </div>
      </div>
    </div>
  );
}
