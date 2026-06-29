import Image from 'next/image';
import type { StepData } from '../shared/types';

interface Props {
  step: StepData;
  index: number;
  total: number;
}

function formatTime(ms: number): string {
  if (!ms || isNaN(ms)) return '0s';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}m ${s}s`;
}

export default function StepCard({ step, index, total }: Props) {
  return (
    <div className="relative pl-10">
      <div
        className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
          index === 0
            ? 'bg-hack-primary border-hack-primary'
            : 'bg-white border-gray-300'
        }`}
        style={{ transform: 'translateX(-50%)' }}
      />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-colors hover:border-gray-300">
        <div className="flex flex-col md:flex-row">
          {step.screenshotUrl && (
            <div className="md:w-1/2 flex-shrink-0 relative h-40 md:h-auto md:min-h-[200px]">
              <Image
                src={step.screenshotUrl}
                alt={`Step ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
          <div className="p-4 flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-hack-primary bg-hack-primary/10 px-2 py-0.5 rounded">STEP {index + 1}</span>
              <span className="text-xs text-gray-400">{formatTime(step.startTime)} – {formatTime(step.endTime)}</span>
              {(step.durationMs || (step as any).duration_ms) && (
                <span className="text-xs text-gray-400">({formatTime(step.durationMs || (step as any).duration_ms)})</span>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-2">{step.description}</p>
            {step.narration && (
              <div className="rounded-lg bg-gray-50 p-3 border-l-2 border-hack-primary">
                <p className="text-xs text-gray-400 mb-1">🎙️ AI Narration</p>
                <p className="text-sm text-gray-700 italic">"{step.narration}"</p>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-400 truncate">{step.pageTitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
