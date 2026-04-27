import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PdfExportWizard from "./PdfExportWizard";
import type { AgentProfile, Property } from "@/lib/types";

// next/image stub for JSDOM (PhotoSelector uses it).
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

// PhoneInput pulls in react-phone-number-input which is heavy + JSDOM-unfriendly.
vi.mock("@/components/profile/PhoneInput", () => ({
  default: ({
    value,
    onChange,
    id,
  }: {
    value: string;
    onChange: (v: string) => void;
    id?: string;
  }) => (
    <input
      data-testid="phone-input-stub"
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Server-action mocks. Profile actions and PDF client.
const upsertSpy = vi.fn();
const getProfileSpy = vi.fn();

vi.mock("@/app/(wizard)/profile/actions", () => ({
  upsertAgentProfile: (input: unknown) => upsertSpy(input),
  uploadAgentLogo: vi.fn(),
  removeAgentLogo: vi.fn(),
  getAgentProfile: () => getProfileSpy(),
}));

vi.mock("@/lib/pdf-client", () => ({
  downloadPDF: vi.fn(),
}));

const PROPERTY: Property = {
  id: "prop-1",
  bedrooms: 3,
  bathrooms: 2,
  sqm: 100,
  price: 800_000,
  neighborhood: "Cents",
  property_type: "duplex",
  features: {},
  photo_urls: [
    "https://cdn.example.com/p1.jpg",
    "https://cdn.example.com/p2.jpg",
  ],
  created_at: "2026-04-21T00:00:00.000Z",
};

const PROFILE: AgentProfile = {
  id: "profile-1",
  full_name: "Pascal Proust",
  email: "pascal@example.com",
  agency_name: "Agency Home Test",
  phone: null,
  agency_address: null,
  agency_website: null,
  logo_url: null,
};

describe("PdfExportWizard — edit-from-Languages flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProfileSpy.mockResolvedValue(PROFILE);
    upsertSpy.mockImplementation(async (input: Partial<AgentProfile>) => ({
      ...PROFILE,
      ...input,
    }));
  });

  it("walks Photos → Languages → Edit → Save → back to Languages (no reset to Photos)", async () => {
    const user = userEvent.setup();
    render(
      <PdfExportWizard open onOpenChange={vi.fn()} property={PROPERTY} />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /select photos for the pdf/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      screen.getByRole("heading", { name: /select languages/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(
      screen.getByRole("heading", { name: /edit your branding/i }),
    ).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, "new@example.com");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(upsertSpy).toHaveBeenCalledTimes(1));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /select languages/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("heading", { name: /select photos for the pdf/i }),
    ).not.toBeInTheDocument();
  });

  /**
   * Regression test for the actual root cause: `revalidatePath("/", "layout")`
   * inside upsertAgentProfile triggers the listing server component tree
   * to re-render, pushing a NEW `property` object reference down to the
   * wizard. If the wizard's init useEffect depends on the property
   * reference (rather than property.id), it re-runs mid-flow and resets
   * wizard state — dumping the user back at Photos after a save.
   */
  it("does NOT reset wizard state when the property prop reference changes mid-flow", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const { rerender } = render(
      <PdfExportWizard
        open
        onOpenChange={onOpenChange}
        property={PROPERTY}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /select photos for the pdf/i }),
      ).toBeInTheDocument(),
    );

    // Advance to Languages.
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      screen.getByRole("heading", { name: /select languages/i }),
    ).toBeInTheDocument();

    // Simulate the post-save server-tree re-render: parent passes a NEW
    // property object with the SAME id.
    rerender(
      <PdfExportWizard
        open
        onOpenChange={onOpenChange}
        property={{ ...PROPERTY }}
      />,
    );

    // The wizard should stay on Languages, not snap back to Photos.
    expect(
      screen.getByRole("heading", { name: /select languages/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /select photos for the pdf/i }),
    ).not.toBeInTheDocument();
  });
});
