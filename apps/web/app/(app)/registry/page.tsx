"use client";

import { Building2, Pencil, Plus, Save, UsersRound } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import RoleGate from "@/components/shell/RoleGate";
import { apiRequest } from "@/lib/api";
import type { ClanRead, FamilyRead } from "@/lib/types";

function RegistryWorkspace() {
  const [clans, setClans] = useState<ClanRead[]>([]);
  const [families, setFamilies] = useState<FamilyRead[]>([]);
  const [clanName, setClanName] = useState("");
  const [region, setRegion] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [community, setCommunity] = useState("");
  const [clanId, setClanId] = useState("");
  const [editingFamily, setEditingFamily] = useState<FamilyRead | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [clanRows, familyRows] = await Promise.all([
      apiRequest<ClanRead[]>("/clans"),
      apiRequest<FamilyRead[]>("/families"),
    ]);
    setClans(clanRows);
    setFamilies(familyRows);
  }, []);

  useEffect(() => {
    load().catch(() => setError("Could not load the registry."));
  }, [load]);

  async function createClan(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    try {
      await apiRequest<ClanRead>("/clans", {
        method: "POST",
        body: JSON.stringify({ clan_name: clanName, region: region || null }),
      });
      setClanName(""); setRegion(""); setMessage("Clan created."); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create clan."); }
    finally { setBusy(false); }
  }

  async function saveFamily(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    const payload = {
      family_name: editingFamily ? editingFamily.family_name : familyName,
      origin_community: editingFamily ? editingFamily.origin_community : community || null,
      clan_id: editingFamily ? editingFamily.clan_id : clanId || null,
    };
    try {
      await apiRequest<FamilyRead>(editingFamily ? `/families/${editingFamily.id}` : "/families", {
        method: editingFamily ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setFamilyName(""); setCommunity(""); setClanId(""); setEditingFamily(null);
      setMessage(editingFamily ? "Family updated." : "Family created."); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save family."); }
    finally { setBusy(false); }
  }

  return (
    <div className="content-stack">
      <section className="section-title"><span className="eyebrow">registry management</span><h1>Clans and families</h1></section>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-ok">{message}</p>}
      <section className="two-column">
        <form className="panel" onSubmit={createClan}>
          <div className="panel-heading"><Building2 size={22} /><h2>Create clan</h2></div>
          <label className="field">Clan name<input value={clanName} onChange={(e) => setClanName(e.target.value)} required /></label>
          <label className="field">Region<input value={region} onChange={(e) => setRegion(e.target.value)} /></label>
          <button className="btnp" disabled={busy}><Plus size={18} />Add clan</button>
        </form>
        <form className="panel" onSubmit={saveFamily}>
          <div className="panel-heading"><UsersRound size={22} /><h2>{editingFamily ? "Edit family" : "Create family"}</h2></div>
          <label className="field">Family name<input value={editingFamily?.family_name ?? familyName} onChange={(e) => editingFamily ? setEditingFamily({...editingFamily, family_name: e.target.value}) : setFamilyName(e.target.value)} required /></label>
          <label className="field">Origin community<input value={editingFamily?.origin_community ?? community} onChange={(e) => editingFamily ? setEditingFamily({...editingFamily, origin_community: e.target.value}) : setCommunity(e.target.value)} /></label>
          <label className="field">Clan<select value={editingFamily?.clan_id ?? clanId} onChange={(e) => editingFamily ? setEditingFamily({...editingFamily, clan_id: e.target.value || null}) : setClanId(e.target.value)}><option value="">No clan assigned</option>{clans.map((clan) => <option key={clan.id} value={clan.id}>{clan.clan_name}</option>)}</select></label>
          <div className="button-row"><button className="btnp" disabled={busy}><Save size={18} />{editingFamily ? "Save changes" : "Add family"}</button>{editingFamily && <button className="btng" type="button" onClick={() => setEditingFamily(null)}>Cancel</button>}</div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading"><span className="eyebrow">family directory</span><h2>{families.length} families</h2></div>
        <div className="record-list">{families.map((family) => <article className="record-row" key={family.id}><div><strong>{family.family_name}</strong><span>{family.origin_community || "Community not recorded"} · {clans.find((clan) => clan.id === family.clan_id)?.clan_name || "No clan"}</span></div><button className="icon-button" title="Edit family" onClick={() => setEditingFamily(family)}><Pencil size={17} /></button></article>)}</div>
      </section>
    </div>
  );
}

export default function RegistryPage() {
  return <RoleGate allowed={["Admin", "Registrar"]}><RegistryWorkspace /></RoleGate>;
}
