import { Save, UserPlus } from "lucide-react";

export function RegisterPerson() {
  return (
    <div className="content-stack">
      <section className="section-title">
        <span className="eyebrow">new lineage record</span>
        <h1>Register a person</h1>
      </section>
      <section className="panel record-form">
        <label>
          Full name
          <input placeholder="Adaeze Worlu" />
        </label>
        <label>
          Email
          <input placeholder="adaeze.worlu@example.com" type="email" />
        </label>
        <label>
          Phone number
          <input placeholder="+2348000000000" />
        </label>
        <label>
          State
          <select defaultValue="Rivers">
            <option>Rivers</option>
            <option>Imo</option>
            <option>Anambra</option>
          </select>
        </label>
        <label>
          Community
          <input placeholder="Omuma" />
        </label>
        <label>
          Notes
          <textarea placeholder="Recorded from elder interview." />
        </label>
        <button className="primary-button full" type="button">
          <Save size={18} />
          Save record
        </button>
      </section>
      <section className="callout-card">
        <UserPlus size={22} />
        <span>Next step</span>
        <strong>Link parents, spouse, siblings, or clan edges after the record is saved.</strong>
      </section>
    </div>
  );
}
