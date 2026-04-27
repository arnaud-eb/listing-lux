import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BrandingForm from "./BrandingForm";
import type { AgentProfile } from "@/lib/types";

// Stub the server actions — these tests focus on form behavior, not the
// upsert path.
vi.mock("@/app/(wizard)/profile/actions", () => ({
  upsertAgentProfile: vi.fn(),
  uploadAgentLogo: vi.fn(),
  removeAgentLogo: vi.fn(),
}));

// Real PhoneInput pulls in react-phone-number-input which is heavy and
// JSDOM-unfriendly; we don't exercise it here.
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

const PROFILE: AgentProfile = {
  id: "p-1",
  full_name: "Arnaud",
  email: "arnaud@example.com",
  agency_name: "Unicorn",
  phone: "+352 661 30 87 00",
  agency_address: "1 Rue de Clausen",
  agency_website: "https://unicorn.lu",
  logo_url: null,
};

describe("BrandingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("dirty state", () => {
    it("starts clean (onDirtyChange called with false)", () => {
      const onDirty = vi.fn();
      render(<BrandingForm profile={PROFILE} onDirtyChange={onDirty} />);
      expect(onDirty).toHaveBeenCalledWith(false);
    });

    it("becomes dirty when a field is edited", async () => {
      const user = userEvent.setup();
      const onDirty = vi.fn();
      render(<BrandingForm profile={PROFILE} onDirtyChange={onDirty} />);

      onDirty.mockClear();
      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, " Depierreux");
      expect(onDirty).toHaveBeenLastCalledWith(true);
    });

    it("returns to clean when the edit is reverted", async () => {
      const user = userEvent.setup();
      const onDirty = vi.fn();
      render(<BrandingForm profile={PROFILE} onDirtyChange={onDirty} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, "X");
      onDirty.mockClear();
      await user.type(nameInput, "{Backspace}");
      expect(onDirty).toHaveBeenLastCalledWith(false);
    });

    /**
     * Regression test: after Save, the parent re-fetches via revalidatePath
     * and re-renders with a NEW `profile` reference whose CONTENT equals
     * what the user just typed. The form must reset its dirty baseline so
     * the indicator dot disappears. With a useRef baseline, this failed —
     * the equal state-setter calls were skipped (Object.is), no re-render
     * fired, and isDirty stayed stuck on `true`.
     */
    it("clears dirty when a new profile prop matching the user's edits arrives (post-save revalidate)", async () => {
      const user = userEvent.setup();
      const onDirty = vi.fn();
      const { rerender } = render(
        <BrandingForm profile={PROFILE} onDirtyChange={onDirty} />,
      );

      // User edits the email — form becomes dirty.
      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, "new@example.com");
      expect(onDirty).toHaveBeenLastCalledWith(true);

      onDirty.mockClear();

      // Simulate post-save revalidate: parent passes a NEW profile object
      // whose content matches the user's edits.
      rerender(
        <BrandingForm
          profile={{ ...PROFILE, email: "new@example.com" }}
          onDirtyChange={onDirty}
        />,
      );

      // Dirty must transition back to false (the dot must disappear).
      expect(onDirty).toHaveBeenLastCalledWith(false);
    });

    it("trims whitespace before comparing — trailing space alone is not dirty", async () => {
      const user = userEvent.setup();
      const onDirty = vi.fn();
      render(<BrandingForm profile={PROFILE} onDirtyChange={onDirty} />);

      // Form starts clean; clear the initial false call.
      onDirty.mockClear();
      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, " ");
      // After trim, value still equals initial → state never transitioned
      // to dirty, so the callback should not have fired again.
      expect(onDirty).not.toHaveBeenCalled();
    });
  });

  describe("validity", () => {
    it("accepts an empty profile (all fields optional)", () => {
      const onValid = vi.fn();
      render(<BrandingForm profile={null} onValidityChange={onValid} />);
      // Empty + clean → not submittable (nothing to save), but not because
      // of validation errors.
      expect(onValid).toHaveBeenCalledWith(false);
    });

    it("becomes submittable when a field is edited and email is empty", async () => {
      const user = userEvent.setup();
      const onValid = vi.fn();
      render(<BrandingForm profile={null} onValidityChange={onValid} />);

      onValid.mockClear();
      await user.type(screen.getByLabelText(/full name/i), "Test User");
      expect(onValid).toHaveBeenLastCalledWith(true);
    });

    it("blocks submit when email is malformed", async () => {
      const user = userEvent.setup();
      const onValid = vi.fn();
      render(<BrandingForm profile={null} onValidityChange={onValid} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "not-an-email");
      expect(onValid).toHaveBeenLastCalledWith(false);
    });

    it("re-enables submit when malformed email is fixed", async () => {
      const user = userEvent.setup();
      const onValid = vi.fn();
      render(<BrandingForm profile={null} onValidityChange={onValid} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "broken");
      onValid.mockClear();
      await user.clear(emailInput);
      await user.type(emailInput, "fixed@example.com");
      expect(onValid).toHaveBeenLastCalledWith(true);
    });
  });

  describe("email error", () => {
    it("does NOT show error while typing (before blur)", async () => {
      const user = userEvent.setup();
      render(<BrandingForm profile={null} />);
      await user.type(screen.getByLabelText(/email/i), "bad");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows inline error after blur with malformed email", async () => {
      const user = userEvent.setup();
      render(<BrandingForm profile={null} />);
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "bad");
      await user.tab();
      expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
    });

    it("clears the error when email becomes valid", async () => {
      const user = userEvent.setup();
      render(<BrandingForm profile={null} />);
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "bad");
      await user.tab();
      expect(screen.getByRole("alert")).toBeInTheDocument();

      await user.click(emailInput);
      await user.clear(emailInput);
      await user.type(emailInput, "good@example.com");
      await user.tab();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("required field markers", () => {
    it("does not render asterisks on Full Name or Email labels", () => {
      render(<BrandingForm profile={null} />);
      const nameLabel = screen.getByText("Full Name");
      const emailLabel = screen.getByText("Email");
      expect(nameLabel.textContent).not.toContain("*");
      expect(emailLabel.textContent).not.toContain("*");
    });
  });

  describe("Clear all button visibility", () => {
    /**
     * Clear All targets persisted state — typing into a fresh form is not
     * a destructive operation. The button must NOT appear for first-time
     * users typing in their info.
     */
    it("does NOT render when there is no saved profile (first-time user)", async () => {
      const user = userEvent.setup();
      render(<BrandingForm profile={null} showClearAll />);

      // Even after typing, no Clear all should appear — nothing persisted.
      await user.type(screen.getByLabelText(/full name/i), "Pascal");
      expect(
        screen.queryByRole("button", { name: /clear all/i }),
      ).not.toBeInTheDocument();
    });

    it("does NOT render when the saved profile has only blank fields", () => {
      render(
        <BrandingForm
          profile={{
            ...PROFILE,
            full_name: "",
            email: "",
            agency_name: null,
            phone: null,
            agency_address: null,
            agency_website: null,
            logo_url: null,
          }}
          showClearAll
        />,
      );
      expect(
        screen.queryByRole("button", { name: /clear all/i }),
      ).not.toBeInTheDocument();
    });

    it("renders when the saved profile has branding to clear", () => {
      render(<BrandingForm profile={PROFILE} showClearAll />);
      expect(
        screen.getByRole("button", { name: /clear all/i }),
      ).toBeInTheDocument();
    });

    it("does NOT render when showClearAll prop is false (default)", () => {
      render(<BrandingForm profile={PROFILE} />);
      expect(
        screen.queryByRole("button", { name: /clear all/i }),
      ).not.toBeInTheDocument();
    });
  });
});
