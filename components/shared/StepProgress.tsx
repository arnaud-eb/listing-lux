interface StepProgressProps {
  currentStep: 1 | 2;
}

export default function StepProgress({ currentStep }: StepProgressProps) {
  const percentage = currentStep === 1 ? 50 : 100;

  return (
    <div className="w-full lg:w-1/2">
      {/* Text row */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">
          Step {currentStep} of 2
        </span>
        <span className="text-xs text-gray-400">
          {percentage}% Complete
        </span>
      </div>
      {/* Progress bar */}
      <div
        className="w-full h-1 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Step ${currentStep} of 2 — ${percentage}% complete`}
      >
        <div
          className="h-full bg-gold rounded-full transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
