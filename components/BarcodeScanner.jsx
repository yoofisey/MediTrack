"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

const COMMON_MEDICATIONS = {
  "5000000000000": { name: "Paracetamol 500mg", dosage_unit: "tablet(s)" },
  "6000000000000": { name: "Ibuprofen 400mg", dosage_unit: "tablet(s)" },
  "3000000000000": { name: "Amoxicillin 500mg", dosage_unit: "capsule(s)" },
  "4000000000000": { name: "Metformin 500mg", dosage_unit: "tablet(s)" },
  "7000000000000": { name: "Lisinopril 10mg", dosage_unit: "tablet(s)" },
  "8000000000000": { name: "Amlodipine 5mg", dosage_unit: "tablet(s)" },
  "9000000000000": { name: "Atorvastatin 20mg", dosage_unit: "tablet(s)" },
  "1000000000000": { name: "Omeprazole 20mg", dosage_unit: "capsule(s)" },
  "2000000000000": { name: "Cetirizine 10mg", dosage_unit: "tablet(s)" },
};

export default function BarcodeScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef(null);
  const zxingRef = useRef(null);
  const stoppedRef = useRef(false);

  const stopCamera = useCallback(() => {
    stoppedRef.current = true;
    if (zxingRef.current) {
      try { zxingRef.current.reset(); } catch {}
      zxingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  async function startCamera() {
    setError("");
    setResult(null);
    stoppedRef.current = false;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera not available on this device");
        return;
      }

      const zxing = new BrowserMultiFormatReader();
      zxingRef.current = zxing;

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      setScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stoppedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      zxing.decodeFromVideoElement(videoRef.current, (res, err) => {
        if (stoppedRef.current) return;
        if (res) {
          handleBarcode(res.getText());
        }
      }).catch(() => {});
    } catch (e) {
      if (!stoppedRef.current) {
        setError("Camera access denied. You can enter the barcode manually below.");
        setScanning(false);
      }
    }
  }

  function handleBarcode(code) {
    stopCamera();
    setScanning(false);
    const match = COMMON_MEDICATIONS[code];
    if (match) {
      setResult({ code, ...match });
    } else {
      setResult({ code, name: "", dosage_unit: "tablet(s)" });
    }
  }

  function handleManualLookup() {
    if (!manualCode.trim()) return;
    handleBarcode(manualCode.trim());
  }

  function handleUse() {
    if (result) {
      onScan({ name: result.name, dosage_unit: result.dosage_unit, barcode: result.code });
    }
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"90vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(90vh - 40px)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontSize:20,fontWeight:700}}>Scan Barcode</div>
            <button className="btn btn-sm" style={{background:"var(--hover)",border:"none",fontSize:13}} onClick={onClose}>✕</button>
          </div>

          {scanning && (
            <div style={{borderRadius:14,overflow:"hidden",marginBottom:16,position:"relative",background:"black",aspectRatio:"4/3"}}>
              <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover"}} playsInline muted autoPlay/>
              <div style={{position:"absolute",inset:0,border:"3px solid rgba(255,255,255,.5)",borderRadius:14,pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:12,left:0,right:0,textAlign:"center",fontSize:13,color:"white",textShadow:"0 1px 4px rgba(0,0,0,.5)"}}>
                Point camera at medication barcode
              </div>
            </div>
          )}

          {error && (
            <div style={{background:"var(--ib3)",borderRadius:12,padding:12,marginBottom:16,fontSize:13,color:"var(--t2)"}}>
              {error}
            </div>
          )}

          {result && (
            <div style={{background:"var(--ib2)",borderRadius:14,padding:16,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--teal)",marginBottom:8}}>Barcode found: {result.code}</div>
              {result.name ? (
                <div>
                  <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>{result.name}</div>
                  <div style={{fontSize:13,color:"var(--t3)"}}>{result.dosage_unit}</div>
                </div>
              ) : (
                <div style={{fontSize:13,color:"var(--t3)"}}>
                  This barcode isn&apos;t in our database yet. You can type the medication name manually.
                </div>
              )}
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={handleUse}>
                  {result.name ? "Use this medication" : "Continue"}
                </button>
                <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={() => { setResult(null); startCamera(); }}>Scan again</button>
              </div>
            </div>
          )}

          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:8}}>Or enter barcode manually</div>
            <div style={{display:"flex",gap:8}}>
              <input className="sheet-input" placeholder="e.g. 5901234123457" value={manualCode} onChange={e => setManualCode(e.target.value)} style={{flex:1,fontSize:14}}/>
              <button className="btn btn-sm" style={{background:"var(--teal)",color:"white",border:"none",padding:"8px 14px"}} onClick={handleManualLookup}>Look up</button>
            </div>
          </div>

          {!scanning && !result && !error && (
            <button className="btn btn-primary" style={{width:"100%",marginBottom:8}} onClick={startCamera}>
              📷 Start camera
            </button>
          )}

          <button className="btn btn-ghost" style={{width:"100%"}} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
