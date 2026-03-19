import { useReducer, useCallback, useEffect, useRef } from "react";
import type { ListingPhoto, PropertyFormData } from "@/lib/types";
import { MIN_PHOTOS } from "@/lib/constants";
import { getSignedUploadUrl, confirmUpload, analyzePhoto } from "./actions";

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
};

// --- Actions ---

type FormAction =
  | { type: "SET_FIELD"; key: keyof Omit<PropertyFormState, "photos">; value: PropertyFormState[keyof PropertyFormState] }
  | { type: "SET_FEATURES"; features: Record<string, boolean> }
  | { type: "ADD_PHOTO"; photo: ListingPhoto }
  | { type: "UPDATE_PHOTO"; id: string; updates: Partial<ListingPhoto> }
  | { type: "REMOVE_PHOTO"; id: string }
  | { type: "RESTORE_DRAFT"; state: PropertyFormState }
  | { type: "RESET" };

function formReducer(state: PropertyFormState, action: FormAction): PropertyFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.key]: action.value };
    case "SET_FEATURES":
      return { ...state, features: action.features };
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
      return { ...state, photos: state.photos.filter((p) => p.id !== action.id) };
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

  const updateFeatures = useCallback(
    (features: Record<string, boolean>) => {
      dispatch({ type: "SET_FEATURES", features });
    },
    [],
  );

  // --- Derived state ---
  const readyPhotoCount = state.photos.filter((p) => p.status === "ready").length;

  const hasRequiredFields =
    state.bedrooms > 0 &&
    typeof state.sqm === "number" &&
    state.sqm > 0 &&
    typeof state.price === "number" &&
    state.price > 0 &&
    state.neighborhood !== "";

  const canGenerate = readyPhotoCount >= MIN_PHOTOS && hasRequiredFields;

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
        photos: d.photos?.length
          ? d.photos.map((p: Record<string, unknown>) => ({
              ...p,
              localPreviewUrl: (p.publicUrl as string) ?? "",
              aiAnalysis: p.aiAnalysis ?? null,
            }))
          : [],
      };
      dispatch({ type: "RESTORE_DRAFT", state: restored });
    } catch {
      // Ignore corrupt data
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { photos, ...formFields } = state;
      const draft = {
        ...formFields,
        photos: photos
          .filter((p) => (p.status === "ready" || p.status === "processing") && p.publicUrl)
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

  const handleAddPhotos = useCallback((files: File[]) => {
    files.forEach((file) => uploadPhoto(file));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemovePhoto = useCallback((id: string) => {
    dispatch({ type: "REMOVE_PHOTO", id });
  }, []);

  // --- Reset ---
  function reset() {
    sessionStorage.removeItem(DRAFT_KEY);
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
    hasRequiredFields,
    canGenerate,
    handleAddPhotos,
    handleRemovePhoto,
    reset,
    toFormData,
    clearDraft,
  };
}
