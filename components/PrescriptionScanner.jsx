"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function PrescriptionScanner({ onUseResult, onClose }) {
  const [step, setStep] = useState("capture");
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState({ name: "", dosage: "", unit: "tablet(s)", times: "1" });
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (step === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (step !== "camera") stopCamera();
    };
  }, [step]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      setError(null);
      setStep("camera");
    } catch (e) {
      setError("Camera access denied. Try uploading a photo instead.");
    }
  }, []);

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.9);
    setImageUrl(url);
    stopCamera();
    setStep("manual");
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStep("manual");
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function handleUse() {
    onUseResult({
      name: result.name,
      dosage_amount: parseFloat(result.dosage) || 0,
      dosage_unit: result.unit,
      times_per_day: parseInt(result.times) || 1,
    });
  }

  if (step === "capture") {
    return (
      <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="sheet" style={{maxHeight:"85vh"}} onClick={e => e.stopPropagation()}>
          <div className="sheet-handle"/>
          <div style={{padding:"0 20px 20px",textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:12}}>📸</div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Scan Prescription</div>
            <div style={{fontSize:14,color:"var(--t3)",marginBottom:20,lineHeight:1.5}}>
              Take a photo of your prescription label. You&apos;ll then enter the details manually.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button className="btn btn-primary" style={{width:"100%"}} onClick={startCamera}>
                📷 Open Camera
              </button>
              <button className="btn" style={{width:"100%",background:"var(--ib2)"}} onClick={() => fileInputRef.current?.click()}>
                🖼️ Upload Photo
              </button>
              <button className="btn btn-ghost" style={{width:"100%"}} onClick={() => { setStep("manual"); setResult({ name:"", dosage:"", unit:"tablet(s)", times:"1" }); }}>
                ✏️ Enter manually
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileUpload}/>
          </div>
        </div>
      </div>
    );
  }

  if (step === "camera") {
    return (
      <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && (stopCamera(), onClose())}>
        <div className="sheet" style={{maxHeight:"90vh",padding:0}} onClick={e => e.stopPropagation()}>
          <div style={{position:"relative",background:"#000",borderRadius:"var(--rl)",overflow:"hidden",minHeight:300}}>
            <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",display:"block",maxHeight:"60vh",objectFit:"cover"}}/>
            <canvas ref={canvasRef} style={{display:"none"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,padding:16,background:"linear-gradient(transparent, rgba(0,0,0,0.7))",display:"flex",justifyContent:"center",gap:12}}>
              <button onClick={capturePhoto} style={{width:64,height:64,borderRadius:"50%",border:"4px solid white",background:"rgba(255,255,255,0.2)",cursor:"pointer",display:"grid",placeItems:"center"}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"white"}}/>
              </button>
            </div>
            <button onClick={() => { stopCamera(); onClose(); }} style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.5)",border:"none",color:"white",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:16,display:"grid",placeItems:"center"}}>✕</button>
          </div>
          <div style={{padding:16,textAlign:"center",fontSize:13,color:"var(--t3)"}}>Point camera at the prescription label, then tap the capture button</div>
        </div>
      </div>
    );
  }

  if (step === "manual") {
    return (
      <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="sheet" style={{maxHeight:"90vh"}} onClick={e => e.stopPropagation()}>
          <div className="sheet-handle"/>
          <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(90vh - 40px)"}}>
            <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Enter Prescription Details</div>
            <div style={{fontSize:14,color:"var(--t3)",marginBottom:16}}>Enter the details from the prescription label.</div>

            {imageUrl && (
              <img src={imageUrl} alt="Prescription" style={{width:"100%",maxHeight:180,objectFit:"contain",borderRadius:12,marginBottom:16,background:"var(--hover)"}}/>
            )}

            <div style={{marginBottom:12}}>
              <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Medication name *</div>
              <input className="sheet-input" type="text" placeholder="e.g. Amoxicillin" value={result.name}
                onChange={e => setResult(p => ({...p, name: e.target.value}))} style={{fontSize:16}}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Dosage *</div>
                <input className="sheet-input" type="number" placeholder="500" value={result.dosage}
                  onChange={e => setResult(p => ({...p, dosage: e.target.value}))} style={{fontSize:16}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Unit</div>
                <select className="sheet-input" value={result.unit} onChange={e => setResult(p => ({...p, unit: e.target.value}))} style={{fontSize:16}}>
                  <option value="tablet(s)">Tablet(s)</option>
                  <option value="capsule(s)">Capsule(s)</option>
                  <option value="ml">ml</option>
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="drop(s)">Drop(s)</option>
                  <option value="puff(s)">Puff(s)</option>
                </select>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Times per day</div>
              <select className="sheet-input" value={result.times} onChange={e => setResult(p => ({...p, times: e.target.value}))} style={{fontSize:16}}>
                <option value="1">Once daily</option>
                <option value="2">Twice daily</option>
                <option value="3">Three times</option>
                <option value="4">Four times</option>
              </select>
            </div>

            <div className="sheet-actions" style={{gap:8}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleUse} disabled={!result.name.trim()}>
                Use this medication
              </button>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
