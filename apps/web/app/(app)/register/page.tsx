"use client";

import { Save, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { FamilySelect } from "@/components/ui/FamilySelect";
import { PersonPicker } from "@/components/ui/PersonPicker";
import { apiRequest, ApiRequestError } from "@/lib/api";
import { loadRegistryData, type FamilyOption } from "@/lib/registry";
import type { PersonRead } from "@/lib/types";

export default function RegisterPersonPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("unknown");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isDeceased, setIsDeceased] = useState(false);
  const [community, setCommunity] = useState("");
  const [notes, setNotes] = useState("");
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [familyId, setFamilyId] = useState("");
  const [registryBusy, setRegistryBusy] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<PersonRead | null>(null);
  const [parent, setParent] = useState<PersonRead | null>(null);
  const [spouse, setSpouse] = useState<PersonRead | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadRegistryData()
      .then((data) => {
        if (cancelled) return;
        setFamilies(data.families);
        const firstFamily = data.families[0];
        setFamilyId(firstFamily?.id ?? "");
        setCommunity(firstFamily?.originCommunity ?? "");
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the family registry.");
      })
      .finally(() => {
        if (!cancelled) setRegistryBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const family = families.find((option) => option.id === familyId);
      const person = await apiRequest<PersonRead>("/persons", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email: email || null,
          phone_number: phone || null,
          gender,
          date_of_birth: dateOfBirth || null,
          is_deceased: isDeceased,
          family_id: familyId,
          clan_id: family?.clanId ?? null,
          origin_community: community || null,
          notes: notes || null,
        }),
      });
      setSaved(person);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save the record.");
    } finally {
      setBusy(false);
    }
  }

  async function link(kind: "parents" | "spouse", target: PersonRead | null) {
    if (!saved || !target) return;
    setBusy(true);
    setLinkMessage(null);
    try {
      await apiRequest(`/persons/${saved.id}/${kind}`, {
        method: "POST",
        body: JSON.stringify({ target_person_id: target.id }),
      });
      setLinkMessage(
        kind === "parents"
          ? `Linked ${target.full_name} as a parent of ${saved.full_name}.`
          : `Linked ${target.full_name} as spouse of ${saved.full_name}.`,
      );
      if (kind === "parents") setParent(null);
      else setSpouse(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not link the relationship.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content-stack">
      <section className="section-title">
        <span className="eyebrow">new lineage record</span>
        <h1>Register a person</h1>
      </section>

      {!saved ? (
        <form className="panel" onSubmit={onSave}>
          <FamilySelect
            families={families}
            value={familyId}
            onChange={(nextFamilyId) => {
              setFamilyId(nextFamilyId);
              const family = families.find((option) => option.id === nextFamilyId);
              setCommunity(family?.originCommunity ?? "");
            }}
            disabled={registryBusy}
          />
          <label className="field">
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Adaeze Worlu"
              required
            />
          </label>
          <label className="field">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="adaeze.worlu@example.com"
              type="email"
            />
          </label>
          <label className="field">
            Phone number
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+2348000000000"
            />
          </label>
          <label className="field">
            Gender
            <select value={gender} onChange={(event) => setGender(event.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field">
            Date of birth
            <input
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              type="date"
            />
          </label>
          <label className="checkbox-field">
            <input
              checked={isDeceased}
              onChange={(event) => setIsDeceased(event.target.checked)}
              type="checkbox"
            />
            Mark this person as deceased
          </label>
          <label className="field">
            Community
            <input
              value={community}
              onChange={(event) => setCommunity(event.target.value)}
              placeholder="Omuma, Rivers"
            />
          </label>
          <label className="field">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Recorded from elder interview."
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btnp full" type="submit" disabled={busy || !familyId}>
            <Save size={18} />
            {busy ? "Saving..." : "Save record"}
          </button>
        </form>
      ) : (
        <>
          <section className="panel pink-panel">
            <h2>{saved.full_name} saved</h2>
            <p className="muted-copy">
              Now link parents or a spouse so the graph can traverse this record during
              verification.
            </p>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span className="eyebrow">link relationships</span>
              <h2>Grow the graph</h2>
            </div>
            <PersonPicker label="Parent" value={parent} onChange={setParent} />
            <button
              className="btng"
              type="button"
              disabled={!parent || busy}
              onClick={() => link("parents", parent)}
            >
              Link parent
            </button>
            <PersonPicker label="Spouse" value={spouse} onChange={setSpouse} />
            <button
              className="btng"
              type="button"
              disabled={!spouse || busy}
              onClick={() => link("spouse", spouse)}
            >
              Link spouse
            </button>
            {linkMessage && <p className="form-ok">{linkMessage}</p>}
            {error && <p className="form-error">{error}</p>}
            <button
              className="btnp full"
              type="button"
              onClick={() => {
                setSaved(null);
                setFullName("");
                setEmail("");
                setPhone("");
                setGender("unknown");
                setDateOfBirth("");
                setIsDeceased(false);
                setNotes("");
                setLinkMessage(null);
                setError(null);
              }}
            >
              <UserPlus size={18} />
              Register another person
            </button>
          </section>
        </>
      )}

      <section className="callout-card">
        <UserPlus size={22} />
        <span>How it connects</span>
        <strong>
          Parent and spouse links are stored as graph edges and traversed by the kinship engine
          during verification.
        </strong>
      </section>
    </div>
  );
}
