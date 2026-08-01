"use client";

import { useRef, useState } from "react";
import { sb } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";
import { AVATAR_CHOICES } from "@/lib/avatars";
import { Camera, Check, Loader2 } from "lucide-react";

const GRADIENTS = [
  ["#F2709C", "#FF9472"], ["#A18CD1", "#FBC2EB"], ["#48C6EF", "#6F86D6"],
  ["#56AB2F", "#A8E063"], ["#F6D365", "#FDA085"], ["#FF9A9E", "#FECFEF"],
  ["#667EEA", "#764BA2"], ["#F093FB", "#F5576C"], ["#4FACFE", "#00F2FE"],
  ["#43E97B", "#38F9D7"], ["#FA709A", "#FEE140"], ["#30CFD0", "#330867"],
  ["#FF758C", "#FF7EB3"], ["#00C9FF", "#92FE9D"], ["#F953C6", "#B91D73"],
  ["#396AFC", "#2948FF"], ["#FFD26F", "#3677FF"], ["#FF8008", "#FFC837"],
  ["#7F7FD5", "#86A8E7"], ["#FA8BFF", "#2BD2FF"],
];

const PALETTE = Object.fromEntries(AVATAR_CHOICES.map((c, i) => [c.key, GRADIENTS[i % GRADIENTS.length]]));

export default function AvatarPicker({ user, avatarKey = "Smile", avatarUrl = "", onPick, onUploaded, onRemovePhoto }) {
  const { t } = useLang();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target?.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await sb.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = sb.storage.from("avatars").getPublicUrl(path);
      onUploaded?.(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Upload failed: ${err?.message || err}. Make sure the 'avatars' storage bucket exists and has INSERT policies for authenticated users.`);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  }

  const [g1, g2] = PALETTE[avatarKey] || GRADIENTS[0];
  const ActiveIcon = (AVATAR_CHOICES.find(c => c.key === avatarKey) || AVATAR_CHOICES[0]).Icon;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div className="avatar-preview" style={{ background: avatarUrl ? "var(--ib2)" : `linear-gradient(135deg,${g1},${g2})` }}>
          {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : <ActiveIcon size={34} color="white" strokeWidth={2}/>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="btn btn-ghost btn-sm" style={{ width: "auto", padding: "7px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-start" }} onClick={() => fileRef.current?.click()}>
            <Camera size={14} strokeWidth={2.2}/> {uploading ? t("profile.uploading") : t("profile.uploadPhoto")}
          </button>
          {avatarUrl && onRemovePhoto && (
            <button className="btn btn-ghost btn-sm" style={{ width: "auto", padding: "7px 14px", fontSize: 13, color: "var(--red)", borderColor: "rgba(255,59,48,.2)", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-start" }} onClick={onRemovePhoto}>
              {t("profile.removePhoto")}
            </button>
          )}
        </div>
      </div>
      {uploading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--ib1)", borderRadius: 10, fontSize: 13, color: "var(--teal2)", fontWeight: 500, marginBottom: 12 }}>
          <Loader2 size={14} style={{ animation: "spin .6s linear infinite" }}/> {t("profile.uploading")}
        </div>
      )}
      <div className="avatar-grid">
        <div className="avatar-tile avatar-upload" onClick={() => fileRef.current?.click()}>
          <Camera size={20} strokeWidth={2}/>
          <span className="avatar-upload-label">{t("profile.uploadPhoto")}</span>
        </div>
        {AVATAR_CHOICES.map(({ key, Icon }) => {
          const [a, b] = PALETTE[key];
          const sel = !avatarUrl && key === avatarKey;
          return (
            <div key={key} className={`avatar-tile${sel ? " sel" : ""}`} style={{ background: `linear-gradient(135deg,${a},${b})` }} onClick={() => onPick?.(key)}>
              <Icon size={22} color="white" strokeWidth={2}/>
              {sel && <span className="avatar-tick"><Check size={12} color="white" strokeWidth={3.5}/></span>}
            </div>
          );
        })}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile}/>
    </div>
  );
}
