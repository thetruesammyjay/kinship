import { ArrowRight, GitBranch, Network, ShieldCheck, UserPlus, UsersRound } from "lucide-react";

function PhoneMockup({ variant = "home" }: { variant?: "home" | "verify" }) {
  const rows =
    variant === "home"
      ? ["Adaeze Worlu", "Chinedu Worlu", "Amara Worlu"]
      : ["Person A", "Common ancestor", "Person B"];

  return (
    <div className={`phone-mockup ${variant}`}>
      <div className="phone-status" />
      <div className="phone-top">
        <span>{variant === "home" ? "Registry" : "Verify"}</span>
        <b>{variant === "home" ? "100" : "3"}</b>
      </div>
      <div className="phone-card hot">
        <span>{variant === "home" ? "Rivers lineage" : "Distantly related"}</span>
        <strong>{variant === "home" ? "Worlu family" : "Degree 3"}</strong>
      </div>
      {rows.map((row, index) => (
        <div className="phone-row" key={row}>
          <i>{index + 1}</i>
          <span>{row}</span>
          <b>{variant === "home" ? "edge" : "path"}</b>
        </div>
      ))}
    </div>
  );
}

const moves = [
  {
    title: "Register a person",
    body: "Capture names, phone numbers, email, state, clan, family, and community notes.",
  },
  {
    title: "Map the lineage",
    body: "Link parent, spouse, sibling, and clan relationships as graph edges.",
  },
  {
    title: "Verify eligibility",
    body: "Compare two records and return the shared path, degree, and marriage-risk verdict.",
  },
];

const proof = [
  {
    title: "Graph stays intact",
    body: "Postgres stores the people and edges, while the API still traverses the data as a graph.",
  },
  {
    title: "Elders can audit it",
    body: "Every result shows the common ancestor and relationship path instead of a black-box answer.",
  },
  {
    title: "Built for communities",
    body: "Seed data covers Igbo names from Rivers, Imo, and Anambra for early evaluation.",
  },
];

export default function App() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <button className="landing-brand" type="button">
          <span className="brand-icon">
            <GitBranch size={17} />
          </span>
          <b>KINSHIP</b>
        </button>
        <button className="nav-open" type="button">
          Open
        </button>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <span className="tiny-label">lineage records . with elders</span>
          <h1>
            Verify marriage eligibility with <em>family graphs.</em>
          </h1>
          <p>
            Register people. Link relatives. Let the relationship path settle the question before
            families make a decision.
          </p>
          <div className="hero-buttons">
            <button className="pink-action" type="button">
              <ShieldCheck size={18} />
              Start verification
            </button>
            <button className="text-action" type="button">
              Open registry
            </button>
          </div>
          <a className="proof-link" href="#proof">
            See the graph proof
          </a>
        </div>

        <div className="mockup-stage" aria-label="Kinship product preview">
          <PhoneMockup />
          <PhoneMockup variant="verify" />
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
        </div>
      </section>

      <section className="moves-section">
        <span className="tiny-label">what you can do</span>
        <h2>Three simple moves</h2>
        <div className="landing-card-stack">
          {moves.map((move) => (
            <article className="landing-card" key={move.title}>
              <h3>{move.title}</h3>
              <p>{move.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="proof-section" id="proof">
        <span className="tiny-label">why it works</span>
        <h2>The graph remains the source</h2>
        <div className="landing-card-stack">
          {proof.map((item) => (
            <article className="landing-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="desktop-feature-grid">
        <div className="feature-visual">
          <PhoneMockup />
        </div>
        <div className="feature-copy">
          <span className="tiny-label">features</span>
          <h2>What registrars can do</h2>
          <ul>
            <li>
              <UserPlus size={18} />
              <span>Add verified community records</span>
            </li>
            <li>
              <Network size={18} />
              <span>Build a relationship graph</span>
            </li>
            <li>
              <UsersRound size={18} />
              <span>Search families across states</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready to check a lineage?</h2>
        <p>Open the registry, pick two people, and review the path before a decision is made.</p>
        <button className="pink-action" type="button">
          Open registry
          <ArrowRight size={18} />
        </button>
      </section>

      <footer className="landing-footer">
        <div className="landing-brand">
          <span className="brand-icon">
            <GitBranch size={17} />
          </span>
          <b>KINSHIP</b>
        </div>
        <p>Graph-based kinship verification</p>
      </footer>
    </main>
  );
}
