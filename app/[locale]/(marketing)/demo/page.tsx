import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  const t = useTranslations("demo");

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <div className="text-5xl mb-6">{t("icon")}</div>
        <h1 className="font-serif text-3xl font-bold text-navy-deep mb-4">
          {t("title")}
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">{t("description")}</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button asChild variant="outline">
            <Link href="/">{t("backHome")}</Link>
          </Button>
          <Button
            asChild
            className="bg-gold text-white hover:bg-gold/90 border-0"
          >
            <Link href="/create">{t("createListing")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
