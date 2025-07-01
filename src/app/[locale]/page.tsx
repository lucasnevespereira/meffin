import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <div className="relative min-h-screen">
      <Header />

      <div className="flex flex-col gap-5 items-center justify-center h-screen px-5 text-center">
        <Image
          src="/logo.png"
          alt="Meffin"
          width={100}
          height={100}
          className="rounded-lg dark:invert"
        />

        <h1 className="text-4xl font-bold">{t("title")}</h1>

        <p className="text-lg">{t("about")}</p>

        <div className="flex gap-2">
          <Link href="/login">
            <Button>{t("login")}</Button>
          </Link>
          <Link href="/signup">
            <Button>{t("signup")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
