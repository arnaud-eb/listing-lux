import { useReducer, useCallback, useEffect, useRef, useState } from "react";
import type { ListingPhoto, PropertyFormData } from "@/lib/types";
import type { CpeClass } from "@/lib/constants";
import { MIN_PHOTOS, FEATURE_OPTIONS } from "@/lib/constants";
import {
  getSignedUploadUrl,
  confirmUpload,
  analyzePhoto,
  derivePropertyAggregates,
} from "./actions";

const DRAFT_KEY = "listinglux-create-draft";

// --- State ---

interface PropertyFormState {
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
}

const INITIAL_STATE: PropertyFormState = {
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
};

// --- Actions ---

type FormAction =
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

function formReducer(
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
    state.bedrooms >= 0 &&
    typeof state.sqm === "number" &&
    state.sqm > 0 &&
    typeof state.price === "number" &&
    state.price > 0 &&
    state.neighborhood !== "";

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

      const oldType = photo.aiAnalysis.room_type;

      dispatch({
        type: "UPDATE_PHOTO",
        id,
        updates: { aiAnalysis: { ...photo.aiAnalysis, room_type: value } },
      });

      // Sync features when old/new room type maps to a feature ID.
      // e.g. correcting "BALCONY" → "TERRACE" should toggle the chips accordingly.
      const featureIdSet = new Set<string>(FEATURE_OPTIONS.map((f) => f.id));
      const normalize = (t: string) => t.toLowerCase().replace(/\s+/g, "-");
      const oldId = normalize(oldType);
      const newId = normalize(value);

      if (!featureIdSet.has(oldId) && !featureIdSet.has(newId)) return;

      const features = { ...state.features };
      if (featureIdSet.has(oldId)) {
        const stillPresent = state.photos.some(
          (p) =>
            p.id !== id &&
            normalize(p.aiAnalysis?.room_type ?? "") === oldId,
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

  // --- Build form data for submission ---
  function toFormData(): PropertyFormData {
    const readyPhotos = state.photos.filter(
      (p) => p.status === "ready" && p.publicUrl,
    );
    return {
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      sqm: state.sqm as number,
      price: state.price as number,
      neighborhood: state.neighborhood,
      property_type: state.propertyType,
      features: state.features,
      photo_urls: readyPhotos.map((p) => p.publicUrl!),
      photo_analyses: readyPhotos
        .filter((p) => p.aiAnalysis)
        .map((p) => p.aiAnalysis!),
      ...(state.address ? { address: state.address } : {}),
      ...(state.cpeClass ? { cpe_class: state.cpeClass } : {}),
      ...(state.thermalInsulationClass
        ? { thermal_insulation_class: state.thermalInsulationClass }
        : {}),
    };
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
