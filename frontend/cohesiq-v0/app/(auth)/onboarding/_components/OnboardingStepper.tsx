import { Check } from "lucide-react";

const STEPS = [
  { name: "Personal info", desc: "Who you are" },
  { name: "Your niches", desc: "What you create" },
  { name: "Platforms", desc: "Where you post" },
];

export function OnboardingStepper({ current }: { current: number }) {
  return (
    <ol className="ob-steps">
      {STEPS.map((step, i) => {
        const state = i === current ? "active" : i < current ? "past" : "future";
        return (
          <li key={step.name} className={`ob-step ${state}`}>
            <span className="ob-step-num">
              {state === "past" ? <Check className="ico" strokeWidth={3} /> : i + 1}
            </span>
            <span className="ob-step-meta">
              <span className="ob-step-name">{step.name}</span>
              <span className="ob-step-desc">{step.desc}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
