"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WizardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <AlertTriangle className="text-gold size-12 mx-auto mb-6" />
        <h1 className="font-serif text-2xl font-bold text-navy-deep mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button
            onClick={reset}
            className="bg-gold text-navy-deep font-bold hover:bg-gold/90"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
