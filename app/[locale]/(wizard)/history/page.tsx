import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createServiceClient } from "@/lib/supabase.server";
import { getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import type { ListingKind } from "@/lib/constants";
import { getBySlugs } from "@/lib/localities/repository";
import { pickLocalized } from "@/lib/localities/locale";
import type { Language } from "@/lib/types";
import type { KindFilter } from "./HistoryFilter";
import HistoryShell from "./HistoryShell";
import {
  HISTORY_PAGE_SIZE,
  toHistoryRow,
  type PropertyWithListings,
} from "./types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("historyTitle") };
}

function parseKindFilter(raw: string | string[] | undefined): KindFilter {
  return raw === "sale" || raw === "rent" ? raw : "all";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string | string[] }>;
}) {
  const sessionId = await getSessionId();
  const t = await getTranslations("wizard.history");

  if (!sessionId) {
    return <EmptyState />;
  }

  const supabase = createServiceClient();
  const kindFilter = parseKindFilter((await searchParams).kind);

  let propertiesQuery = supabase
    .from("properties")
    .select("*, listings(title, language)")
    .eq("session_id", sessionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(HISTORY_PAGE_SIZE + 1);

  if (kindFilter !== "all") {
    propertiesQuery = propertiesQuery.eq("listing_kind", kindFilter);
  }

  const countQuery = (kind: ListingKind) =>
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .is("deleted_at", null)
      .eq("listing_kind", kind);

  const [{ data: properties }, { count: saleCount }, { count: rentCount }] =
    await Promise.all([propertiesQuery, countQuery("sale"), countQuery("rent")]);

  const totalCount = (saleCount ?? 0) + (rentCount ?? 0);
  if (totalCount === 0) {
    return <EmptyState />;
  }

  const showFilter = (saleCount ?? 0) > 0 && (rentCount ?? 0) > 0;

  const fetched =
    (properties as unknown as PropertyWithListings[] | null) ?? [];
  const initialHasMore = fetched.length > HISTORY_PAGE_SIZE;
  const initialPage = initialHasMore
    ? fetched.slice(0, HISTORY_PAGE_SIZE)
    : fetched;

  const slugs = [...new Set(initialPage.map((p) => p.neighborhood))];
  const localityMap = await getBySlugs(slugs);
  const locale = (await getLocale()) as Language;
  const resolveName = (slug: string) =>
    pickLocalized(localityMap.get(slug)?.nameLocalized, locale, slug);
  const initialRows = initialPage.map((p) => toHistoryRow(p, resolveName(p.neighborhood)));

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy-deep">
          {t("title")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      <HistoryShell
        initialRows={initialRows}
        initialHasMore={initialHasMore}
        kind={kindFilter}
        showFilter={showFilter}
      />
    </div>
  );
}

async function EmptyState() {
  const t = await getTranslations("wizard.history");
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <h2 className="font-serif text-2xl font-bold text-navy-deep">
          {t("emptyTitle")}
        </h2>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          {t("emptyBody")}
        </p>
        <Button
          asChild
          className="mt-2 bg-gold text-navy-deep hover:bg-gold/90 rounded-lg shadow-none"
        >
          <Link href="/create">{t("createListing")}</Link>
        </Button>
      </div>
    </div>
  );
}
