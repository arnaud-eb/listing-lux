import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockSingle = vi.fn();
const mockUpsert = vi.fn();
const mockSelect = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(), single: mockSingle })) }));
const mockFrom = vi.fn((table: string) => {
  if (table === "properties") return { select: mockSelect };
  if (table === "listings") return { upsert: mockUpsert };
  return {};
});

vi.mock("@/lib/supabase.server", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

const mockStreamText = vi.fn();
vi.mock("ai", () => ({
  streamText: (...args: unknown[]) => mockStreamText(...args),
  Output: { object: vi.fn(({ schema }: { schema: unknown }) => schema) },
}));

vi.mock("@/lib/ai/client", () => ({
  openai: vi.fn((model: string) => model),
  LISTING_MODEL: "gpt-4.1-mini",
}));

vi.mock("@/lib/markets", () => ({
  getNeighborhoodBySlug: vi.fn(() => ({
    slug: "kirchberg",
    name: "Kirchberg",
    avgPricePerSqm: 12000,
  })),
}));

vi.mock("@/lib/ai/prompts", () => ({
  buildListingPrompt: vi.fn(() => ({
    system: "You are a real estate agent.",
    user: "Generate a listing.",
  })),
  PROMPT_VERSION: "v1-test",
}));

// Import after mocks
import { POST } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/generate/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/generate/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Input validation ---

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/generate/stream", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it("returns 400 when propertyId is missing", async () => {
    const res = await POST(makeRequest({ language: "de" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/propertyId/i);
  });

  it("returns 400 for invalid language", async () => {
    const res = await POST(
      makeRequest({ propertyId: "abc-123", language: "es" }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/language must be one of/i);
  });

  it("returns 400 when language is missing", async () => {
    const res = await POST(makeRequest({ propertyId: "abc-123" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when property not found", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } });

    const res = await POST(
      makeRequest({ propertyId: "abc-123", language: "de" }),
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });

  // --- Streaming + onFinish parsing ---

  it("calls streamText with correct params and returns stream response", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "abc-123",
        neighborhood: "kirchberg",
        photo_analyses: [],
        bedrooms: 2,
        bathrooms: 1,
        sqm: 80,
        price: 500000,
        property_type: "apartment",
        features: {},
        photo_urls: [],
      },
      error: null,
    });

    const mockResponse = new Response("stream data");
    mockStreamText.mockReturnValueOnce({
      toTextStreamResponse: () => mockResponse,
    });

    const res = await POST(
      makeRequest({ propertyId: "abc-123", language: "fr" }),
    );

    expect(mockStreamText).toHaveBeenCalledTimes(1);
    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.model).toBe("gpt-4.1-mini");
    expect(callArgs.messages).toHaveLength(2);
    expect(callArgs.messages[0].role).toBe("system");
    expect(callArgs.messages[1].role).toBe("user");
    expect(typeof callArgs.onFinish).toBe("function");
    expect(res).toBe(mockResponse);
  });

  it("onFinish parses text and upserts valid listing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "abc-123",
        neighborhood: "kirchberg",
        photo_analyses: [],
        bedrooms: 2,
        bathrooms: 1,
        sqm: 80,
        price: 500000,
        property_type: "apartment",
        features: {},
        photo_urls: [],
      },
      error: null,
    });

    let capturedOnFinish: ((event: { text: string }) => Promise<void>) | null = null;

    mockStreamText.mockImplementationOnce((opts: Record<string, unknown>) => {
      capturedOnFinish = opts.onFinish as typeof capturedOnFinish;
      return { toTextStreamResponse: () => new Response("ok") };
    });

    await POST(makeRequest({ propertyId: "abc-123", language: "de" }));

    expect(capturedOnFinish).toBeTruthy();

    // Simulate AI returning valid JSON
    const validOutput = {
      title: "Luxuswohnung in Kirchberg",
      description: "Eine wunderschöne Wohnung.",
      highlights: ["Modern kitchen", "City view"],
      seo_keywords: ["kirchberg", "luxury"],
    };

    mockUpsert.mockResolvedValueOnce({ data: null, error: null });
    await capturedOnFinish!({ text: JSON.stringify(validOutput) });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        property_id: "abc-123",
        language: "de",
        title: validOutput.title,
        description: validOutput.description,
        highlights: validOutput.highlights,
        seo_keywords: validOutput.seo_keywords,
      }),
      { onConflict: "property_id,language" },
    );
  });

  it("onFinish skips upsert when text is invalid JSON", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "abc-123",
        neighborhood: "kirchberg",
        photo_analyses: [],
        bedrooms: 2,
        bathrooms: 1,
        sqm: 80,
        price: 500000,
        property_type: "apartment",
        features: {},
        photo_urls: [],
      },
      error: null,
    });

    let capturedOnFinish: ((event: { text: string }) => Promise<void>) | null = null;

    mockStreamText.mockImplementationOnce((opts: Record<string, unknown>) => {
      capturedOnFinish = opts.onFinish as typeof capturedOnFinish;
      return { toTextStreamResponse: () => new Response("ok") };
    });

    await POST(makeRequest({ propertyId: "abc-123", language: "en" }));

    // Invalid JSON — should not throw, should not upsert
    await expect(
      capturedOnFinish!({ text: "not valid json" }),
    ).rejects.toThrow(); // JSON.parse will throw

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("onFinish skips upsert when schema validation fails", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "abc-123",
        neighborhood: "kirchberg",
        photo_analyses: [],
        bedrooms: 2,
        bathrooms: 1,
        sqm: 80,
        price: 500000,
        property_type: "apartment",
        features: {},
        photo_urls: [],
      },
      error: null,
    });

    let capturedOnFinish: ((event: { text: string }) => Promise<void>) | null = null;

    mockStreamText.mockImplementationOnce((opts: Record<string, unknown>) => {
      capturedOnFinish = opts.onFinish as typeof capturedOnFinish;
      return { toTextStreamResponse: () => new Response("ok") };
    });

    await POST(makeRequest({ propertyId: "abc-123", language: "lu" }));

    // Valid JSON but missing required fields
    await capturedOnFinish!({ text: JSON.stringify({ title: "Test" }) });

    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
