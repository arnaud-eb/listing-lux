"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { toast } from "sonner";
import type { Language, Listing } from "@/lib/types";
import { LANGUAGES, LANGUAGE_LABELS } from "@/lib/constants";
import { listingOutputSchema, type ListingOutput } from "@/lib/schemas/listing";

export type GenerationStatus =
  | "idle"
  | "queued"
  | "generating"
  | "complete"
  | "error";

export interface LanguageState {
  status: GenerationStatus;
  listing: Partial<Listing> | null;
  error?: string;
}

type GenerationState = Record<Language, LanguageState>;

function initState(initialListings: Listing[]): GenerationState {
  const state: GenerationState = {
    de: { status: "idle", listing: null },
    fr: { status: "idle", listing: null },
    en: { status: "idle", listing: null },
    lu: { status: "idle", listing: null },
  };

  for (const listing of initialListings) {
    state[listing.language] = {
      status: "complete",
      listing,
    };
  }

  return state;
}

export function useListingGeneration(
  propertyId: string,
  initialListings: Listing[],
) {
  const [state, setState] = useState<GenerationState>(() =>
    initState(initialListings),
  );
  const [activeTab, setActiveTab] = useState<Language>("de");
  const [initialGenerationDone, setInitialGenerationDone] = useState(
    initialListings.length > 0,
  );

  // Ref for reading current state inside stable callbacks without re-creating them
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track which language is currently being generated
  const currentLangRef = useRef<Language>("de");
  // Track the generation queue for sequential generation
  const queueRef = useRef<Language[]>([]);
  const completedCountRef = useRef(0);
  const totalInQueueRef = useRef(0);

  const { object, submit, isLoading, stop, error } = useObject({
    api: "/api/generate/stream",
    schema: listingOutputSchema,
    onFinish: ({ object, error }) => {
      const lang = currentLangRef.current;

      if (error || !object) {
        setState((prev) => ({
          ...prev,
          [lang]: {
            status: "error",
            listing: null,
            error: error?.message ?? "Generation failed",
          },
        }));
      } else {
        completedCountRef.current++;
        setState((prev) => ({
          ...prev,
          [lang]: {
            status: "complete",
            listing: {
              property_id: propertyId,
              language: lang,
              ...object,
            } as Partial<Listing>,
          },
        }));

        // Check if all languages in the queue are done
        if (completedCountRef.current === totalInQueueRef.current && totalInQueueRef.current === LANGUAGES.length) {
          setInitialGenerationDone(true);
          toast.success("All listings generated");
        }

        // Single-language regeneration — no queue, notify completion
        if (totalInQueueRef.current === 0 && queueRef.current.length === 0) {
          toast.success(`${LANGUAGE_LABELS[lang]} listing regenerated`);
        }
      }

      // Process next language in the queue
      const nextLang = queueRef.current.shift();
      if (nextLang) {
        currentLangRef.current = nextLang;
        setActiveTab(nextLang);
        setState((prev) => ({
          ...prev,
          [nextLang]: { status: "generating", listing: null },
        }));
        submit({ propertyId, language: nextLang });
      }
    },
    onError: (error) => {
      const lang = currentLangRef.current;
      setState((prev) => ({
        ...prev,
        [lang]: {
          status: "error",
          listing: null,
          error: error.message || "Generation failed",
        },
      }));
    },
  });

  // Sync streaming partial object to state
  useEffect(() => {
    if (!object || !isLoading) return;
    const lang = currentLangRef.current;
    setState((prev) => ({
      ...prev,
      [lang]: {
        status: "generating",
        listing: {
          property_id: propertyId,
          language: lang,
          ...(object as Partial<ListingOutput>),
        } as Partial<Listing>,
      },
    }));
  }, [object, isLoading, propertyId]);

  const isGenerating = LANGUAGES.some(
    (lang) =>
      state[lang].status === "generating" || state[lang].status === "queued",
  );

  const generateAll = useCallback(
    (startLanguage?: Language) => {
      // Abort any in-flight request
      stop();

      const first = startLanguage ?? activeTab;
      const order = [first, ...LANGUAGES.filter((l) => l !== first)];

      // Reset counters
      completedCountRef.current = 0;
      totalInQueueRef.current = order.length;

      // Set all to queued
      setState((prev) => {
        const next = { ...prev };
        for (const lang of order) {
          next[lang] = { status: "queued", listing: null };
        }
        return next;
      });

      // Queue remaining languages (after the first)
      queueRef.current = order.slice(1);

      // Start the first language
      const firstLang = order[0];
      currentLangRef.current = firstLang;
      setActiveTab(firstLang);
      setState((prev) => ({
        ...prev,
        [firstLang]: { status: "generating", listing: null },
      }));
      submit({ propertyId, language: firstLang });
    },
    [propertyId, activeTab, stop, submit],
  );

  const regenerate = useCallback(
    (language: Language, comment?: string) => {
      // Abort any in-flight request
      stop();

      // Clear the queue — single language only
      queueRef.current = [];
      completedCountRef.current = 0;
      totalInQueueRef.current = 0;

      // Capture current listing for comment-guided regeneration
      const currentListing = comment
        ? stateRef.current[language].listing
        : undefined;

      currentLangRef.current = language;
      setState((prev) => ({
        ...prev,
        [language]: { status: "generating", listing: null },
      }));
      submit({
        propertyId,
        language,
        ...(comment ? { comment } : {}),
        ...(currentListing?.title
          ? {
              currentListing: {
                title: currentListing.title,
                description: currentListing.description ?? "",
                highlights: currentListing.highlights ?? [],
              },
            }
          : {}),
      });
    },
    [propertyId, stop, submit],
  );

  // Auto-trigger if no initial listings
  useEffect(() => {
    if (initialListings.length > 0) return;
    generateAll();
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = useCallback(
    (language: Language, updates: Partial<Pick<Listing, "title" | "description" | "highlights" | "seo_keywords">>) => {
      setState((prev) => ({
        ...prev,
        [language]: {
          ...prev[language],
          listing: {
            ...prev[language].listing,
            ...updates,
          },
        },
      }));
    },
    [],
  );

  return {
    state,
    activeTab,
    setActiveTab,
    isGenerating,
    initialGenerationDone,
    generateAll,
    regenerate,
    updateField,
  };
}
