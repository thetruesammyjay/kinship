import { ArrowRightLeft, Play } from "lucide-react";

type VerificationFormProps = {
  onVerify: () => void;
};

export function VerificationForm({ onVerify }: VerificationFormProps) {
  return (
    <section className="panel form-panel">
      <div className="panel-heading">
        <span className="eyebrow">eligibility check</span>
        <h2>Compare two lineage records</h2>
      </div>
      <label>
        Person A
        <select defaultValue="amara">
          <option value="amara">Amara Worlu</option>
          <option value="adaeze">Adaeze Worlu</option>
          <option value="chikaodili">Chikaodili Nwosu</option>
        </select>
      </label>
      <button className="swap-button" type="button" aria-label="Swap selected people">
        <ArrowRightLeft size={18} />
      </button>
      <label>
        Person B
        <select defaultValue="tobe">
          <option value="tobe">Tobechukwu Worlu</option>
          <option value="chinedu">Chinedu Worlu</option>
          <option value="adaolisa">Adaolisa Okafor</option>
        </select>
      </label>
      <button className="primary-button full" type="button" onClick={onVerify}>
        <Play size={18} />
        Run check
      </button>
    </section>
  );
}
