"use client";

import { Save, UserPlus } from "lucide-react";
import { useState } from "react";
import { PersonPicker } from "@/components/ui/PersonPicker";
import { apiRequest, ApiRequestError } from "@/lib/api";
import type { PersonRead } from "@/lib/types";

export default function RegisterPersonPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("unknown");
  const [community, setCommunity] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<PersonRead | null>(null);

  // Post-save linking
  const [parent, setParent] = useState<PersonRead | null>(null);
  const [spouse, setSpouse] = useState<PersonRead | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const person = await apiRequest<PersonRead>("/persons", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email: email || null,
          phone_number: phone || null,
          gender,
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
          <label className="field">
            Full name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adaeze Worlu"
              required
            />
          </label>
          <label className="field">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adaeze.worlu@example.com"
              type="email"
            />
          </label>
          <label className="field">
            Phone number
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2348000000000"
            />
          </label>
          <label className="field">
            Gender
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field">
            Community
            <input
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              placeholder="Omuma, Rivers"
            />
          </label>
          <label className="field">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recorded from elder interview."
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btnp full" type="submit" disabled={busy}>
            <Save size={18} />
            {busy ? "Saving…" : "Save record"}
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
                setCommunity("");
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
