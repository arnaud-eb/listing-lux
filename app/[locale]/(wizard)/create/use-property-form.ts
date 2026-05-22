import { useReducer, useCallback, useEffect, useRef, useState } from "react";
import type { ListingPhoto, PropertyFormData } from "@/lib/types";
import type { CpeClass, ListingKind } from "@/lib/constants";
import { MIN_PHOTOS, FEATURE_OPTIONS, normalizeRoomType } from "@/lib/constants";
import {
  getSignedUploadUrl,
  confirmUpload,
  analyzePhoto,
  derivePropertyAggregates,
} from "./actions";

const DRAFT_KEY = "listinglux-create-draft";

// --- State ---

export interface PropertyFormState {
  bedrooms: number;
  bathrooms: number;
  sqm: number | "";
  price: number | "";
  neighborhood: string;
  propertyType: string;
  features: Record<string, boolean>;
  photos: ListingPhoto[];
  address: string;
  /** "" sentinel = unselected. The Select renders "" as the placeholder. */
  cpeClass: CpeClass | "";
  thermalInsulationClass: CpeClass | "";
  /** Sale or rent. Drives visibility of charges/availability fields. Defaults to 'sale' (~70% of LU listings). */
  listingKind: ListingKind;
  /** Year of construction (1800–2100). "" = blank. */
  yearBuilt: number | "";
  /** Monthly charges (€). Rent only. "" = blank. */
  chargesMonthly: number | "";
  /** Floors in the building. "" = blank. */
  floorsTotal: number | "";
  /** Floor of this unit. 0 = ground floor, negative = basement. "" = blank. */
  floorOfUnit: number | "";
  /** ISO YYYY-MM-DD from <input type="date">. Rent only. "" = blank. */
  availabilityDate: string;
}

export const INITIAL_STATE: PropertyFormState = {
  bedrooms: 2,
  bathrooms: 1,
  sqm: "",
  price: "",
  neighborhood: "",
  propertyType: "apartment",
  features: {},
  photos: [],
  address: "",
  cpeClass: "",
  thermalInsulationClass: "",
  listingKind: "sale",
  yearBuilt: "",
  chargesMonthly: "",
  floorsTotal: "",
  floorOfUnit: "",
  availabilityDate: "",
};

// --- Actions ---

export type FormAction =
  | {
      type: "SET_FIELD";
      key: keyof Omit<PropertyFormState, "photos">;
      value: PropertyFormState[keyof PropertyFormState];
    }
  | { type: "SET_FEATURES"; features: Record<string, boolean> }
  | {
      type: "SET_AGGREGATES";
      propertyType: string;
      featureIds: string[];
      cpeClass: CpeClass | null;
      thermalInsulationClass: CpeClass | null;
    }
  | { type: "ADD_PHOTO"; photo: ListingPhoto }
  | { type: "UPDATE_PHOTO"; id: string; updates: Partial<ListingPhoto> }
  | { type: "REMOVE_PHOTO"; id: string }
  | { type: "RESTORE_DRAFT"; state: PropertyFormState }
  | { type: "RESET" };

export function formReducer(
  state: PropertyFormState,
  action: FormAction,
): PropertyFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.key]: action.value };
    case "SET_FEATURES":
      return { ...state, features: action.features };
    case "SET_AGGREGATES": {
      // OR-merge: derived features add to whatever the user has already toggled,
      // never clobber a user-set true.
      const mergedFeatures = { ...state.features };
      for (const id of action.featureIds) {
        mergedFeatures[id] = true;
      }
      // Pre-fill CPE classes from the certificate-photo extraction, but only when
      // the user hasn't already typed a value in the form. The agent can override.
      return {
        ...state,
        propertyType: action.propertyType,
        features: mergedFeatures,
        cpeClass:
          state.cpeClass !== "" ? state.cpeClass : action.cpeClass ?? "",
        thermalInsulationClass:
          state.thermalInsulationClass !== ""
            ? state.thermalInsulationClass
            : action.thermalInsulationClass ?? "",
      };
    }
    case "ADD_PHOTO":
      return { ...state, photos: [...state.photos, action.photo] };
    case "UPDATE_PHOTO":
      return {
        ...state,
        photos: state.photos.map((p) =>
          p.id === action.id ? { ...p, ...action.updates } : p,
        ),
      };
    case "REMOVE_PHOTO":
      return {
        ...state,
        photos: state.photos.filter((p) => p.id !== action.id),
      };
    case "RESTORE_DRAFT":
      return action.state;
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
}

// --- Hook ---

export function usePropertyForm() {
  const [state, dispatch] = useReducer(formReducer, INITIAL_STATE);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasDerivedRef = useRef(false);
  const [pendingAggregates, setPendingAggregates] = useState(false);

  // --- Field updaters ---
  const updateField = useCallback(
    <K extends keyof Omit<PropertyFormState, "photos">>(
      key: K,
      value: PropertyFormState[K],
    ) => {
      dispatch({ type: "SET_FIELD", key, value });
    },
    [],
  );

  const updateFeatures = useCallback((features: Record<string, boolean>) => {
    dispatch({ type: "SET_FEATURES", features });
  }, []);

  // --- Derived state ---
  const readyPhotoCount = state.photos.filter(
    (p) => p.status === "ready",
  ).length;

  const inFlightPhotoCount = state.photos.filter(
    (p) => p.status === "uploading" || p.status === "processing",
  ).length;

  const hasRequiredFields =
    state.bedrooms >= 0 && state.neighborhood !== "";

  const canGenerate =
    readyPhotoCount >= MIN_PHOTOS &&
    inFlightPhotoCount === 0 &&
    !pendingAggregates &&
    hasRequiredFields;

  // --- Draft persistence ---
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      const restored: PropertyFormState = {
        bedrooms: d.bedrooms ?? INITIAL_STATE.bedrooms,
        bathrooms: d.bathrooms ?? INITIAL_STATE.bathrooms,
        sqm: d.sqm ?? INITIAL_STATE.sqm,
        price: d.price ?? INITIAL_STATE.price,
        neighborhood: d.neighborhood ?? INITIAL_STATE.neighborhood,
        propertyType: d.propertyType ?? INITIAL_STATE.propertyType,
        features: d.features ?? INITIAL_STATE.features,
        address: d.address ?? INITIAL_STATE.address,
        cpeClass: d.cpeClass ?? INITIAL_STATE.cpeClass,
        thermalInsulationClass:
          d.thermalInsulationClass ?? INITIAL_STATE.thermalInsulationClass,
        listingKind: d.listingKind ?? INITIAL_STATE.listingKind,
        yearBuilt: d.yearBuilt ?? INITIAL_STATE.yearBuilt,
        chargesMonthly: d.chargesMonthly ?? INITIAL_STATE.chargesMonthly,
        floorsTotal: d.floorsTotal ?? INITIAL_STATE.floorsTotal,
        floorOfUnit: d.floorOfUnit ?? INITIAL_STATE.floorOfUnit,
        availabilityDate: d.availabilityDate ?? INITIAL_STATE.availabilityDate,
        photos: d.photos?.length
          ? d.photos.map((p: Record<string, unknown>) => ({
              ...p,
              // Restored photos are always "ready" — if they have a publicUrl,
              // the upload succeeded. AI analysis is optional and non-blocking;
              // we won't retry it on restore (analysis may be missing).
              status: "ready" as const,
              localPreviewUrl: (p.publicUrl as string) ?? "",
              aiAnalysis: p.aiAnalysis ?? null,
            }))
          : [],
      };
      dispatch({ type: "RESTORE_DRAFT", state: restored });
      // Skip derivation: a restored draft already has whatever propertyType /
      // features the user (or last session's derivation) settled on.
      if (restored.photos.length > 0) {
        hasDerivedRef.current = true;
      }
    } catch {
      // Ignore corrupt data
    }
  }, []);

  // Derive property_type + features from photo analyses, once per session.
  // Fires after the first time all photos finish analyzing and we have at least
  // MIN_PHOTOS ready. Failure is silent — defaults stay in place.
  useEffect(() => {
    if (hasDerivedRef.current) return;
    if (inFlightPhotoCount > 0) return;
    if (readyPhotoCount < MIN_PHOTOS) return;

    const analyses = state.photos
      .map((p) => p.aiAnalysis)
      .filter((a): a is NonNullable<typeof a> => a != null);

    if (analyses.length === 0) {
      hasDerivedRef.current = true;
      return;
    }

    hasDerivedRef.current = true;
    setPendingAggregates(true);

    derivePropertyAggregates(analyses)
      .then((result) => {
        dispatch({
          type: "SET_AGGREGATES",
          propertyType: result.property_type,
          featureIds: result.features,
          cpeClass: result.cpe_class ?? null,
          thermalInsulationClass: result.thermal_insulation_class ?? null,
        });
      })
      .catch(() => {
        // Silent failure — user can still submit with defaults.
      })
      .finally(() => {
        setPendingAggregates(false);
      });
  }, [inFlightPhotoCount, readyPhotoCount, state.photos]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { photos, ...formFields } = state;
      const draft = {
        ...formFields,
        photos: photos
          .filter(
            (p) =>
              (p.status === "ready" || p.status === "processing") &&
              p.publicUrl,
          )
          .map(({ localPreviewUrl, uploadProgress, ...rest }) => rest),
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [state]);

  // --- Photo handlers ---
  async function uploadPhoto(file: File): Promise<void> {
    const id = crypto.randomUUID();
    const localPreviewUrl = URL.createObjectURL(file);

    dispatch({
      type: "ADD_PHOTO",
      photo: {
        id,
        localPreviewUrl,
        supabasePath: null,
        publicUrl: null,
        status: "uploading",
        uploadProgress: 0,
        aiAnalysis: null,
      },
    });

    try {
      const tempPropertyId = `pending-${crypto.randomUUID()}`;
      const { signedUrl, path } = await getSignedUploadUrl(
        file.name,
        file.type,
        tempPropertyId,
      );

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { publicUrl } = await confirmUpload(path, tempPropertyId);

      // Set to processing for AI analysis
      dispatch({
        type: "UPDATE_PHOTO",
        id,
        updates: {
          status: "processing",
          supabasePath: path,
          publicUrl,
          uploadProgress: 100,
        },
      });

      // Analyze photo with AI (non-blocking — failure doesn't block user)
      try {
        const analysis = await analyzePhoto(publicUrl);
        dispatch({
          type: "UPDATE_PHOTO",
          id,
          updates: { status: "ready", aiAnalysis: analysis },
        });
      } catch {
        dispatch({
          type: "UPDATE_PHOTO",
          id,
          updates: { status: "ready", aiAnalysis: null },
        });
      }
    } catch {
      dispatch({
        type: "UPDATE_PHOTO",
        id,
        updates: { status: "error" },
      });
    }
  }

  const handleAddPhotos = useCallback(
    (files: File[]) => {
      files.forEach((file) => uploadPhoto(file));
    },
    [uploadPhoto],
  );

  const handleRemovePhoto = useCallback((id: string) => {
    dispatch({ type: "REMOVE_PHOTO", id });
  }, []);

  const handleUpdatePhotoRoomType = useCallback(
    (id: string, value: string) => {
      const photo = state.photos.find((p) => p.id === id);
      if (!photo?.aiAnalysis) return;

      const oldId = normalizeRoomType(photo.aiAnalysis.room_type);
      const newId = normalizeRoomType(value);
      if (oldId === newId) return;

      dispatch({
        type: "UPDATE_PHOTO",
        id,
        updates: { aiAnalysis: { ...photo.aiAnalysis, room_type: newId } },
      });

      // Room-type ids and feature ids share a vocabulary (balcony, terrace,
      // garden, pool, cellar, basement, attic, parking): correcting a photo's
      // room type re-syncs the matching feature chip. Because both sides are
      // canonical ids, this works identically in every UI language — fixing
      // "balcon" → "terrasse" in French behaves like "balcony" → "terrace".
      const featureIdSet = new Set<string>(FEATURE_OPTIONS.map((f) => f.id));
      if (!featureIdSet.has(oldId) && !featureIdSet.has(newId)) return;

      const features = { ...state.features };
      if (featureIdSet.has(oldId)) {
        const stillPresent = state.photos.some(
          (p) =>
            p.id !== id &&
            normalizeRoomType(p.aiAnalysis?.room_type) === oldId,
        );
        if (!stillPresent) features[oldId] = false;
      }
      if (featureIdSet.has(newId)) {
        features[newId] = true;
      }

      dispatch({ type: "SET_FEATURES", features });
    },
    [state.photos, state.features],
  );

  // --- Reset ---
  function reset() {
    sessionStorage.removeItem(DRAFT_KEY);
    hasDerivedRef.current = false;
    dispatch({ type: "RESET" });
  }

  function toFormData(): PropertyFormData {
    return buildPropertyFormData(state);
  }

  function clearDraft() {
    sessionStorage.removeItem(DRAFT_KEY);
  }

  return {
    form: state,
    dispatch,
    updateField,
    updateFeatures,
    photos: state.photos,
    readyPhotoCount,
    inFlightPhotoCount,
    hasRequiredFields,
    canGenerate,
    handleAddPhotos,
    handleRemovePhoto,
    handleUpdatePhotoRoomType,
    reset,
    toFormData,
    clearDraft,
  };
}

// --- Pure selectors (exported for unit tests and page.tsx) ---

// availability_date is rent-only (gate below); charges_monthly applies to both
// sale and rent listings (co-ownership fees for sale, monthly charges for rent).
export function buildPropertyFormData(
  state: PropertyFormState,
): PropertyFormData {
  const readyPhotos = state.photos.filter(
    (p) => p.status === "ready" && p.publicUrl,
  );
  const isRent = state.listingKind === "rent";
  return {
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    sqm: typeof state.sqm === "number" ? state.sqm : null,
    price: typeof state.price === "number" ? state.price : null,
    neighborhood: state.neighborhood,
    property_type: state.propertyType,
    features: state.features,
    photo_urls: readyPhotos.map((p) => p.publicUrl!),
    photo_analyses: readyPhotos
      .filter((p) => p.aiAnalysis)
      .map((p) => p.aiAnalysis!),
    listing_kind: state.listingKind,
    address: state.address || null,
    cpe_class: state.cpeClass || null,
    thermal_insulation_class: state.thermalInsulationClass || null,
    year_built: typeof state.yearBuilt === "number" ? state.yearBuilt : null,
    floors_total:
      typeof state.floorsTotal === "number" ? state.floorsTotal : null,
    floor_of_unit:
      typeof state.floorOfUnit === "number" ? state.floorOfUnit : null,
    charges_monthly:
      typeof state.chargesMonthly === "number" ? state.chargesMonthly : null,
    availability_date:
      isRent && state.availabilityDate ? state.availabilityDate : null,
  };
}

/**
 * True when any field differs from INITIAL_STATE. Derived from the state shape
 * (Object.keys) so new fields added to PropertyFormState are tracked
 * automatically — no manual OR-chain to keep in sync.
 */
export function isFormDirty(state: PropertyFormState): boolean {
  for (const key of Object.keys(INITIAL_STATE) as (keyof PropertyFormState)[]) {
    if (key === "features") {
      if (Object.values(state.features).some(Boolean)) return true;
      continue;
    }
    if (key === "photos") {
      if (state.photos.length > 0) return true;
      continue;
    }
    if (state[key] !== INITIAL_STATE[key]) return true;
  }
  return false;
}
