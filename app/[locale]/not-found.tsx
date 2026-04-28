import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default async function LocaleNotFound() {
  const t = await getTranslations("wizard.errors");

  return (
    <div className="container mx-auto px-6 pb-12">
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="size-16 rounded-full bg-gold/15 flex items-center justify-center">
          <Search className="size-7 text-gold" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-deep">
          {t("notFoundTitle")}
        </h1>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          {t("notFoundBody")}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Button
            asChild
            variant="outline"
            className="rounded-lg shadow-none border-gray-300"
          >
            <Link href="/history">{t("notFoundCtaSecondary")}</Link>
          </Button>
          <Button
            asChild
            className="rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
          >
            <Link href="/create">{t("notFoundCtaPrimary")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
