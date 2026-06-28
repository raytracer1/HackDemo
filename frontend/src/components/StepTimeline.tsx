import type { StepData } from '../shared/types';
import StepCard from './StepCard';

interface Props {
  steps: StepData[];
}

export default function StepTimeline({ steps }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-indigo-400">📋</span>
        Demo Walkthrough
        <span className="text-sm text-gray-500 font-normal ml-2">
          ({steps.length} {steps.length === 1 ? 'step' : 'steps'})
        </span>
      </h2>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <StepCard key={idx} step={step} index={idx} total={steps.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
