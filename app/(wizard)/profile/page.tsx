import type { Metadata } from "next";
import { getAgentProfile } from "./actions";
import ProfileClient from "./profile-client";

export const metadata: Metadata = {
  title: "Your Profile — ListingLux AI",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const profile = await getAgentProfile();

  return (
    <div className="min-h-screen bg-bg-light">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-navy-deep">
            Your Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your professional branding for PDF exports
          </p>
        </div>

        {/* Profile form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-navy-deep mb-6">
            Branding Information
          </h2>
          <ProfileClient profile={profile} />
        </div>

        {/* Coming Soon — Social Media */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-navy-deep">
              Social Media
            </h2>
            <span className="text-2xs text-gold border border-gold/30 rounded-full px-2.5 py-0.5">
              Coming Soon
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Connect your Facebook and Instagram accounts to share listings
            directly from ListingLux AI.
          </p>
        </div>
      </div>
    </div>
  );
}
