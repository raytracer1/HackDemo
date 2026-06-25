import type { StepData } from '../shared/types';

interface Props {
  step: StepData;
  index: number;
  total: number;
}

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}m ${s}s`;
}

export default function StepCard({ step, index, total }: Props) {
  return (
    <div className="relative pl-10">
      {/* Dot on the timeline */}
      <div
        className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
          index === 0
            ? 'bg-indigo-500 border-indigo-400'
            : 'bg-gray-800 border-gray-600'
        }`}
        style={{ transform: 'translateX(-50%)' }}
      />

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
        <div className="flex flex-col md:flex-row">
          {/* Screenshot */}
          {step.screenshotUrl && (
            <div className="md:w-1/2 flex-shrink-0">
              <img
                src={step.screenshotUrl}
                alt={`Step ${index + 1}`}
                className="w-full h-40 md:h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-4 flex-1 min-w-0">
            {/* Step number + time */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">
                STEP {index + 1}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(step.startTime)} – {formatTime(step.endTime)}
              </span>
              {step.durationMs && (
                <span className="text-xs text-gray-600">
                  ({formatTime(step.durationMs)})
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-300 mb-2">{step.description}</p>

            {/* AI Narration */}
            {step.narration && (
              <div className="bg-gray-800 rounded-lg p-3 border-l-2 border-indigo-500">
                <p className="text-xs text-gray-500 mb-1">🎙️ AI Narration</p>
                <p className="text-sm text-white italic">"{step.narration}"</p>
              </div>
            )}

            {/* Page context */}
            <div className="mt-2 text-xs text-gray-600 truncate">
              {step.pageTitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
