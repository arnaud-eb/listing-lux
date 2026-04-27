import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LanguagesStep from "./LanguagesStep";
import type { AgentProfile } from "@/lib/types";

// LanguagesStep uses DialogHeader/Title/Description/etc. which require the
// Radix Dialog context to be present. Wrap every render in a minimal open
// Dialog so those primitives work.
function renderInDialog(ui: ReactNode) {
  return render(
    <Dialog open>
      <DialogContent>{ui}</DialogContent>
    </Dialog>,
  );
}

const POPULATED_PROFILE: AgentProfile = {
  id: "p-1",
  full_name: "Pascal Proust",
  email: "pascal@example.com",
  agency_name: "Agency Home Test",
  phone: null,
  agency_address: null,
  agency_website: null,
  logo_url: null,
};

const EMPTY_PROFILE: AgentProfile = {
  id: "p-1",
  full_name: "",
  email: "",
  agency_name: "",
  phone: "",
  agency_address: "",
  agency_website: "",
  logo_url: "",
};

const baseProps = {
  stepIndex: 2,
  totalSteps: 2,
  selectedLanguages: ["de" as const],
  onToggleLanguage: vi.fn(),
  onEditBranding: vi.fn(),
  onBack: vi.fn(),
  onDownload: vi.fn(),
  isDownloading: false,
};

describe("LanguagesStep — branding card", () => {
  describe("populated profile", () => {
    it("renders the agent's full name and agency", () => {
      renderInDialog(<LanguagesStep {...baseProps} profile={POPULATED_PROFILE} />);
      expect(screen.getByText("Pascal Proust")).toBeInTheDocument();
      expect(screen.getByText("Agency Home Test")).toBeInTheDocument();
    });

    it("shows the Edit (not Add) action", () => {
      renderInDialog(<LanguagesStep {...baseProps} profile={POPULATED_PROFILE} />);
      expect(
        screen.getByRole("button", { name: /^edit$/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^add$/i }),
      ).not.toBeInTheDocument();
    });

    it("does not render the empty-state copy", () => {
      renderInDialog(<LanguagesStep {...baseProps} profile={POPULATED_PROFILE} />);
      expect(
        screen.queryByText(/add your branding/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("empty profile (row exists, all fields cleared)", () => {
    it("renders the empty-state copy", () => {
      renderInDialog(<LanguagesStep {...baseProps} profile={EMPTY_PROFILE} />);
      expect(screen.getByText(/add your branding/i)).toBeInTheDocument();
      expect(
        screen.getByText(/optional · your logo and contact info/i),
      ).toBeInTheDocument();
    });

    it("shows the Add (not Edit) action", () => {
      renderInDialog(<LanguagesStep {...baseProps} profile={EMPTY_PROFILE} />);
      expect(
        screen.getByRole("button", { name: /^add$/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^edit$/i }),
      ).not.toBeInTheDocument();
    });

    it("calls onEditBranding when Add is clicked", async () => {
      const user = userEvent.setup();
      const onEditBranding = vi.fn();
      renderInDialog(
        <LanguagesStep
          {...baseProps}
          profile={EMPTY_PROFILE}
          onEditBranding={onEditBranding}
        />,
      );
      await user.click(screen.getByRole("button", { name: /^add$/i }));
      expect(onEditBranding).toHaveBeenCalledTimes(1);
    });
  });

  describe("no profile (first-time user, profile=null)", () => {
    it("renders the SAME empty-state copy as a cleared profile", () => {
      renderInDialog(<LanguagesStep {...baseProps} profile={null} />);
      expect(screen.getByText(/add your branding/i)).toBeInTheDocument();
      expect(
        screen.getByText(/optional · your logo and contact info/i),
      ).toBeInTheDocument();
    });

    it("shows the Add action and triggers onEditBranding", async () => {
      const user = userEvent.setup();
      const onEditBranding = vi.fn();
      renderInDialog(
        <LanguagesStep
          {...baseProps}
          profile={null}
          onEditBranding={onEditBranding}
        />,
      );
      await user.click(screen.getByRole("button", { name: /^add$/i }));
      expect(onEditBranding).toHaveBeenCalledTimes(1);
    });

    it("does not crash when rendering avatar (no full_name to charAt)", () => {
      renderInDialog(<LanguagesStep {...baseProps} profile={null} />);
      // The card itself is present.
      expect(screen.getByText(/add your branding/i)).toBeInTheDocument();
    });
  });

  describe("partially populated profile (only logo)", () => {
    it("treats logo-only as populated and shows Edit", () => {
      renderInDialog(
        <LanguagesStep
          {...baseProps}
          profile={{
            ...EMPTY_PROFILE,
            logo_url: "https://cdn.example.com/logo.png",
          }}
        />,
      );
      expect(
        screen.getByRole("button", { name: /^edit$/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/add your branding/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("whitespace-only fields (defensive)", () => {
    it("treats a profile with only whitespace as empty (shows Add)", () => {
      renderInDialog(
        <LanguagesStep
          {...baseProps}
          profile={{
            ...EMPTY_PROFILE,
            full_name: "   ",
            email: " ",
            agency_name: "\t",
          }}
        />,
      );
      expect(
        screen.getByRole("button", { name: /^add$/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/add your branding/i)).toBeInTheDocument();
    });

    it("treats a profile with one real field + others whitespace as populated", () => {
      renderInDialog(
        <LanguagesStep
          {...baseProps}
          profile={{
            ...EMPTY_PROFILE,
            full_name: "  ",
            agency_name: "Real Agency",
            email: "\t",
          }}
        />,
      );
      expect(
        screen.getByRole("button", { name: /^edit$/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Real Agency")).toBeInTheDocument();
    });
  });
});
