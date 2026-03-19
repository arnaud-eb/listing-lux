"use client";

import { usePathname } from "next/navigation";
import StepProgress from "@/components/shared/StepProgress";

export default function StepProgressClient() {
  const pathname = usePathname();
  const currentStep = pathname.startsWith("/listing") ? 2 : 1;

  return <StepProgress currentStep={currentStep as 1 | 2} />;
}
