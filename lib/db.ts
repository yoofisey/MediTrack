export function insertFamilyMember(ownerId: string, email: string) {
  return sb.from("family_members").insert([{
    owner_id: ownerId,
    member_email: (email || "").toLowerCase().trim(),
    role: "member",
    status: "pending",
  }]);
}

export function removeFamilyMember(id: string) {
  return sb.from("family_members").delete().eq("id", id);
}

export function insertManagedFamilyMember(ownerId: string, fields: { member_name?: string; relationship?: string; age?: number; phone?: string; care_note?: string }) {
  return sb.from("family_members").insert([{
    owner_id: ownerId,
    member_email: fields.member_name ? `managed+${Date.now()}@managed.local` : "managed@local",
    member_name: fields.member_name,
    relationship: fields.relationship,
    age: fields.age,
    phone: fields.phone,
    care_note: fields.care_note,
    managed: true,
    status: "pending",
  }]);
}

export function updateFamilyMember(id: string, patch: Partial<FamilyMember> & { relationship?: string; age?: number; phone?: string; care_note?: string; managed?: boolean }) {
  return sb.from("family_members").update(patch).eq("id", id);
}

export function insertDoseLog(entry: Pick<DoseLog, "medication_id" | "user_id" | "taken_at"> & { journal?: string }) {
  return sb.from("dose_logs").insert([entry]);
}

export function insertVital(entry: Pick<Vital, "user_id" | "type" | "value" | "unit"> & { value_secondary?: number; notes?: string }) {
  return sb.from("vitals").insert([entry]);
}

export function updateMedication(id: string, updates: Partial<Medication>) {
  return sb.from("medications").update(updates).eq("id", id);
}

export function deleteMedication(id: string) {
  return sb.from("medications").delete().eq("id", id);
}
