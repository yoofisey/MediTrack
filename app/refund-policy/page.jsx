export const metadata = { title: "Refund Policy — Adhera" };

export default function RefundPolicyPage() {
  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif",color:"#0f172a",lineHeight:1.7,padding:"40px 20px"}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#2563eb,#5856d6)",display:"grid",placeItems:"center",color:"white",fontWeight:800,fontSize:16}}>A</div>
            <span style={{fontSize:18,fontWeight:700,color:"#0f172a"}}>Adhera</span>
          </div>
        </div>

        <h1 style={{fontSize:28,fontWeight:800,marginBottom:8,letterSpacing:"-.5px"}}>Refund Policy</h1>
        <p style={{fontSize:14,color:"#64748b",marginBottom:32}}>Effective date: September 8, 2026</p>

        <div style={{fontSize:15,color:"#334155",display:"flex",flexDirection:"column",gap:20}}>
          <p>Adhera (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) sells subscriptions to our medication tracking and health management application. This policy explains how refunds are handled. It applies to both our Paystack billing for Ghana and our Paddle billing (Merchant of Record) for every other country.</p>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>1. Subscriptions Are Not Auto-Refunded</h2>
            <p>Adhera subscriptions are recurring (monthly). Because the service is delivered immediately and continuously, subscription fees are generally <strong>non-refundable</strong> once a billing period has started, except as described below or where consumer law requires otherwise.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>2. Cancellation</h2>
            <p>You may cancel your subscription at any time. Cancellation stops future renewals and takes effect at the end of the current billing period — you keep full access until then. To cancel, contact us at the address in Section 6, or request cancellation of your card/account.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>3. 14-Day Cooling-Off (EU/EEA &amp; UK Customers)</h2>
            <p>If you are based in the EU/EEA or the UK, you have a statutory right to a full refund within 14 days of your first purchase for any reason (the &quot;cooling-off&quot; period). If you cancel digital content within that window, we will refund the original charge in full. Note that by starting to use the service during the cooling-off period, you acknowledge a waiver of the right to a partial refund for the portion already used.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>4. Errors, Duplicate Charges &amp; Failed Payments</h2>
            <ul style={{marginTop:8,paddingLeft:20}}>
              <li><strong>Duplicate or erroneous charges</strong> — we will refund any amount charged in error or charged twice for the same billing period, in full.</li>
              <li><strong>Failed/unreceived service</strong> — if you were charged but could not access the service due to a technical fault on our side, we will issue a full refund for the affected period.</li>
              <li><strong>Refused/duplicate Paystack mobile money or card debits</strong> — contact us with the transaction reference and we will investigate and refund if it was unintended.</li>
            </ul>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>5. How to Request a Refund</h2>
            <p>Email <a href="mailto:support@useadhera.com" style={{color:"#2563eb"}}>support@useadhera.com</a> (or Paddle&apos;s self-service at <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" style={{color:"#2563eb"}}>paddle.com</a> for international purchases) with your account email and, if available, the transaction reference. Include the reason so we can assist. Most refunds are processed within 5–10 business days after approval, which is then returned to your original payment method.</p>
          </div>

          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#0f172a"}}>6. Contact</h2>
            <p>For refund requests or questions, contact us at <a href="mailto:support@useadhera.com" style={{color:"#2563eb"}}>support@useadhera.com</a>. We typically respond within 2 business days.</p>
            <p style={{marginTop:8}}><strong>Note on Merchant of Record:</strong> For purchases made outside Ghana, Paddle acts as our Merchant of Record and handles sales tax/VAT. Paddle&apos;s own refund policy and chargeback process apply to those transactions; please see Paddle for the exact terms.</p>
          </div>
        </div>

        <div style={{marginTop:40,paddingTop:20,borderTop:"1px solid #e2e8f0",textAlign:"center",display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
          <a href="/privacy" style={{fontSize:14,color:"#2563eb",fontWeight:600,textDecoration:"none"}}>Privacy Policy</a>
          <a href="/terms" style={{fontSize:14,color:"#2563eb",fontWeight:600,textDecoration:"none"}}>Terms of Service</a>
          <a href="/" style={{fontSize:14,color:"#2563eb",fontWeight:600,textDecoration:"none"}}>← Back to Adhera</a>
        </div>
      </div>
    </div>
  );
}
