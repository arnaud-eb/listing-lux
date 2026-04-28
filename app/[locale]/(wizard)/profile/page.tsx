import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAgentProfile } from "./actions";
import ProfileClient from "./profile-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("profileTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function ProfilePage() {
  const profile = await getAgentProfile();
  const t = await getTranslations("wizard.profile");
  const tCommon = await getTranslations("common");

  return (
    <div className="min-h-screen bg-bg-light">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-navy-deep">
            {t("title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-navy-deep mb-6">
            {t("brandingHeading")}
          </h2>
          <ProfileClient profile={profile} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-navy-deep">
              {t("socialMediaHeading")}
            </h2>
            <span className="text-2xs text-gold border border-gold/30 rounded-full px-2.5 py-0.5">
              {tCommon("comingSoon")}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2">{t("socialMediaBody")}</p>
        </div>
      </div>
    </div>
  );
}
