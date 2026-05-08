"use client";

import { useTranslations } from "next-intl";

interface StepProgressProps {
  currentStep: 1 | 2;
}

export default function StepProgress({ currentStep }: StepProgressProps) {
  const t = useTranslations("wizard.stepProgress");
  const percentage = currentStep === 1 ? 50 : 100;

  return (
    <div className="w-full lg:w-1/2">
      {/* Text row */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">
          {t("stepLabel", { current: currentStep, total: 2 })}
        </span>
        <span className="text-xs text-gray-400">
          {t("percentComplete", { percent: percentage })}
        </span>
      </div>
      {/* Progress bar */}
      <div
        className="w-full h-1 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("ariaLabel", {
          current: currentStep,
          total: 2,
          percent: percentage,
        })}
      >
        <div
          className="h-full bg-gold rounded-full transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
