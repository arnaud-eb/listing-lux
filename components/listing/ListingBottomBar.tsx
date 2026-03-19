"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ExportMenu = dynamic(() => import("./ExportMenu"), { ssr: false });

interface ListingBottomBarProps {
  onRegenerate?: () => void;
  isGenerating?: boolean;
  activeLanguage?: string;
}

export default function ListingBottomBar({
  onRegenerate,
  isGenerating,
  activeLanguage,
}: ListingBottomBarProps) {
  return (
    <div className="border-t border-gray-100 mt-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          {onRegenerate && (
            <Button
              type="button"
              variant="outline"
              onClick={onRegenerate}
              disabled={isGenerating}
              className="gap-1.5 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-navy-deep shadow-none"
            >
              <RefreshCw className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span className="max-sm:hidden">Regenerate</span>
              {activeLanguage && (
                <span className="uppercase text-2xs font-bold bg-gold/10 text-gold rounded px-1.5 py-0.5">
                  {activeLanguage}
                </span>
              )}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="gap-1.5 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-navy-deep shadow-none"
          >
            <Link href="/create">
              <Plus className="size-3.5" />
              <span className="max-sm:hidden">New Listing</span>
            </Link>
          </Button>
          <ExportMenu />
        </div>
      </div>
    </div>
  );
}
